import { FromTo } from "moment";
import { DispatcherTypeDesc } from "../../db/models/dispatcher";
import Helper from "../helper";
import BanabikuryeProvider, { BanabikuryeConfig } from "./banabikurye";
import { LogisticFactory, LogisticProvider, LogisticProviderOptions, OfferResponse, OrderResponse, PriceSlice, VehicleType } from "./core";


export default class ToBanabikuryeProvider extends LogisticProvider {
    instance: LogisticProvider;

    static register() {
        LogisticFactory.register("tobanabikurye", ToBanabikuryeProvider)
    }

    calculateCustomerFee(offer: OfferResponse | OrderResponse) {
        
    }


    // async priceSlice(ft: FromTo, slice: number = 100.00, options = {}): Promise<PriceSlice[]> {
    //     let prices = [], result: PriceSlice[] = [];
        
    //     return result;
    // }


    constructor(config: any, options: LogisticProviderOptions) {
        super(config, options);

        // let distance = options.initialDistance || Helper.distance(options.dispatcher.butcher.location, options.toArea.location);
        // let butcherAvail = options.dispatcher.butcher.radiusAsKm >= distance;

        // if (butcherAvail) {
        //     this.instance = LogisticFactory.getInstance(, {
        //         dispatcher: dispath,
        //         initialDistance: distance2Butcher
        //     })
        // }

        this.name = "Otomatik";
        options.dispatcher.name = "Otomatik";
    }
}