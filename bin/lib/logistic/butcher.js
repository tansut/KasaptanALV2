"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ButcherAutoLogistics = exports.ButcherManualLogistics = void 0;
const core_1 = require("./core");
const helper_1 = require("../helper");
class ButcherManualLogistics extends core_1.LogisticProvider {
    constructor(config, options) {
        super(config, options);
        this.dispatcher = options.dispatcher;
    }
    static register() {
        core_1.LogisticFactory.register(ButcherManualLogistics.key, ButcherManualLogistics);
    }
    priceSlice(distance, slice = 50.00) {
        return __awaiter(this, void 0, void 0, function* () {
            let arr = [];
            if (this.dispatcher) {
                if (this.dispatcher.fee > 0.0) {
                    arr.push({
                        start: this.dispatcher.min,
                        end: this.dispatcher.totalForFree,
                        cost: this.dispatcher.fee
                    });
                }
                if (this.dispatcher.totalForFree > 0.00) {
                    arr.push({
                        start: this.dispatcher.totalForFree,
                        cost: 0.00
                    });
                }
                if (arr.length == 0) {
                    arr.push({
                        start: this.dispatcher.min,
                        end: this.dispatcher.totalForFree,
                        cost: this.dispatcher.fee
                    });
                }
            }
            return arr;
        });
    }
}
exports.ButcherManualLogistics = ButcherManualLogistics;
ButcherManualLogistics.key = "butcher";
class ButcherAutoLogistics extends core_1.LogisticProvider {
    constructor(config, options) {
        super(config, options);
        this.dispatcher = options.dispatcher;
    }
    static register() {
        core_1.LogisticFactory.register(ButcherAutoLogistics.key, ButcherAutoLogistics);
    }
    priceSlice(ft, slice = 100.00) {
        return __awaiter(this, void 0, void 0, function* () {
            let distance = helper_1.default.distance(ft.start, ft.finish);
            let config = {
                distance: distance,
                orderTotal: 0,
                contribitionRatio: 0.04,
                freeShipPerKM: 25,
                pricePerKM: 1.5,
                priceStartsAt: 5,
                maxDistance: 20,
                minOrder: 100,
            };
            let prices = [], result = [];
            for (let i = 0; i < 10; i++)
                prices.push(helper_1.default.asCurrency(i * slice));
            for (let i = 0; i < prices.length; i++) {
                config.orderTotal = prices[i];
                let cost = (yield this.calculateFeeForCustomer(config));
                if (cost) {
                    let item = {
                        start: prices[i],
                        end: prices[i] + slice,
                        cost: cost.totalFee
                    };
                    result.push(item);
                    if (cost.totalFee <= 0.00) {
                        item.end = 0.00;
                        break;
                    }
                    ;
                }
            }
            return result;
        });
    }
}
exports.ButcherAutoLogistics = ButcherAutoLogistics;
ButcherAutoLogistics.key = "butcher/auto";

//# sourceMappingURL=butcher.js.map
