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
const core_1 = require("./core");
const axios_1 = require("axios");
const helper_1 = require("../helper");
class BanabikuryeProvider extends core_1.LogisticProvider {
    constructor(config) {
        super(config);
        this.config = config;
    }
    offerFromTo(fromTo) {
        return __awaiter(this, void 0, void 0, function* () {
            let req = {
                weight: 0,
                matter: 'Gıda',
                notifyCustomerSms: false,
                vehicleType: core_1.VehicleType.Motor,
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
            return yield this.requestOffer(req);
        });
    }
    priceSlice(ft, slice = 100.00, options = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            let prices = [], result = [];
            let offer = yield this.offerFromTo(ft);
            let distance = helper_1.default.distance(ft.start, ft.finish);
            for (let i = 0; i < 10; i++)
                prices.push(helper_1.default.asCurrency(i * slice));
            let config = {
                distance: 0,
                offerPrice: offer.totalFee,
                orderTotal: 0,
                contribitionRatio: 0.04,
                freeShipPerKM: 25,
                pricePerKM: 1.5,
                priceStartsAt: 5,
                maxDistance: 20,
                minOrder: 100,
            };
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
    get(method) {
        return __awaiter(this, void 0, void 0, function* () {
            const config = {
                headers: {
                    'X-DV-Auth-Token': this.config.apiKey
                }
            };
            return yield axios_1.default.get(`${this.config.uri}/${method}`, config);
        });
    }
    post(method, req) {
        return __awaiter(this, void 0, void 0, function* () {
            const config = {
                headers: {
                    'X-DV-Auth-Token': this.config.apiKey
                }
            };
            return yield axios_1.default.post(`${this.config.uri}/${method}`, req, config);
        });
    }
    toBnbPoint(p) {
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
        };
    }
    fromBnbPoint(p) {
        return {
            id: p.point_id,
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
        };
    }
    toOfferRequest(oreq) {
        let req = {
            total_weight_kg: oreq.weight,
            matter: oreq.matter,
            is_contact_person_notification_enabled: oreq.notifyCustomerSms,
            points: []
        };
        oreq.points.forEach(p => {
            req.points.push(this.toBnbPoint(p));
        });
        return req;
    }
    toOrderRequest(oreq) {
        let req = {
            total_weight_kg: oreq.weight,
            matter: oreq.matter,
            is_contact_person_notification_enabled: oreq.notifyCustomerSms,
            points: []
        };
        oreq.points.forEach(p => {
            req.points.push(this.toBnbPoint(p));
        });
        return req;
    }
    fromOfferResponse(ores) {
        if (ores.is_successful) {
            let order = ores['order'];
            let res = {
                deliveryFee: parseFloat(order['delivery_fee_amount']),
                discount: parseFloat(order['discount_amount']),
                points: order['points'].map(p => this.fromBnbPoint(p)),
                weightFee: parseFloat(order['weight_fee_amount']),
                totalFee: parseFloat(order['payment_amount']),
            };
            return res;
        }
        else {
            throw new Error('Taşıma teklifi alınamadı');
        }
    }
    fromOrderResponse(ores) {
        if (ores.is_successful) {
            let order = ores['order'];
            let res = {
                orderId: order['order_id'],
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
            };
            return res;
        }
        else {
            throw new Error('Taşıma teklifi alınamadı');
        }
    }
    requestOffer(req) {
        return __awaiter(this, void 0, void 0, function* () {
            let request = this.toOfferRequest(req);
            let result = yield this.post("calculate-order", request);
            return this.fromOfferResponse(result.data);
        });
    }
    createOrder(req) {
        return __awaiter(this, void 0, void 0, function* () {
            let request = this.toOrderRequest(req);
            let result = yield this.post("create-order", request);
            return this.fromOrderResponse(result.data);
        });
    }
    static register() {
        core_1.LogisticFactory.register(BanabikuryeProvider.key, BanabikuryeProvider);
    }
}
exports.default = BanabikuryeProvider;
BanabikuryeProvider.key = "banabikurye";

//# sourceMappingURL=banabikurye.js.map
