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
const dispatcher_1 = require("../../db/models/dispatcher");
const helper_1 = require("../helper");
class ButcherManualLogistics extends core_1.LogisticProvider {
    constructor(config, options) {
        super(config, options);
        this.name = dispatcher_1.DispatcherTypeDesc["butcher"];
    }
    static register() {
        core_1.LogisticFactory.register(ButcherManualLogistics.key, ButcherManualLogistics);
    }
    requestOffer(req) {
        return __awaiter(this, void 0, void 0, function* () {
            req.distance = yield this.distance({
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
                fee = this.options.dispatcher.fee;
            }
            else
                fee = (Math.max(0.00, (this.options.dispatcher.totalForFree - req.orderTotal > 0) ? this.options.dispatcher.fee : 0));
            return {
                totalFee: this.options.dispatcher.fee,
                customerFee: fee,
                orderTotal: 0.00
            };
        });
    }
    offerFromTo(fromTo) {
        return __awaiter(this, void 0, void 0, function* () {
            let req = this.offerRequestFromTo(fromTo);
            return this.requestOffer(req);
        });
    }
    priceSlice(distance, slice = 50.00) {
        return __awaiter(this, void 0, void 0, function* () {
            let arr = [];
            if (this.options.dispatcher) {
                if (this.options.dispatcher.fee > 0.0) {
                    arr.push({
                        start: this.options.dispatcher.min,
                        end: this.options.dispatcher.totalForFree,
                        cost: this.options.dispatcher.fee
                    });
                }
                if (this.options.dispatcher.totalForFree > 0.00) {
                    arr.push({
                        start: this.options.dispatcher.totalForFree,
                        cost: 0.00
                    });
                }
                if (arr.length == 0) {
                    arr.push({
                        start: this.options.dispatcher.min,
                        end: this.options.dispatcher.totalForFree,
                        cost: this.options.dispatcher.fee
                    });
                }
            }
            return this.optimizedSlice(arr);
        });
    }
}
exports.ButcherManualLogistics = ButcherManualLogistics;
ButcherManualLogistics.key = "butcher";
class ButcherAutoLogistics extends core_1.LogisticProvider {
    constructor(config, options) {
        super(config, options);
        this.name = dispatcher_1.DispatcherTypeDesc["butcher/auto"];
        this.dispatcher = options.dispatcher;
        options.dispatcher.name = this.providerKey;
        options.dispatcher.min = this.getCustomerFeeConfig().minOrder;
        //options.dispatcher.totalForFree = this.getCustomerFeeConfig().;
        options.dispatcher.type = "butcher/auto";
        options.dispatcher.name = dispatcher_1.DispatcherTypeDesc[options.dispatcher.type];
    }
    static register() {
        core_1.LogisticFactory.register(ButcherAutoLogistics.key, ButcherAutoLogistics);
    }
    getCustomerFeeConfig() {
        let butcherConfig = this.options.dispatcher.butcher.logisticSetings || {};
        let config = {
            contrib: 0.05,
            kmPrice: 1.30,
            kmMin: 5,
            kmMax: 25,
            kmMultiplier: 0.4,
            minOrder: 100.00
        };
        return butcherConfig["butcher/auto"] || config;
    }
    requestOffer(req) {
        return __awaiter(this, void 0, void 0, function* () {
            req.distance = yield this.distance({
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
            let res = {
                orderTotal: req.orderTotal,
                totalFee: helper_1.default.asCurrency(config.kmPrice * req.distance),
                points: req.points,
                customerFee: helper_1.default.asCurrency(config.kmPrice * req.distance),
                distance: req.distance
            };
            return this.calculateCustomerFee(res);
        });
    }
    createOrder(req) {
        return __awaiter(this, void 0, void 0, function* () {
            return null;
        });
    }
    calculateCustomerFee(offer) {
        let input = this.getCustomerFeeConfig();
        input.kmMax = input.kmMax || this.dispatcher ? this.dispatcher.butcher.radiusAsKm : 25;
        let distance = offer.distance < input.kmMin ? input.kmMin : offer.distance;
        let orderTotal = offer.orderTotal < input.minOrder ? input.minOrder : offer.orderTotal;
        let maxMinKmDif = input.kmMax - input.kmMin;
        let distanceDif = distance - input.kmMin;
        let kmRatio = distanceDif / maxMinKmDif;
        let kmPrice = helper_1.default.asCurrency(input.kmPrice * (1.00 + kmRatio * input.kmMultiplier));
        let regCost = helper_1.default.asCurrency((distance - input.kmMin) * kmPrice);
        let fee = regCost;
        if (fee >= 0 && input.kmMax && distance > input.kmMax)
            fee = -1;
        if (fee >= 0 && input.minOrder && offer.orderTotal < input.minOrder)
            fee = -1;
        if (fee <= 0 && input.freeShip && input.freeShip <= offer.orderTotal)
            fee = 0.00;
        if (fee > 0.00) {
            let contribDif = offer.orderTotal - input.minOrder;
            let contrib = input.contrib ? helper_1.default.asCurrency(contribDif * input.contrib) : 0.00;
            let calc = Math.max(0.00, regCost - contrib);
            fee = this.roundCustomerFee(calc);
        }
        if (fee >= 0.00) {
            offer.customerFee = fee;
        }
        return fee < 0.00 ? null : offer;
    }
    priceSlice(ft, slice = 100.00, options = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            let prices = [], result = [];
            let offerRequest = this.offerRequestFromTo(ft);
            for (let i = 0; i < 10; i++)
                prices.push(helper_1.default.asCurrency(i * slice));
            for (let i = 0; i < prices.length; i++) {
                offerRequest.orderTotal = helper_1.default.asCurrency((2 * prices[i] + slice) / 2);
                let offer = yield this.requestOffer(offerRequest);
                if (offer) {
                    let item = {
                        start: prices[i],
                        end: prices[i] + slice,
                        cost: offer.customerFee
                    };
                    result.push(item);
                    if (offer.customerFee <= 0.00) {
                        item.end = 0.00;
                        break;
                    }
                    ;
                }
            }
            return this.optimizedSlice(result);
        });
    }
}
exports.ButcherAutoLogistics = ButcherAutoLogistics;
ButcherAutoLogistics.key = "butcher/auto";
