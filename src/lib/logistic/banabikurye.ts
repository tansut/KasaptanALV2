import { LogisticProvider, VehicleType, FromTo, OfferRequest, OfferResponse, Point, LogisticFactory, OrderRequest, OrderResponse, PriceSlice, CustomerPriceConfig, LogisticProviderOptions } from "./core";
import axios, { AxiosResponse } from "axios";
import Helper from "../helper";
import { off } from "process";
import { ComissionHelper } from "../commissionHelper";
import { DispatcherTypeDesc, DispatcherType } from "../../db/models/dispatcher";
import DBCache from "../../db/models/dbcache";

export interface BanabikuryeConfig {
    apiKey: string,
    uri: string;
    cache: boolean;
}

interface BanabikuryeRequest {

}

interface BanabikuryeResponse {
    is_successful: boolean;
}


export default class BanabikuryeProvider extends LogisticProvider {
    config: BanabikuryeConfig;
    vehicle: VehicleType;



    calculateCustomerFee(offer: OfferResponse | OrderResponse): OfferResponse | OrderResponse {
        let regularFee = offer.totalFee;
        let customerFee = offer.totalFee;
        if (regularFee > 0.00 && offer.orderTotal > 0.00) {
            let dispatcherFee = Helper.asCurrency(regularFee / 1.18);
            let calcRegular = new ComissionHelper(this.options.dispatcher.butcher.commissionRate, this.options.dispatcher.butcher.commissionFee, this.options.dispatcher.butcher.vatRate);
            let calc = new ComissionHelper(this.options.dispatcher.butcher.noshipCommissionRate, this.options.dispatcher.butcher.noshipCommissionFee, this.options.dispatcher.butcher.vatRate);
            let commissionRegular = calcRegular.calculateButcherComission(offer.orderTotal);
            let commission = calc.calculateButcherComission(offer.orderTotal);
            let diff = commission.kalitteFee - commissionRegular.kalitteFee;
            let contribute = Helper.asCurrency(diff);
            let calculated = Helper.asCurrency(Math.max(0.00, dispatcherFee - contribute));
            let calculatedVat = Helper.asCurrency(calculated * 0.18)
            let totalShip = Helper.asCurrency(Math.round(calculated + calculatedVat));
            customerFee = totalShip > 0.00 ? Math.max(5.00, totalShip) : 0.00;
        }
        offer.customerFee = this.roundCustomerFee(customerFee);
        return offer;
    }



    async get<T>(method: string) {
        const config = {
            headers: {
                'X-DV-Auth-Token': this.config.apiKey
            }
        }
        return await axios.get<T>(`${this.config.uri}/${method}`, config)
    }

    async post<T>(method: string, req: BanabikuryeRequest) {
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
            required_start_datetime: p.start ? p.start : undefined,
            required_finish_datetime: p.finish ? p.finish : undefined,
            note: p.note,
            apartment_number: p.apartment,
            entrance_number: p.entrance,
            floor_number: p.floor,
            packages: []
        }
    }

    fromBnbPoint(p: any): Point {
        return {
            //id: p.point_id,
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
            vehicle_type_id: this.vehicle, 
            is_contact_person_notification_enabled: oreq.notifyCustomerSms,
            points: []
        }
        oreq.points.forEach(p => {
            req.points.push(this.toBnbPoint(p))
        })
        return req;
    }

    toOrderRequest(oreq: OrderRequest): BanabikuryeRequest {
        let req = {
            total_weight_kg: oreq.weight,
            matter: oreq.matter,
            vehicle_type_id: 8, 
            is_contact_person_notification_enabled: oreq.notifyCustomerSms,
            points: []
        }
        oreq.points.forEach(p => {
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
                points: order['points'].map(p => this.fromBnbPoint(p)),
                weightFee: parseFloat(order['weight_fee_amount']),
                totalFee: parseFloat(order['payment_amount']),
                customerFee: parseFloat(order['payment_amount']),
                orderTotal: 0.00,

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
                orderTotal: 0.00,
                customerFee: parseFloat(order['payment_amount']),
                createDate: order['created_datetime'],
                finishDate: order['finish_datetime'],
                status: order['status'],
                statusDesc: order['status_description'],
                deliveryFee: parseFloat(order['delivery_fee_amount']),
                payment: parseFloat(order['payment_amount']),
                discount: parseFloat(order['discount_amount']),
                points: order['points'].map(p => this.fromBnbPoint(p)),
                weightFee: parseFloat(order['weight_fee_amount']),
                totalFee: parseFloat(order['payment_amount'])
            }
            return res;
        } else {
            throw new Error('Taşıma teklifi alınamadı')
        }
    }

    async priceSlice(ft: FromTo, slice: number = 100.00, options = {}): Promise<PriceSlice[]> {
        let prices = [], result: PriceSlice[] = [];
        let offerRequest = this.offerRequestFromTo(ft);
        let offer = await this.requestOffer(offerRequest);

        for (let i = 1; i < 10; i++)
            prices.push(Helper.asCurrency(i * slice))

        for (let i = 0; i < prices.length; i++) {
            offer.orderTotal = Helper.asCurrency((2 * prices[i] + slice) / 2);
            this.calculateCustomerFee(offer);
            let item = {
                start: prices[i],
                end: prices[i] + slice,
                cost: offer.customerFee
            }
            result.push(item)
            if (offer.customerFee <= 0.00) {
                item.end = 0.00;
                break
            };
        }

        return this.optimizedSlice(result);
    }

    convertExc(exc: Error) {
        if (exc['response'] && exc['response']['data'] && exc['response']['data']['errors']) {
            return new Error(exc['response']['data']['errors'].join(',') + JSON.stringify(exc['response']['data']))
        } else return exc;
    }

    async safeResponse<T>(method: string, req: BanabikuryeRequest, distance: number, convert?: Function): Promise<T> {
        let resp: T = null;
        try {
            let result = await this.post<BanabikuryeResponse>(method, req);
            resp = convert ? convert(result.data): result.data;
        } catch(e) {
            if (!this.safeRequests) throw this.convertExc(e);
            let fee = Helper.asCurrency(10.00 + distance * 2);
            resp = <any>{                
                customerFee: fee,
                totalFee: fee,
                orderTotal: 0.00
            }
        } 
        return resp;
    }

    async requestOffer(req: OfferRequest): Promise<OfferResponse> {
        let request = this.toOfferRequest(req);
        req.distance  = await this.distance({
            start: {
                type: 'Point',
                coordinates: [req.points[0].lat, req.points[0].lng]
            },
            sId: req.points[0].id,

            finish: {
                type: 'Point',
                coordinates: [req.points[1].lat, req.points[1].lng],
            },
            fId: req.points[1].id,
        });

        let cacheKey = req.points[0].id + '-' + req.points[1].id;



        let resp: OfferResponse = this.config.cache ? await DBCache.retrieve(cacheKey, 15): null;
        if (!resp) {
            resp = await this.safeResponse<OfferResponse>("calculate-order",request, req.distance, this.fromOfferResponse.bind(this));
            this.config.cache && await DBCache.put(cacheKey, resp)
        }
        resp.orderTotal = req.orderTotal;
        resp.distance = req.distance;
        return this.calculateCustomerFee(resp)
        
    }

    async cancelOrder(id: string) {
            let resp = await this.post<BanabikuryeResponse>("cancel-order", {order_id: id});
        if (!resp.data.is_successful) {
            throw new Error("Kurye iptal edilemedi")
        }
    }

    async createOrder(req: OrderRequest): Promise<OrderResponse> {
        req.distance  = await this.distance({
            start: {
                type: 'Point',
                coordinates: [req.points[0].lat, req.points[0].lng]
            },
            sId: req.points[0].id,

            finish: {
                type: 'Point',
                coordinates: [req.points[1].lat, req.points[1].lng],
            },
            fId: req.points[1].id,
        });
        let request = this.toOrderRequest(req);
        let resp: OrderResponse = await this.safeResponse<OrderResponse>("create-order", request, req.distance, this.fromOrderResponse.bind(this));
        resp.orderTotal = req.orderTotal;
        resp.distance = req.distance;
        return <any>this.calculateCustomerFee(resp)
    }

    static register() {
        LogisticFactory.register("banabikurye", BanabikuryeProvider)
    }

    constructor(config: BanabikuryeConfig, options: LogisticProviderOptions) {
        super(config, options);
        this.name = DispatcherTypeDesc["kasaptanal/motokurye"];
        this.config = config;
        this.vehicle = VehicleType.Motor
        options.dispatcher.name = DispatcherTypeDesc[options.dispatcher.type];
        options.dispatcher.min = options.dispatcher.min || Helper.asCurrency(80);
    }
}