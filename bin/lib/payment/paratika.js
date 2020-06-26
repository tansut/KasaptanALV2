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
const creditcard_1 = require("./creditcard");
const axios_1 = require("axios");
const helper_1 = require("../helper");
var qs = require('qs');
class ParatikaPayment extends creditcard_1.CreditcardPaymentProvider {
    constructor(config) {
        super(config);
        this.config = config;
    }
    post(body, handler, uri = null) {
        const config = {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        };
        axios_1.default.post(uri || this.config.uri, qs.stringify(body), config).then((result) => {
            // console.log("----------");
            // console.log(body);
            // console.log(result.data)
            handler(null, result.data);
        }).catch((err) => handler(err));
    }
    getSubmerchantId(o) {
        return o.butcherid.toString();
    }
    paySession(request) {
        return __awaiter(this, void 0, void 0, function* () {
            let sessionRequest = this.createParatikaSessionReq(request);
            return new Promise((resolve, reject) => {
                this.post(sessionRequest, (err, sessionResult) => {
                    this.logOperation("creditcard-pay-session-create", request, sessionResult).then(() => {
                        if (err)
                            reject(err);
                        else if (sessionResult.responseCode != '00')
                            reject(this.generateErrorResponse(sessionResult));
                        else {
                            resolve(sessionResult);
                        }
                    });
                });
            });
        });
    }
    createParatikaSessionReq(request) {
        let sellerTotal = 0.00;
        let oi = request.basketItems.map(bi => {
            sellerTotal += helper_1.default.asCurrency(bi.subMerchantPrice);
            return {
                code: bi.id,
                name: bi.name,
                amount: bi.price,
                sellerId: bi.subMerchantKey,
                sellerPaymentAmount: bi.subMerchantPrice,
                description: "product",
                quantity: 1
            };
        });
        return {
            ACTION: "SESSIONTOKEN",
            SESSIONTYPE: "PAYMENTSESSION",
            AMOUNT: request.paidPrice,
            CURRENCY: "TRY",
            RETURNURL: request.callbackUrl,
            MERCHANTPAYMENTID: request.conversationId,
            MERCHANTUSER: this.config.merchantUser,
            MERCHANTPASSWORD: this.config.merchantPassword,
            MERCHANT: this.config.merchant,
            CUSTOMER: request.buyer.name,
            CUSTOMERNAME: request.buyer.name,
            CUSTOMEREMAIL: request.buyer.email,
            CUSTOMERIP: request.buyer.ip,
            CUSTOMERUSERAGENT: "Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/43.0.2357.81 Safari/537.36",
            CUSTOMERPHONE: request.buyer.gsmNumber,
            CUSTOMERBIRTHDAY: "01-01-2001",
            BILLTOADDRESSLINE: request.billingAddress.address,
            BILLTOCITY: request.billingAddress.city,
            BILLTOCOUNTRY: "Turkey",
            BILLTOPOSTALCODE: "11103",
            BILLTOPHONE: request.buyer.gsmNumber,
            SHIPTOADDRESSLINE: request.shippingAddress.address,
            SHIPTOCITY: request.shippingAddress.city,
            SHIPTOCOUNTRY: "Turkey",
            SHIPTOPOSTALCODE: "11105",
            SHIPTOPHONE: request.buyer.gsmNumber,
            ORDERITEMS: JSON.stringify(oi),
            TOTALSELLERPAYMENTAMOUNT: sellerTotal
        };
    }
    createParatikaPaymentReq(req, token) {
        return {
            ACTION: "SALE",
            CARDPAN: req.CARDPAN,
            CARDEXPIRY: req.CARDEXPIRY,
            NAMEONCARD: req.NAMEONCARD,
            CARDCVV: req.CARDCVV,
            SESSIONTOKEN: token
        };
    }
    get providerKey() {
        return ParatikaPayment.key;
    }
    generateErrorResponse(response) {
        response.errorMessage = response.errorMsg;
        return response;
    }
    approveItem(request) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                this.iyzipay.approval.create(request, (err, result) => {
                    this.logOperation("submerchant-approval", request, result).then(() => {
                        if (err)
                            reject(err);
                        else if (result.responseCode == '99' || result.responseCode == '98')
                            reject(this.generateErrorResponse(result));
                        else
                            resolve(result);
                    }).catch(err => reject(err));
                });
            });
        });
    }
    disApproveItem(request) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                this.iyzipay.disapproval.create(request, (err, result) => {
                    this.logOperation("submerchant-disapproval", request, result).then(() => {
                        if (err)
                            reject(err);
                        else if (result.status == 'failure')
                            reject(result);
                        else
                            resolve(result);
                    }).catch(err => reject(err));
                });
            });
        });
    }
    pay3dInit(request, card) {
        return __awaiter(this, void 0, void 0, function* () {
            let req = this.createParatikaSessionReq(request);
            return new Promise((resolve, reject) => {
                this.post(req, (err, sessionResult) => {
                    this.logOperation("creditcard-payment-3d-session-create", request, sessionResult).then(() => {
                        if (err)
                            reject(err);
                        else if (sessionResult.responseCode != '00')
                            reject(this.generateErrorResponse(sessionResult));
                        else {
                            let pr = {
                                cardOwner: card.cardHolderName,
                                pan: card.cardNumber,
                                expiryMonth: card.expireMonth,
                                expiryYear: card.expireYear,
                                cvv: card.expireYear,
                                installmentCount: 1,
                            };
                            return;
                            this.post(pr, (err, result) => {
                                if (err)
                                    reject(err);
                                else {
                                    resolve({
                                        status: 'success',
                                        conversationId: request.conversationId,
                                        threeDSHtmlContent: result,
                                        itemTransactions: [],
                                        paidPrice: request.paidPrice,
                                        paymentId: request.conversationId,
                                        price: request.price
                                    });
                                }
                            }, `${this.config.uri}/post/sale3d/${sessionResult.sessionToken}`);
                        }
                    }).catch(err => reject(err));
                });
            });
        });
    }
    pay3dHandshakeSuccess(result) {
        return __awaiter(this, void 0, void 0, function* () {
            result = result || {};
            if (result.responseMsg == "Approved" && result.responseCode == '00')
                return true;
            else {
                yield this.logOperation("3d-handshake-fail", result, {});
                return false;
            }
        });
    }
    pay3dComplete(request) {
        return __awaiter(this, void 0, void 0, function* () {
            let result = {
                conversationId: request.merchantPaymentId,
                paidPrice: parseFloat(request.amount),
                paymentId: request.pgTranId,
                status: 'success',
                price: parseFloat(request.amount),
                itemTransactions: [
                    {
                        itemId: request.merchantPaymentId,
                        paidPrice: parseFloat(request.amount),
                        paymentTransactionId: request.pgTranId,
                        price: parseFloat(request.amount)
                    }
                ]
            };
            return new Promise((resolve, reject) => {
                this.logOperation("creditcard-3d-complete", request, result).then(() => {
                    return this.savePayment("3d-paratika", request, result).then(() => resolve(result)).catch(err => reject(err));
                }).catch(err => reject(err));
            });
        });
    }
    // async paySession(request: PaymentRequest, card: Creditcard) {
    //     let req = this.createParatikaSessionReq(request, card);
    //     return new Promise<boolean>((resolve, reject) => {
    //         this.post(req, (err, result) => {
    //             this.logOperation("creditcard-payment-create", request, result).then(() => {
    //                 if (err) reject(err);
    //                 else if (result.responseCode != '00') 
    //                     reject(this.generateErrorResponse(result));
    //                 else return resolve(true)
    //             }).catch(err => reject(err))
    //         });
    //     })
    // }
    // {
    //     "sessionToken":"E6KDEUYERXWGPHZQELQU4CQCMQGXKRWPG6FIS2APUV2S5UDR",
    //     "responseCode":"00",
    //     "responseMsg":"Approved"
    //     }
    convertParatikaPaymentResult(request, result) {
        return {
            conversationId: request.conversationId,
            paidPrice: result.amount,
            price: result.amount,
            status: 'success',
            paymentId: result.merchantPaymentId,
            itemTransactions: request.basketItems.map(bi => {
                return {
                    itemId: bi.id,
                    paymentTransactionId: result.merchantPaymentId,
                    price: bi.price,
                    paidPrice: bi.price
                };
            })
        };
    }
    pay(request, card) {
        return __awaiter(this, void 0, void 0, function* () {
            let req = this.createParatikaSessionReq(request);
            return new Promise((resolve, reject) => {
                this.post(req, (err, result) => {
                    this.logOperation("creditcard-payment-session-create", request, result).then(() => {
                        if (err)
                            reject(err);
                        else if (result.responseCode != '00')
                            reject(this.generateErrorResponse(result));
                        else {
                            let pr = this.createParatikaPaymentReq(req, result.sessionToken);
                            this.post(pr, (err, result) => {
                                if (err)
                                    reject(err);
                                else if (result.responseCode != '00')
                                    reject(this.generateErrorResponse(result));
                                else {
                                    let paymentRes = this.convertParatikaPaymentResult(request, result);
                                    this.savePayment('pos-paratika', pr, paymentRes)
                                        .then(() => resolve(paymentRes))
                                        .catch(err => reject(err));
                                }
                            });
                        }
                    }).catch(err => reject(err));
                });
            });
        });
    }
    updateSubMerchant(request) {
        return __awaiter(this, void 0, void 0, function* () {
            let req = {
                ACTION: "SELLEREDIT",
                MERCHANT: this.config.merchant,
                MERCHANTUSER: this.config.merchantUser,
                MERCHANTPASSWORD: this.config.merchantPassword,
                SELLERID: request.subMerchantExternalId,
                NAME: request.legalCompanyTitle,
                LASTNAME: request.legalCompanyTitle,
                EMAIL: request.email,
                MOBILENUMBER: '05555551111',
                IBAN: request.iban,
                COMMISSIONAPPLYTYPE: "CA",
                STATUS: 'OK'
            };
            return new Promise((resolve, reject) => {
                this.post(req, (err, result) => {
                    this.logOperation("submerchant-update", req, result).then(() => {
                        if (err)
                            reject(err);
                        else if (result.responseCode != '00')
                            reject(this.generateErrorResponse(result));
                        else
                            resolve({
                                status: "success"
                            });
                    }).catch(err => reject(err));
                });
            });
        });
    }
    createSubMerchant(request) {
        return __awaiter(this, void 0, void 0, function* () {
            let req = {
                ACTION: "SELLERADD",
                MERCHANT: this.config.merchant,
                MERCHANTUSER: this.config.merchantUser,
                MERCHANTPASSWORD: this.config.merchantPassword,
                SELLERID: request.subMerchantExternalId,
                NAME: request.legalCompanyTitle,
                LASTNAME: request.legalCompanyTitle,
                EMAIL: request.email,
                MOBILENUMBER: '05555551111',
                IBAN: request.iban,
                COMMISSIONAPPLYTYPE: "CA",
                STATUS: 'OK'
            };
            return new Promise((resolve, reject) => {
                this.post(req, (err, result) => {
                    this.logOperation("submerchant-create", req, result).then(() => {
                        if (err)
                            reject(err);
                        else if (result.responseCode != '00') {
                            this.updateSubMerchant(request).then((r) => resolve(r)).catch(err => reject(err));
                            reject(this.generateErrorResponse(result));
                        }
                        else
                            resolve({
                                subMerchantKey: result.seller.sellerId,
                                status: "success"
                            });
                    }).catch(err => reject(err));
                });
            });
        });
    }
    static register() {
        creditcard_1.CreditcardPaymentFactory.register(ParatikaPayment.key, ParatikaPayment);
    }
}
exports.default = ParatikaPayment;
ParatikaPayment.key = "paratika";
