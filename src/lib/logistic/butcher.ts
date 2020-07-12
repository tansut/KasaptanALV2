import { LogisticProvider, LogisticFactory, PriceSlice, FromTo, CustomerPriceConfig, OfferResponse, CustomerPriceParams, OfferRequest } from "./core";
import Dispatcher from "../../db/models/dispatcher";
import Helper from "../helper";

export class ButcherManualLogistics extends LogisticProvider {
    static key = "butcher";

    static register() {
        LogisticFactory.register(ButcherManualLogistics.key, ButcherManualLogistics)
    }



    async requestOffer(req: OfferRequest): Promise<OfferResponse> {
        let fee = 0.00;
        if (this.options.dispatcher.totalForFree <= 0) {
            fee = this.options.dispatcher.fee
        }
        else fee = (Math.max(0.00, (this.options.dispatcher.totalForFree - req.orderTotal > 0) ? this.options.dispatcher.fee : 0))
        return {
            totalFee: this.options.dispatcher.fee,
            customerFee: fee
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
                    start: this.options.dispatcher.min,
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
                    start: this.options.dispatcher.min,
                    end: this.options.dispatcher.totalForFree,
                    cost: this.options.dispatcher.fee
                })
            }


        }

        return arr;
    }

    constructor(config: any, options: any) {
        super(config, options);
    }

}



export class ButcherAutoLogistics extends LogisticProvider {
    static key = "butcher/auto";
    private dispatcher: Dispatcher;

    static register() {
        LogisticFactory.register(ButcherAutoLogistics.key, ButcherAutoLogistics)
    }

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

    async priceSlice(ft: FromTo, slice: number = 100.00): Promise<PriceSlice[]> {
        let distance = Helper.distance(ft.start, ft.finish);
        let prices = [], result: PriceSlice[] = [];
        for (let i = 0; i < 10; i++)
            prices.push(Helper.asCurrency(i * slice));
        for (let i = 0; i < prices.length; i++) {
            let cost = this.calculateFeeForCustomer({
                distance: distance,
                orderTotal: prices[i]
            });
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