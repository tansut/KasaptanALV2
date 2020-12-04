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
const area_1 = require("../../db/models/area");
const butcherarea_1 = require("../../db/models/butcherarea");
const paymentConfig = require(path.join(config_1.default.projectDir, `logistic.json`));
var VehicleType;
(function (VehicleType) {
    VehicleType[VehicleType["Motor"] = 0] = "Motor";
    VehicleType[VehicleType["Car"] = 1] = "Car";
})(VehicleType = exports.VehicleType || (exports.VehicleType = {}));
class LogisticProvider {
    constructor(config, options) {
        this.safeRequests = true;
        this.options = options;
    }
    distance(ft, params = null) {
        return __awaiter(this, void 0, void 0, function* () {
            params = params || {
                areaOnly: true
            };
            let saved = null;
            if (ft.sId && ft.fId) {
                saved = yield butcherarea_1.default.findOne({
                    where: {
                        butcherid: parseInt(ft.sId),
                        areaid: parseInt(ft.fId),
                    },
                    include: [{
                            model: area_1.default,
                        }]
                });
            }
            let km = 0;
            if (saved) {
                let distanceDif = params.areaOnly ? 0.0 : helper_1.default.distance(ft.finish, saved.area.location);
                km = saved.bestKm + distanceDif;
            }
            return km || helper_1.default.distance(ft.start, ft.finish) * 1.5;
        });
    }
    roundCustomerFee(x) {
        return helper_1.default.asCurrency(Math.ceil(x / 5) * 5);
    }
    optimizedSlice(result) {
        let tobeRemoved = [], cleaned = [];
        for (var i = result.length - 1; i >= 0; i--) {
            let prev = i - 1;
            if (prev > 0) {
                if (result[i].cost == result[prev].cost) {
                    tobeRemoved.push(prev);
                }
            }
        }
        result.forEach((item, i) => {
            if (tobeRemoved.findIndex(c => c == i) < 0)
                cleaned.push(item);
            if (cleaned.length > 1) {
                cleaned[cleaned.length - 1].start = cleaned[cleaned.length - 2].end;
            }
        });
        return cleaned;
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
                    contactPhone: '05326274151',
                    id: fromTo.sId,
                    lat: fromTo.start.coordinates[0],
                    lng: fromTo.start.coordinates[1],
                    orderId: ''
                }, {
                    address: 'Foo',
                    contactPhone: '05326274151',
                    id: fromTo.fId,
                    lat: fromTo.finish.coordinates[0],
                    lng: fromTo.finish.coordinates[1],
                    orderId: ''
                }]
        };
        return req;
    }
    calculateCustomerFee(offer) {
        offer.customerFee = offer.totalFee;
    }
    priceSlice(ft, slice = 100.00, options = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            let prices = [], result = [];
            return result;
        });
    }
    fromOrder(o) {
        let finish = null;
        if (o.shipmentType == "plan" || o.shipmentType == "sameday") {
            o.shipmentstart = o.shipmentstart || helper_1.default.Now();
            finish = new Date(o.shipmentstart);
            finish.setHours(o.shipmentstart.getHours() + 1);
            // shour = Math.round(o.shipmenthour / 100);
            // fHour = o.shipmenthour % 100;
            // start = Helper.newDate2(o.shipmentdate.getFullYear(), o.shipmentdate.getMonth(), o.shipmentdate.getDate(), shour, 0, 0);
            // finish = Helper.newDate2(o.shipmentdate.getFullYear(), o.shipmentdate.getMonth(), o.shipmentdate.getDate(), fHour, 0, 0);
            // start = start < Helper.Now() ? null: start;
            // finish = !start ? null: finish;
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
                    id: o.butcher.id.toString(),
                    orderId: o.ordernum,
                    start: o.shipmentstart,
                    note: "Kasaba uğrayıp müşteri paketini alın"
                },
                {
                    id: o.areaLevel3Id ? o.areaLevel3Id.toString() : '',
                    address: o.displayAddress,
                    contactName: o.name,
                    contactPhone: o.phone,
                    lat: o.shipLocation.coordinates[0],
                    lng: o.shipLocation.coordinates[1],
                    orderId: o.ordernum,
                    note: o.adresTarif,
                    apartment: `Bina: ${o.bina}`,
                    floor: `Kat: ${o.kat}`,
                    entrance: `Daire: ${o.daire}`,
                    finish: finish,
                }
            ]
        };
    }
    offerFromOrder(o) {
        let req = this.fromOrder(o);
        req.notifyCustomerSms = true;
        return req;
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
