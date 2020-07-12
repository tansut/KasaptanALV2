import { LogisticProvider, LogisticFactory, PriceSlice, FromTo, CustomerPriceConfig, OfferResponse } from "./core";
import Dispatcher from "../../db/models/dispatcher";
import Helper from "../helper";

export class ButcherManualLogistics extends LogisticProvider {
    static key = "butcher";
    private dispatcher: Dispatcher;

    static register() {
        LogisticFactory.register(ButcherManualLogistics.key, ButcherManualLogistics)
    }

    async priceSlice(distance : FromTo, slice: number = 50.00): Promise<PriceSlice[]> {
        
        let arr: PriceSlice[] = []

        if (this.dispatcher) {
            if (this.dispatcher.fee > 0.0) {
                arr.push({
                    start: this.dispatcher.min,
                    end: this.dispatcher.totalForFree,
                    cost: this.dispatcher.fee
                })
            }
            if (this.dispatcher.totalForFree > 0.00) {
                arr.push({
                    start: this.dispatcher.totalForFree,
                    cost: 0.00
                })
            }
            if(arr.length == 0) {
                arr.push({
                    start: this.dispatcher.min,
                    end: this.dispatcher.totalForFree,
                    cost: this.dispatcher.fee
                })
            }


        }

        return arr;
    }

    constructor(config: any, options: any) {
       super(config, options);
       this.dispatcher = options.dispatcher;
    }

}



export class ButcherAutoLogistics extends LogisticProvider {
    static key = "butcher/auto";
    private dispatcher: Dispatcher;
    
    static register() {
        LogisticFactory.register(ButcherAutoLogistics.key, ButcherAutoLogistics)
    }

    async priceSlice(ft : FromTo, slice: number = 100.00): Promise<PriceSlice[]> {
        
        let distance = Helper.distance(ft.start, ft.finish);

        let config: CustomerPriceConfig = {
            distance: distance,
            orderTotal: 0,
            contribitionRatio: 0.04,
            freeShipPerKM: 25,
            pricePerKM: 1.5,
            priceStartsAt: 5,
            maxDistance: 20,
            minOrder: 100,
        }

        let prices = [], result: PriceSlice []=[];

        for(let i = 0; i < 10; i++)
            prices.push(Helper.asCurrency(i*slice));
            
        for(let i = 0; i < prices.length; i++) {
                config.orderTotal = prices[i];
                let cost = (await this.calculateFeeForCustomer(config));
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

    constructor(config: any, options: any) {
        super(config, options);
        this.dispatcher = options.dispatcher;
     }

}