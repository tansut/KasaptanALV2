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
const commissionHelper_1 = require("../commissionHelper");
const dispatcher_1 = require("../../db/models/dispatcher");
class BanabikuryeProvider extends core_1.LogisticProvider {
    constructor(config, options) {
        super(config, options);
        this.name = dispatcher_1.DispatcherTypeDesc["kasaptanal/motokurye"];
        this.config = config;
        if (options.dispatcher) {
            options.dispatcher.min = 0.00;
            options.dispatcher.totalForFree = 0.00;
            options.dispatcher.type = "kasaptanal/motokurye";
            options.dispatcher.name = dispatcher_1.DispatcherTypeDesc[options.dispatcher.type];
        }
    }
    // getCustomerFeeConfig(): CustomerPriceConfig {
    //     let config: CustomerPriceConfig = {
    //         contribitionRatio: 0.04,
    //         freeShipPerKM: 25,
    //         pricePerKM: 1.5,
    //         priceStartsAt: 5,
    //         maxDistance: 20,
    //         minOrder: 100,
    //     }
    //     return config;
    // }
    // calculateFeeForCustomer(params: CustomerPriceParams): OfferResponse {
    //     if (!params.regularPrice)
    //         params.regularPrice = this.lastOffer.totalFee;
    //     return super.calculateFeeForCustomer(params)
    // }
    // calculateCostForCustomer(shipment: Shipment, o: Order) {
    //     if (o.dispatcherFee > 0.00) {
    //         let dispatcherFee = Helper.asCurrency(o.dispatcherFee / 1.18);
    //         let calc = new ComissionHelper(o.getButcherRate(), o.getButcherFee());
    //         let commission = calc.calculateButcherComission(o.subTotal);    
    //         let contribute = Helper.asCurrency(commission.kalitteFee * 0.4);
    //         let calculated = Helper.asCurrency(Math.max(0.00, dispatcherFee - contribute));
    //         let calculatedVat = Helper.asCurrency(calculated * 0.18)
    //         let totalShip = Helper.asCurrency(Math.round(calculated + calculatedVat));
    //         return totalShip > 0.00 ? Math.max(5.00, totalShip): 0.00;
    //     } else return 0.00;
    // }
    calculateCustomerFee(offer) {
        let regularFee = offer.totalFee;
        let customerFee = offer.totalFee;
        if (regularFee > 0.00 && offer.orderTotal > 0.00) {
            let dispatcherFee = helper_1.default.asCurrency(regularFee / 1.18);
            let calcRegular = new commissionHelper_1.ComissionHelper(this.options.dispatcher.butcher.commissionRate, this.options.dispatcher.butcher.commissionFee);
            let calc = new commissionHelper_1.ComissionHelper(this.options.dispatcher.butcher.noshipCommissionRate, this.options.dispatcher.butcher.noshipCommissionFee);
            let commissionRegular = calcRegular.calculateButcherComission(offer.orderTotal);
            let commission = calc.calculateButcherComission(offer.orderTotal);
            let diff = commission.kalitteFee - commissionRegular.kalitteFee;
            let contribute = helper_1.default.asCurrency(diff);
            let calculated = helper_1.default.asCurrency(Math.max(0.00, dispatcherFee - contribute));
            let calculatedVat = helper_1.default.asCurrency(calculated * 0.18);
            let totalShip = helper_1.default.asCurrency(Math.round(calculated + calculatedVat));
            customerFee = totalShip > 0.00 ? Math.max(5.00, totalShip) : 0.00;
        }
        offer.customerFee = this.roundCustomerFee(customerFee);
        return offer;
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
            //id: p.point_id,
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
                customerFee: parseFloat(order['payment_amount']),
                orderTotal: 0.00,
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
                orderTotal: 0.00,
                customerFee: parseFloat(order['payment_amount']),
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
    priceSlice(ft, slice = 100.00, options = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            let prices = [], result = [];
            let offerRequest = this.offerRequestFromTo(ft);
            let offer = yield this.requestOffer(offerRequest);
            for (let i = 1; i < 10; i++)
                prices.push(helper_1.default.asCurrency(i * slice));
            for (let i = 0; i < prices.length; i++) {
                offer.orderTotal = helper_1.default.asCurrency((2 * prices[i] + slice) / 2);
                this.calculateCustomerFee(offer);
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
            return this.optimizedSlice(result);
        });
    }
    safeResponse(method, req, distance) {
        return __awaiter(this, void 0, void 0, function* () {
            let resp = null;
            try {
                let result = yield this.post(method, req);
                resp = this.fromOfferResponse(result.data);
            }
            catch (e) {
                if (!this.safeRequests)
                    throw e;
                let fee = helper_1.default.asCurrency(10.00 + distance * 2);
                resp = {
                    customerFee: fee,
                    totalFee: fee,
                    orderTotal: 0.00
                };
            }
            return resp;
        });
    }
    requestOffer(req) {
        return __awaiter(this, void 0, void 0, function* () {
            let request = this.toOfferRequest(req);
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
            let resp = yield this.safeResponse("calculate-order", request, req.distance);
            resp.orderTotal = req.orderTotal;
            resp.distance = req.distance;
            return this.calculateCustomerFee(resp);
        });
    }
    createOrder(req) {
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
            let request = this.toOrderRequest(req);
            let resp = yield this.safeResponse("create-order", request, req.distance);
            resp.orderTotal = req.orderTotal;
            resp.distance = req.distance;
            return this.calculateCustomerFee(resp);
        });
    }
    static register() {
        core_1.LogisticFactory.register(BanabikuryeProvider.key, BanabikuryeProvider);
    }
}
exports.default = BanabikuryeProvider;
BanabikuryeProvider.key = "banabikurye";
