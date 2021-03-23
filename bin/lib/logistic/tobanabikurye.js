"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("./core");
class ToBanabikuryeProvider extends core_1.LogisticProvider {
    // async priceSlice(ft: FromTo, slice: number = 100.00, options = {}): Promise<PriceSlice[]> {
    //     let prices = [], result: PriceSlice[] = [];
    //     return result;
    // }
    constructor(config, options) {
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
    static register() {
        core_1.LogisticFactory.register("tobanabikurye", ToBanabikuryeProvider);
    }
    calculateCustomerFee(offer) {
    }
}
exports.default = ToBanabikuryeProvider;
