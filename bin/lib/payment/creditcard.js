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
exports.CreditcardPaymentFactory = exports.CreditcardPaymentProvider = void 0;
var fs = require('fs');
const config_1 = require("../../config");
const path = require("path");
const helper_1 = require("../helper");
const payment_1 = require("../../db/models/payment");
const order_1 = require("../../routes/api/order");
const paymentConfig = require(path.join(config_1.default.projectDir, `payment.json`));
class CreditcardPaymentProvider {
    constructor(config) {
        this.marketPlace = true;
        this.marketPlace = config.marketPlace == "true";
        this.api = new order_1.default();
    }
    validateCard(card) {
    }
    pay3dHandshakeSuccess(result) {
        return __awaiter(this, void 0, void 0, function* () {
            return false;
        });
    }
    savePayment(provider, request, response) {
        return __awaiter(this, void 0, void 0, function* () {
            return payment_1.default.create({
                userid: this.userid,
                conversationId: response.conversationId,
                paymentId: response.paymentId,
                provider: provider,
                ip: this.ip,
                price: response.paidPrice,
                request: JSON.stringify(request),
                response: JSON.stringify(response)
            });
        });
    }
    get providerKey() {
        return "unset";
    }
    getSubmerchantId(o) {
        return o.butcher[this.providerKey + "SubMerchantKey"];
    }
    paySession(request) {
        return __awaiter(this, void 0, void 0, function* () {
        });
    }
    getMerchantMoney(o, shouldBePaid, productPrice, shipOfButcher, shipOfKasaptanAl) {
        let comission = o.getButcherComission(productPrice + shipOfButcher);
        let puan = o.getPuanTotal(productPrice);
        return helper_1.default.asCurrency(shouldBePaid - comission - puan - shipOfKasaptanAl);
    }
    requestFromOrder(ol, debts = {}) {
        let basketItems = [];
        let price = 0.00, paidPrice = 0.00;
        ol.forEach((o, j) => {
            let total = o.workedAccounts.find(p => p.code == 'total');
            let productPrice = this.api.calculateProduct(o);
            let shipOfButcher = this.api.calculateTeslimatOfButcher(o);
            let shipOfKasaptanAl = this.api.calculateTeslimatOfKasaptanAl(o);
            let shouldBePaid = helper_1.default.asCurrency(total.alacak - total.borc);
            let merchantPrice = 0.00;
            let butcherDebt = 0.00, debtApplied = 0.00;
            if (this.marketPlace) {
                merchantPrice = this.getMerchantMoney(o, shouldBePaid, productPrice, shipOfButcher, shipOfKasaptanAl);
                butcherDebt = debts[o.butcherid];
                if (merchantPrice <= butcherDebt) {
                    debtApplied = merchantPrice - 1.00;
                }
                else
                    debtApplied = butcherDebt;
                merchantPrice = helper_1.default.asCurrency(merchantPrice - debtApplied);
            }
            basketItems.push({
                category1: o.butcherName,
                id: o.ordernum,
                itemType: 'PHYSICAL',
                name: o.name + ' ' + o.ordernum + ' nolu ' + 'ürün siparişi',
                price: helper_1.default.asCurrency(shouldBePaid),
                merchantDebtApplied: debtApplied,
                subMerchantKey: this.marketPlace ? this.getSubmerchantId(o) : undefined,
                subMerchantPrice: merchantPrice > 0.00 ? merchantPrice : undefined
            });
            price += helper_1.default.asCurrency(shouldBePaid);
            paidPrice += helper_1.default.asCurrency(shouldBePaid);
        });
        let orderids = ol.map(o => o.ordernum).join(',');
        let o = ol[0];
        let result = {
            price: helper_1.default.asCurrency(price),
            paidPrice: helper_1.default.asCurrency(paidPrice),
            billingAddress: {
                address: o.address,
                city: o.areaLevel1Text,
                contactName: o.name,
                country: 'Turkey'
            },
            shippingAddress: {
                address: o.address,
                city: o.areaLevel1Text,
                contactName: o.name,
                country: 'Turkey'
            },
            basketId: orderids,
            conversationId: orderids,
            basketItems: basketItems,
            buyer: {
                city: o.areaLevel1Text,
                country: 'Turkey',
                email: o.email,
                gsmNumber: o.phone,
                id: o.userId.toString(),
                identityNumber: '2312312',
                ip: this.ip,
                name: o.name,
                registrationAddress: o.address,
                surname: o.name
            },
            currency: 'TRY',
            installment: '1',
            registerCard: false
        };
        return result;
    }
    // requestFromOrder(ol: Order[]): PaymentRequest {
    //     let basketItems: BasketItem [] = [];
    //     let price = 0.00, paidPrice = 0.00;
    //     ol.forEach((o, j) => {
    //         o.items.forEach((oi, i) => {
    //             let merchantPrice = undefined;
    //             if (this.marketPlace) {
    //                 let fee = i == 0 ? Helper.asCurrency(o.butcher.commissionFee): 0.00;
    //                 let rated = Helper.asCurrency(oi.price * (o.butcher.commissionRate))
    //                 merchantPrice = Helper.asCurrency(oi.price - fee - rated           )                                               
    //             }
    //             basketItems.push({
    //                 category1: o.butcherName,
    //                 id: oi.orderitemnum,
    //                 itemType: 'PHYSICAL',
    //                 name: oi.product.name,
    //                 price: Helper.asCurrency(oi.price),
    //                 subMerchantKey: this.marketPlace ? o.butcher[this.providerKey + "SubMerchantKey"]: undefined,
    //                 subMerchantPrice: merchantPrice
    //             }) 
    //         })
    //         price += Helper.asCurrency(o.total); 
    //         paidPrice += Helper.asCurrency(o.total); 
    //     })
    //     let orderids = ol.map(o=>o.ordernum).join(',');
    //     let o = ol[0];
    //     let result = {
    //         price: Helper.asCurrency(price),
    //         paidPrice: Helper.asCurrency(paidPrice),
    //         billingAddress: {
    //             address: o.address,
    //             city: o.areaLevel1Text,
    //             contactName: o.name,
    //             country: 'Turkey' 
    //         },
    //         shippingAddress: {
    //             address: o.address,
    //             city: o.areaLevel1Text,
    //             contactName: o.name,
    //             country: 'Turkey'                
    //         },
    //         basketId: orderids,
    //         conversationId: orderids,
    //         basketItems: basketItems,
    //         buyer: {
    //             city: o.areaLevel1Text,
    //             country: 'Turkey',
    //             email: o.email,
    //             gsmNumber: '',
    //             id: o.userId.toString(),
    //             identityNumber: '2312312',
    //             ip: this.ip,
    //             name: o.name,
    //             registrationAddress: o.address,
    //             surname: o.name                
    //         },
    //         currency: 'TRY',
    //         installment: '1',
    //         registerCard: false
    //     }
    //     return result;
    // }
    subMerchantRequestFromButcher(b) {
        return {
            address: b.address,
            email: b.email,
            iban: b.iban,
            name: b.name,
            legalCompanyTitle: b.legalName,
            subMerchantExternalId: b.id.toString(),
            subMerchantType: b.companyType,
            taxNumber: b.companyType == 'LIMITED_OR_JOINT_STOCK_COMPANY' ? b.taxNumber : undefined,
            taxOffice: b.taxOffice,
            identityNumber: b.companyType != 'LIMITED_OR_JOINT_STOCK_COMPANY' ? b.taxNumber : undefined
        };
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
    approveItem(request) {
        return __awaiter(this, void 0, void 0, function* () {
            return null;
        });
    }
    disApproveItem(request) {
        return __awaiter(this, void 0, void 0, function* () {
            return null;
        });
    }
    pay(request, card) {
        return __awaiter(this, void 0, void 0, function* () {
            return null;
        });
    }
    pay3dInit(request, card) {
        return __awaiter(this, void 0, void 0, function* () {
            return null;
        });
    }
    pay3dComplete(request) {
        return __awaiter(this, void 0, void 0, function* () {
            return null;
        });
    }
    createSubMerchant(request) {
        return __awaiter(this, void 0, void 0, function* () {
            return null;
        });
    }
    updateSubMerchant(request) {
        return __awaiter(this, void 0, void 0, function* () {
            return null;
        });
    }
}
exports.CreditcardPaymentProvider = CreditcardPaymentProvider;
class CreditcardPaymentFactory {
    static register(key, cls) {
        CreditcardPaymentFactory.items[key] = cls;
    }
    static getInstance(key) {
        key = key || paymentConfig.default || config_1.default.paymentProvider;
        const cls = CreditcardPaymentFactory.items[key];
        return new cls(paymentConfig.providers[key][config_1.default.nodeenv]);
    }
}
exports.CreditcardPaymentFactory = CreditcardPaymentFactory;
CreditcardPaymentFactory.items = {};
