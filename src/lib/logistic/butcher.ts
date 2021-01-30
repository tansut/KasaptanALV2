import {
    LogisticProvider, LogisticFactory, PriceSlice, FromTo, CustomerPriceConfig,
    OfferResponse, CustomerPriceParams, OfferRequest, OrderRequest, LogisticProviderOptions, OrderResponse
} from "./core";
import Dispatcher, { DispatcherTypeDesc } from "../../db/models/dispatcher";
import Helper from "../helper";
import { off } from "process";

export class ButcherManualLogistics extends LogisticProvider {
    static key = "butcher";


    static register() {
        LogisticFactory.register(ButcherManualLogistics.key, ButcherManualLogistics)
    }



    async requestOffer(req: OfferRequest): Promise<OfferResponse> {
        if (req.orderTotal < this.options.dispatcher.minCalculated)
            return null;
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
        let fee = 0.00;
        if (this.options.dispatcher.totalForFree <= 0) {
            fee = this.options.dispatcher.fee
        }
        else fee = (Math.max(0.00, (this.options.dispatcher.totalForFree - req.orderTotal > 0) ? this.options.dispatcher.fee : 0))
        return {
            totalFee: this.options.dispatcher.fee,
            customerFee: fee,
            orderTotal: 0.00,
            distance: req.distance
        }
    }

    async offerFromTo(fromTo: FromTo): Promise<OfferResponse> {
        let req = this.offerRequestFromTo(fromTo);
        return this.requestOffer(req)
    }

    async priceSlice(distance: FromTo, slice: number = 50.00): Promise<PriceSlice[]> {

        let arr: PriceSlice[] = []

        if (this.options.dispatcher) {
            if (this.options.dispatcher.fee > 0.0) {
                arr.push({
                    start: this.options.dispatcher.minCalculated,
                    end: this.options.dispatcher.totalForFree,
                    cost: this.options.dispatcher.fee
                })
            }
            if (this.options.dispatcher.totalForFree > 0.00) {
                arr.push({
                    start: this.options.dispatcher.totalForFree,
                    cost: 0.00
                })
            }
            if (arr.length == 0) {
                arr.push({
                    start: this.options.dispatcher.minCalculated,
                    end: this.options.dispatcher.totalForFree,
                    cost: this.options.dispatcher.fee
                })
            }
        }

        return this.optimizedSlice(arr);
    }

    constructor(config: any, options: LogisticProviderOptions) {
        super(config, options);
        options.dispatcher.name = DispatcherTypeDesc[options.dispatcher.type];      
    }
}



export class ButcherAutoLogistics extends LogisticProvider {
    static key = "butcher/auto";

    static register() {
        LogisticFactory.register(ButcherAutoLogistics.key, ButcherAutoLogistics)
    }


    getCustomerFeeConfig(): CustomerPriceConfig {

        let butcherConfig = this.options.dispatcher.butcher.logisticSetings || {};

        let config: CustomerPriceConfig = {
            contrib: 0.06,
            kmPrice: 2.2,
            kmMin: 5,
            kmMultiplier: 0.5,
            minMultiplier: 10.00
            //minOrder: 100.00 
        }

        return butcherConfig["butcher/auto"] || config;
    }

    async requestOffer(req: OfferRequest): Promise<OfferResponse> {
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
        let config = this.getCustomerFeeConfig();

        let res: OfferResponse = {
            orderTotal: req.orderTotal,
            totalFee: Helper.asCurrency(config.kmPrice * req.distance),
            points: req.points,
            customerFee: Helper.asCurrency(config.kmPrice * req.distance),
            distance: req.distance
        }
        return this.calculateCustomerFee(res)
    }


    async createOrder(req: OrderRequest): Promise<OrderResponse> {
        return null;
    }

    calculateCustomerFee(offer: OfferResponse | OrderResponse) {
        let input: CustomerPriceConfig = this.getCustomerFeeConfig();
        let kmMax = this.options.dispatcher.butcher.radiusAsKm;
        let distance = offer.distance < input.kmMin ? input.kmMin: offer.distance;
        let maxMinKmDif = kmMax - input.kmMin;
        let distanceDif = distance - input.kmMin;
        let kmRatio = distanceDif / maxMinKmDif;
        let regMin = this.options.dispatcher.min;
        let kmPrice = Helper.asCurrency(input.kmPrice * (1.00 + kmRatio * input.kmMultiplier));
        let regCost = Helper.asCurrency((distance - input.kmMin) * kmPrice);
        let fee = regCost;
        this.options.dispatcher.min = this.options.dispatcher.min || 100.00;
        if (distance > input.kmMin && input.minMultiplier) {
            this.options.dispatcher.minCalculated = Helper.asCurrency(Math.ceil((this.options.dispatcher.min + (distance - input.kmMin) * input.minMultiplier)/50)*50)
        }

        if (kmMax && distance > kmMax)
           fee = -1;
        else if (this.options.dispatcher.minCalculated && offer.orderTotal < this.options.dispatcher.minCalculated)
            fee = -1;    
        else if (this.options.dispatcher.totalForFree && this.options.dispatcher.totalForFree <= offer.orderTotal)
            fee = 0.00;
        else {
            let contribDif = Math.max(0.00, offer.orderTotal - this.options.dispatcher.totalForFree);
            let contrib = input.contrib ? Helper.asCurrency(contribDif * input.contrib) : 0.00;
            let calc = Math.max(0.00, regCost - contrib);
            fee = this.roundCustomerFee(calc);
        }

        if (fee >=0.00) {
            offer.customerFee = fee;
        } 
        return fee < 0.00 ? null: offer;
    }

    async priceSlice(ft: FromTo, slice: number = 100.00, options = {}): Promise<PriceSlice[]> {
        let prices: number [] = [], result: PriceSlice[] = [];
        let offerRequest = this.offerRequestFromTo(ft);

        for (let i = 0; i < 10; i++) {
            let price: number = Math.max(Helper.asCurrency(this.options.dispatcher.minCalculated), Helper.asCurrency(i * slice));
            prices.indexOf(price) >= 0 ? null: prices.push(price)
        }

        for (let i = 0; i < prices.length; i++) {
            offerRequest.orderTotal = Helper.asCurrency((2*prices[i] + slice)/2);
            let offer = await this.requestOffer(offerRequest);            
            
            if (offer) {
                let item = {
                    start: prices[i],
                    end: offer.customerFee <= 0.00 ? 0.00: prices[i] + slice,
                    cost: offer.customerFee
                }
                let found = result.find(u=>u.cost == offer.customerFee);
                if (!found) {
                    if (item.end == 0.00 || item.end >= this.options.dispatcher.minCalculated)
                         result.push(item);
                }
                else found.end = item.end;
                if (offer.customerFee <= 0.00) {
                    break
                };
            }
        }

        return this.optimizedSlice(result);
    }



    constructor(config: any, options: LogisticProviderOptions) {
        super(config, options);
        options.dispatcher.type = "butcher/auto";
        let opts = this.getCustomerFeeConfig();
        this.options.dispatcher.min = this.options.dispatcher.min || 100.00;
        if (options.initialDistance > opts.kmMin && opts.minMultiplier) {
            this.options.dispatcher.minCalculated = Helper.asCurrency(Math.ceil((this.options.dispatcher.min + (options.initialDistance - opts.kmMin) * opts.minMultiplier)/25)*25)
        }
        options.dispatcher.name = DispatcherTypeDesc[options.dispatcher.type];
    }

}