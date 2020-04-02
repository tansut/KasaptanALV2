import { PaymentRequest, CreditcardPaymentProvider, CreditcardPaymentFactory, PaymentResult, Creditcard, SubMerchantCreateRequest, SubMerchantCreateResult, SubMerchantItemApproveRequest, SubMerchantItemApproveResponse } from "./creditcard";
import axios, { AxiosResponse } from "axios";
import { response } from "express";
import { Order } from "../../db/models/order";
import Helper from "../helper";
var qs = require('qs');

export interface ParatikaConfig {
    apiKey: string,
    secretKey: string,
    uri: string;
    merchantUser: string,
    merchantPassword: string,
    merchant: string,
}

export default class ParatikaPayment extends CreditcardPaymentProvider {
    static key = "paratika";
    private iyzipay: any;
    private config: ParatikaConfig;

    constructor(config: ParatikaConfig) {
        super(config);
        this.config = config;
    }

    post(body: any, handler: any) {
        const config = {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        }
        axios.post(this.config.uri, qs.stringify(body), config).then((result) => {
            console.log("----------");
            console.log(body);
            console.log(result.data)
            handler(null, result.data)
        }).catch((err) => handler(err));
    }

    getSubmerchantId(o: Order) {
        return o.butcherid.toString()
    }

    createParatikaSessionReq(request: PaymentRequest, card: Creditcard) {

        let sellerTotal = 0.00
        let oi = request.basketItems.map(bi => {
            sellerTotal += Helper.asCurrency(bi.subMerchantPrice)
            return {
                code: bi.id,
                name: bi.name,
                amount: bi.price,
                sellerId: bi.subMerchantKey,
                sellerPaymentAmount: bi.subMerchantPrice,
                description: "product",
                quantity: 1
            }
        })


        return {
            ACTION: "SESSIONTOKEN",
            SESSIONTYPE: "PAYMENTSESSION",
            AMOUNT: request.paidPrice,
            CURRENCY: "TRY",
            RETURNURL: "http://localhost/pay-session",
            MERCHANTPAYMENTID: request.conversationId,
            MERCHANTUSER: this.config.merchantUser,
            MERCHANTPASSWORD: this.config.merchantPassword,
            MERCHANT: this.config.merchant,
            CUSTOMER: request.buyer.name,
            CUSTOMERNAME: request.buyer.name,
            CUSTOMEREMAIL: request.buyer.email,
            CUSTOMERIP: request.buyer.ip,
            CUSTOMERUSERAGENT: "Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/43.0.2357.81 Safari/537.36",
            NAMEONCARD: card.cardHolderName,
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
            CARDPAN: card.cardNumber,
            CARDEXPIRY: `${card.expireMonth}.${card.expireYear}`,
            CARDCVV: card.cvc,
            ORDERITEMS: JSON.stringify(oi),
            TOTALSELLERPAYMENTAMOUNT: sellerTotal

        }
    }

    createParatikaPaymentReq(req: any, token) {
        // req.ACTION = "SALE";
        // //req.ORDERITEMS = undefined;
        // req.INSTALLMENTS = 1;
        // req.SESSIONTOKEN = token;
        // return req
        return {
            ACTION: "SALE",
            // MERCHANTUSER: this.config.merchantUser,
            // MERCHANTPASSWORD: this.config.merchantPassword,
            // MERCHANTPAYMENTID: req.MERCHANTPAYMENTID,
            // MERCHANT: this.config.merchant,
                CARDPAN: req.CARDPAN,
                CARDEXPIRY: req.CARDEXPIRY,
                NAMEONCARD: req.NAMEONCARD,
                CARDCVV: req.CARDCVV,
                SESSIONTOKEN: token
        }
    }

    get providerKey() {
        return ParatikaPayment.key
    }

    generateErrorResponse(response: any) {
        response.errorMessage = response.errorMsg;
        return response
    }

    async approveItem(request: SubMerchantItemApproveRequest): Promise<SubMerchantItemApproveResponse> {
        return new Promise((resolve, reject) => {
            this.iyzipay.approval.create(request, (err, result) => {
                this.logOperation("submerchant-approval", request, result).then(() => {
                    if (err) reject(err);
                    else if (result.responseCode == '99' || result.responseCode == '98')
                        reject(this.generateErrorResponse(result));
                    else resolve(result);
                }).catch(err => reject(err))
            });
        })
    }

    async disApproveItem(request: SubMerchantItemApproveRequest): Promise<SubMerchantItemApproveResponse> {
        return new Promise((resolve, reject) => {
            this.iyzipay.disapproval.create(request, (err, result) => {
                this.logOperation("submerchant-disapproval", request, result).then(() => {
                    if (err) reject(err);
                    else if (result.status == 'failure') reject(result);
                    else resolve(result);
                }).catch(err => reject(err))
            });
        })
    }

    async pay3dInit(request: PaymentRequest, card: Creditcard): Promise<PaymentResult> {
        let req = this.createParatikaPaymentReq(request, card);

        return new Promise((resolve, reject) => {
            this.iyzipay.threedsInitialize.create(req, (err, result) => {
                this.logOperation("creditcard-3d-init", request, result).then(() => {
                    if (err) reject(err);
                    else if (result.status == 'failure') reject(result);
                    else resolve(result);
                }).catch(err => reject(err))
            });
        })
    }

    pay3dHandshakeSuccess(result: any) {
        result = result || {};
        if (result.mdStatus == "1" && result.status == 'success') return true;
        else return false;
    }

    async pay3dComplete(request: any): Promise<PaymentResult> {
        let req = request;
        return new Promise((resolve, reject) => {
            this.iyzipay.threedsPayment.create(req, (err, result) => {
                this.logOperation("creditcard-3d-complete", request, result).then(() => {
                    if (err) reject(err);
                    else if (result.status == 'failure') reject(result);
                    else return this.savePayment("3d-iyzico", request, result).then(() => resolve(result)).catch(err => reject(err));
                }).catch(err => reject(err))
            });
        })
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

    convertParatikaPaymentResult(request: PaymentRequest, result: any): PaymentResult {
        return {
            conversationId: request.conversationId,
            paidPrice: result.amount,
            price: result.amount,
            status: 'success',
            paymentId: result.merchantPaymentId,
            itemTransactions: request.basketItems.map(bi => {
                return {
                    itemId: bi.id,
                    paymentTransactionId: result.merchantPaymentId;
                    price: bi.price,
                    paidPrice: bi.price                   
                }
            })
        }
    }

    async pay(request: PaymentRequest, card: Creditcard): Promise<PaymentResult> {
        let req = this.createParatikaSessionReq(request, card);
        return new Promise((resolve, reject) => {
            this.post(req, (err, result) => {
                this.logOperation("creditcard-payment-session-create", request, result).then(() => {
                    if (err) reject(err);
                    else if (result.responseCode != '00')
                        reject(this.generateErrorResponse(result));
                    else {
                        let pr = this.createParatikaPaymentReq(req, result.sessionToken);

                        this.post(pr, (err, result) => {
                            if (err) reject(err);
                            else if (result.responseCode != '00')
                                reject(this.generateErrorResponse(result));
                            else {
                                let paymentRes: PaymentResult = this.convertParatikaPaymentResult(request, result)
                                this.savePayment('pos-paratika', pr, result)
                                .then(() => resolve(paymentRes))
                                    .catch(err => reject(err));
                            }
                        })
                    }
                }).catch(err => reject(err))
            });
        })
    }

    async createSubMerchant(request: SubMerchantCreateRequest): Promise<SubMerchantCreateResult> {
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
            COMMISSIONAPPLYTYPE: "CA"
        }
        return new Promise((resolve, reject) => {
            this.post(req, (err, result) => {
                this.logOperation("submerchant-create", req, result).then(() => {
                    if (err) reject(err);
                    else if (result.responseCode != '00')
                        reject(this.generateErrorResponse(result));
                    else resolve({
                        subMerchantKey: result.seller.sellerId,
                        status: "success"
                    });
                }).catch(err => reject(err))
            });
        })
    }


    static register() {
        CreditcardPaymentFactory.register(ParatikaPayment.key, ParatikaPayment)
    }
} 