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
exports.LogisticFactory = exports.LogisticProvider = exports.VehicleType = void 0;
var fs = require('fs');
const config_1 = require("../../config");
const path = require("path");
const helper_1 = require("../helper");
const paymentConfig = require(path.join(config_1.default.projectDir, `logistic.json`));
var VehicleType;
(function (VehicleType) {
    VehicleType[VehicleType["Motor"] = 0] = "Motor";
    VehicleType[VehicleType["Car"] = 1] = "Car";
})(VehicleType = exports.VehicleType || (exports.VehicleType = {}));
class LogisticProvider {
    constructor(config, options) {
        this.options = options;
    }
    distance(ft) {
        return __awaiter(this, void 0, void 0, function* () {
            return helper_1.default.distance(ft.start, ft.finish);
        });
    }
    offerRequestFromTo(fromTo) {
        let req = {
            orderTotal: 0.00,
            weight: 0,
            matter: 'Gıda',
            notifyCustomerSms: false,
            vehicleType: VehicleType.Motor,
            points: [{
                    address: 'Foo',
                    contactPhone: '05326374151',
                    lat: fromTo.start.coordinates[0],
                    lng: fromTo.start.coordinates[1],
                    orderId: ''
                }, {
                    address: 'Foo',
                    contactPhone: '05326374151',
                    lat: fromTo.finish.coordinates[0],
                    lng: fromTo.finish.coordinates[1],
                    orderId: ''
                }]
        };
        return req;
    }
    offerFromTo(fromTo) {
        return __awaiter(this, void 0, void 0, function* () {
            let req = this.offerRequestFromTo(fromTo);
            return yield this.requestOffer(req);
        });
    }
    priceSlice(distance, slice = 50.00, options = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            let arr = [];
            return arr;
        });
    }
    fromOrder(o) {
        let start = null, finish = null, shour = 0, fHour = 0;
        if (o.shipmentType == "plan" || o.shipmentType == "sameday") {
            shour = Math.round(o.shipmenthour / 100);
            fHour = o.shipmenthour % 100;
            start = new Date(o.shipmentdate.getFullYear(), o.shipmentdate.getMonth(), o.shipmentdate.getDate(), shour, 0, 0);
            finish = new Date(o.shipmentdate.getFullYear(), o.shipmentdate.getMonth(), o.shipmentdate.getDate(), fHour, 0, 0);
        }
        return {
            matter: 'Gıda',
            vehicleType: VehicleType.Motor,
            weight: 0,
            orderTotal: o.subTotal,
            points: [
                {
                    address: o.butcher.address,
                    contactName: o.butcher.name,
                    contactPhone: o.butcher.phone,
                    lat: o.butcher.lat,
                    lng: o.butcher.lng,
                    orderId: o.ordernum,
                    note: "Lütfen kasaba uğrayıp müşteri paketini alın: " + o.butcher.address,
                },
                {
                    address: o.displayAddress,
                    contactName: o.name,
                    contactPhone: o.phone,
                    lat: o.shipLocation.coordinates[0],
                    lng: o.shipLocation.coordinates[1],
                    orderId: o.ordernum,
                    note: o.displayAddress,
                    apartment: `Bina: ${o.bina}`,
                    floor: `Kat: ${o.kat}`,
                    entrance: `Daire: ${o.daire}`,
                    start: start ? start : undefined,
                    finish: finish ? finish : undefined,
                }
            ]
        };
    }
    getCustomerFeeConfig() {
        return null;
    }
    calculateFeeForCustomer(params) {
        let input = this.getCustomerFeeConfig();
        if (!input)
            return null;
        let fee = 0.00;
        if (input.maxDistance && params.distance > input.maxDistance)
            return null;
        if (input.minOrder && params.orderTotal < input.minOrder)
            return null;
        if (input.priceStartsAt && params.distance < input.priceStartsAt)
            fee = 0.00;
        let regular = params.distance ? helper_1.default.asCurrency(input.pricePerKM * params.distance) : input.offerPrice;
        let contrib = input.contribitionRatio ? helper_1.default.asCurrency(params.orderTotal * input.contribitionRatio) : 0.00;
        let free = input.freeShipPerKM ? (input.freeShipPerKM * params.distance) : 0.00;
        if (params.orderTotal >= free)
            fee = 0;
        let calc = Math.max(0, regular - contrib);
        fee = helper_1.default.asCurrency(Math.round(calc / 2.5) * 2.5);
        return {
            totalFee: regular,
            customerFee: fee
        };
    }
    offerFromOrder(o) {
        let req = this.fromOrder(o);
        req.notifyCustomerSms = true;
        return req;
    }
    offerFromDispatcher(to) {
        return __awaiter(this, void 0, void 0, function* () {
            let fromTo = {
                start: this.options.dispatcher.butcher.location,
                finish: to
            };
            let offer = yield this.offerFromTo(fromTo);
            return offer;
        });
    }
    orderFromOrder(o) {
        let req = this.fromOrder(o);
        req.notifyCustomerSms = true;
        return req;
    }
    requestOffer(req) {
        return __awaiter(this, void 0, void 0, function* () {
            return null;
        });
    }
    createOrder(req) {
        return __awaiter(this, void 0, void 0, function* () {
            return null;
        });
    }
    get providerKey() {
        return "unset";
    }
    logOperation(logType, request, result) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.logger) {
                let data = {
                    request: request,
                    response: result
                };
                return yield this.logger.log({
                    logData: JSON.stringify(data),
                    logtype: logType,
                    f1: request.conversationId,
                    f2: result.paymentId,
                    status: result.status
                });
            }
            else
                return Promise.resolve();
        });
    }
}
exports.LogisticProvider = LogisticProvider;
class LogisticFactory {
    static register(key, cls) {
        LogisticFactory.items[key] = cls;
    }
    static getInstance(key, options) {
        key = key || paymentConfig.default || config_1.default.paymentProvider;
        const cls = LogisticFactory.items[key];
        return new cls(paymentConfig.providers[key][config_1.default.nodeenv], options);
    }
}
exports.LogisticFactory = LogisticFactory;
LogisticFactory.items = {};

//# sourceMappingURL=core.js.map
