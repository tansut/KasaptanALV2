import { LogisticProvider, VehicleType, FromTo, OfferRequest, OfferResponse, Point, LogisticFactory, OrderRequest, OrderResponse, PriceSlice, CustomerPriceConfig, LogisticProviderOptions, CustomerPriceParams } from "./core";
import axios, { AxiosResponse } from "axios";
import Helper from "../helper";
import { off } from "process";

export interface BanabikuryeConfig {
    apiKey: string,
    uri: string;
}

interface BanabikuryeRequest {

}

interface BanabikuryeResponse {
    is_successful: boolean;    
}

export default class BanabikuryeProvider extends LogisticProvider {
    static key = "banabikurye";
    config: BanabikuryeConfig;



    getCustomerFeeConfig(): CustomerPriceConfig {
        let config: CustomerPriceConfig = {
            contribitionRatio: 0.04,
            freeShipPerKM: 25,
            pricePerKM: 1.5,
            priceStartsAt: 5,
            maxDistance: 20,
            minOrder: 100,
        }
        return config;
    }

    calculateFeeForCustomer(params: CustomerPriceParams): OfferResponse {
        if (!params.regularPrice)
            params.regularPrice = this.lastOffer.totalFee;
        return super.calculateFeeForCustomer(params)
    }   

    async priceSlice(ft: FromTo, slice: number = 100.00, options = {}): Promise<PriceSlice[]> {
        let prices = [], result: PriceSlice []=[];
        let offer = await this.offerFromTo(ft);
        let distance = Helper.distance(ft.start, ft.finish);
        for(let i = 0; i < 10; i++)
            prices.push(Helper.asCurrency(i*slice))        

            for(let i = 0; i < 10; i++)
                prices.push(Helper.asCurrency(i*slice));
                
            for(let i = 0; i < prices.length; i++) {
                    let cost = (this.calculateFeeForCustomer({
                        orderTotal: prices[i],
                        regularPrice: offer.totalFee
                    }));
                    if (cost) {
                        let item = {
                            start: prices[i],
                            end: prices[i] + slice,
                            cost: cost.totalFee
                        }
                        result.push(item)
                        if (cost.totalFee <= 0.00) {
                            item.end = 0.00;
                            break
                        };
                    }
            }
    
            return result;


    }
    




    async get<T>(method: string) {
        const config = {
            headers: {
                'X-DV-Auth-Token': this.config.apiKey
            }
        }
        return await axios.get<T>(`${this.config.uri}/${method}`, config)
    }

    async post<T>(method: string, req:BanabikuryeRequest) {
        const config = {
            headers: {
                'X-DV-Auth-Token': this.config.apiKey
            }
        }
        return await axios.post<T>(`${this.config.uri}/${method}`, req, config)
    }    

    toBnbPoint(p: Point) {
        return {
            address: p.address,
            contact_person: {
                name: p.contactName,
                phone: p.contactPhone
            },
            client_order_id: p.orderId,
            latitude: p.lat,
            longitude: p.lng,
            required_start_datetime: p.start ? p.start: undefined,
            required_finish_datetime: p.finish ? p.finish: undefined,
            note: p.note,
            apartment_number: p.apartment,
            entrance_number: p.entrance,
            floor_number: p.floor,
            packages:[]
        }
    }

    fromBnbPoint(p: any): Point {
        return {
            id: p.point_id,
            contactName: p.contact_person.name, 
            contactPhone: p.contact_person.phone,
            lat: p.latitude,
            lng: p.longitude,
            address: p.address,
            orderId: p.client_order_id,
            start: p.required_start_datetime,
            finish: p.required_finish_datetime,
            arrivalEstimatedStart: p.arrival_start_datetime,
            arrivalEstimatedFinish: p.arrival_finish_datetime,     
            arrivalActual: p.courier_visit_datetime  
        }
    }    

    toOfferRequest(oreq: OfferRequest): BanabikuryeRequest {
        let req = {
            total_weight_kg: oreq.weight,
            matter: oreq.matter,
            is_contact_person_notification_enabled: oreq.notifyCustomerSms,
            points: []
        }
        
        oreq.points.forEach(p=> {
            req.points.push(this.toBnbPoint(p))
        })
        return req;
    }

    toOrderRequest(oreq: OrderRequest): BanabikuryeRequest {
        let req = {
            total_weight_kg: oreq.weight,
            matter: oreq.matter,
            is_contact_person_notification_enabled: oreq.notifyCustomerSms,
            points: []
        }
        oreq.points.forEach(p=> {
            req.points.push(this.toBnbPoint(p))
        })
        return req;
    }    

    fromOfferResponse(ores: BanabikuryeResponse): OfferResponse {
        if (ores.is_successful) {
            let order = ores['order'];
            let res: OfferResponse = {
                deliveryFee: parseFloat(order['delivery_fee_amount']),
                discount: parseFloat(order['discount_amount']),
                points: order['points'].map(p=>this.fromBnbPoint(p)),
                weightFee: parseFloat(order['weight_fee_amount']),                
                totalFee: parseFloat(order['payment_amount']),   
                customerFee: parseFloat(order['payment_amount'])
            }    
            return res;            
        } else {
            throw new Error('Taşıma teklifi alınamadı')
        }
    }    

    fromOrderResponse(ores: BanabikuryeResponse): OrderResponse {
        if (ores.is_successful) {
            let order = ores['order'];
            let res: OrderResponse = {
                orderId: order['order_id'],
                createDate: order['created_datetime'],
                finishDate: order['finish_datetime'],
                status: order['status'],
                statusDesc: order['status_description'],                
                deliveryFee: parseFloat(order['delivery_fee_amount']),
                payment: parseFloat(order['payment_amount']), 
                discount: parseFloat(order['discount_amount']),
                points: order['points'].map(p=>this.fromBnbPoint(p)),
                weightFee: parseFloat(order['weight_fee_amount']),
                totalFee: parseFloat(order['payment_amount'])    
            }    
            return res;            
        } else {
            throw new Error('Taşıma teklifi alınamadı')
        }
    }  

    async requestOffer(req: OfferRequest): Promise<OfferResponse> {
        let request = this.toOfferRequest(req);
        let result = await this.post<BanabikuryeResponse>("calculate-order", request);
        return this.fromOfferResponse(result.data);
    }

    async createOrder(req: OrderRequest): Promise<OrderResponse> {
        let request = this.toOrderRequest(req);
        let result = await this.post<BanabikuryeResponse>("create-order", request);
        return this.fromOrderResponse(result.data);        
    }        

    static register() {
        LogisticFactory.register(BanabikuryeProvider.key, BanabikuryeProvider)
    }

    constructor(config: BanabikuryeConfig, options: LogisticProviderOptions) {
        super(config, options);      
        this.config = config;  
    }
}