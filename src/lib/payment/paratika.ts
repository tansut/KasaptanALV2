import { PaymentRequest, CreditcardPaymentProvider, CreditcardPaymentFactory, PaymentResult, Creditcard, SubMerchantCreateRequest, SubMerchantCreateResult, SubMerchantItemApproveRequest, SubMerchantItemApproveResponse, SubMerchantUpdateResult } from "./creditcard";
import axios, { AxiosResponse } from "axios";
import { response } from "express";
import { Order } from "../../db/models/order";
import Helper from "../helper";
import PaymentMethod from "../../db/models/paymentmethod";
import { fail } from "node:assert";
var qs = require('qs');

export interface ParatikaConfig {
    apiKey: string,
    secretKey: string,
    uri: string;
    tdpost:string;
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

    post2(body: any, uri: string = null) {
        return new Promise((resolve, reject) => {
            this.post(body, (err, data) => {
                if (err) return reject(err);
                resolve(data)
            }, uri)
        })
    }

    post(body: any, handler: any, uri: string = null) {
        const config = {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        }
        axios.post(uri || this.config.uri, qs.stringify(body), config).then((result) => {
            // console.log("----------");
            // console.log(body);
            // console.log(result.data)
            handler(null, result.data)
        }).catch((err) => handler(err));
    }

    getSubmerchantId(o: Order) {
        return o.butcherid.toString()
    }

    async paySession(request: PaymentRequest) {
        let sessionRequest = this.createParatikaSessionReq(request);

        return new Promise((resolve, reject) => {
            this.post(sessionRequest, (err, sessionResult) => {
                this.logOperation("creditcard-pay-session-create",
                    request, sessionResult).then(() => {
                        if (err) reject(err);
                        else if (sessionResult.responseCode != '00')
                            reject(this.generateErrorResponse(sessionResult));
                        else {
                            resolve(sessionResult)
                        }
                    })
            })
        })
    }

    createParatikaSessionReq(request: PaymentRequest) {

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

        }
    }

    createParatikaPaymentReq(req: any, token) {
        return {
            ACTION: "SALE",
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
        let req = this.createParatikaSessionReq(request);
        return new Promise((resolve, reject) => {
            this.post(req, (err, sessionResult) => {
                this.logOperation("creditcard-payment-3d-session-create", request, sessionResult).then(() => {
                    if (err) reject(err);
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

                        }

                        return;

                        // this.post(pr, (err, result) => {
                        //     if (err) reject(err);
                        //     else {
                        //         resolve({
                        //             status: 'success',
                        //             conversationId: request.conversationId,
                        //             threeDSHtmlContent: result,
                        //             itemTransactions: [],
                        //             paidPrice: request.paidPrice,
                        //             paymentId: request.conversationId,
                        //             price: request.price
                        //         })
                        //     }
                        // }, `${this.config.uri}/post/sale3d/${sessionResult.sessionToken}`)
                    }
                }).catch(err => reject(err))
            });
        })
    }


    async pay3dHandshakeSuccess(result: any) {
        result = result || {};
        if (result.responseMsg == "Approved" && result.responseCode == '00') return true;
        else {
            await this.logOperation("3d-handshake-fail", result, {})
            return false;
        } 
    }

    async updateSavedCard(userid: number, token: string) {
        let req = {
            ACTION: "EWALLETEDITCARD",
            MERCHANT: this.config.merchant,
            MERCHANTUSER: this.config.merchantUser,
            MERCHANTPASSWORD: this.config.merchantPassword,
            CARDTOKEN: token,
            CUSTOMER: userid.toString()
        };

        let binResponse = null;
        binResponse = await this.post2(req)
    }

    async createSavedCreditcard(userid: number, response) {
        let req = {
            ACTION: "QUERYBIN",
            MERCHANT: this.config.merchant,
            MERCHANTUSER: this.config.merchantUser,
            MERCHANTPASSWORD: this.config.merchantPassword,
            CARDTOKEN: response.cardToken
        };

        let binResponse = null;
        try {
            binResponse = await this.post2(req)
        } finally {
            let save = new PaymentMethod();
            save.userid = userid;
            save.method = 'creditcard';
            save.instance = this.providerKey;
            save.data = response.cardToken;
            //save.customerId = response.customerId;
            save.enabled = true;
    
            save.name = (binResponse && binResponse.responseCode == "00" && binResponse.bin) ? `${binResponse.bin.cardNetwork} ${binResponse.bin.bin}****`: `${Helper.formatDate(Helper.Now())} kaydettiğim kredi kartım`
            await save.save();
        }
    }

    async pay3dComplete(response: any): Promise<PaymentResult> {
        
        let result: PaymentResult = {
            conversationId: response.merchantPaymentId,
            paidPrice: parseFloat(response.amount),
            paymentId: response.pgTranId,
            status: 'success',
            price: parseFloat(response.amount),
            itemTransactions: [
                {
                    itemId: response.merchantPaymentId,
                    paidPrice: parseFloat(response.amount),
                    paymentTransactionId: response.pgTranId,
                    price: parseFloat(response.amount)
                }
            ]
        }
        await response.cardToken && this.saveOrUpdateSavedCard(result.conversationId, response);
        return new Promise((resolve, reject) => {
                this.logOperation("creditcard-3d-complete", response, result).then(() => {
                    return this.savePayment("3d-paratika", response, result).then(() => resolve(result)).catch(err => reject(err));
                }).catch(err => reject(err))

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
                    paymentTransactionId: result.merchantPaymentId,
                    price: bi.price,
                    paidPrice: bi.price
                }
            })
        }
    }

    async pay(request: PaymentRequest, card: Creditcard): Promise<PaymentResult> {
        let req = this.createParatikaSessionReq(request);
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
                                this.savePayment('pos-paratika', pr, paymentRes)
                                    .then(() => resolve(paymentRes))
                                    .catch(err => reject(err));
                            }
                        })
                    }
                }).catch(err => reject(err))
            });
        })
    }

    async updateSubMerchant(request: SubMerchantCreateRequest): Promise<SubMerchantUpdateResult> {
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
        }      
        
        return new Promise((resolve, reject) => {
            this.post(req, (err, result) => {
                this.logOperation("submerchant-update", req, result).then(() => {
                    if (err) reject(err);
                    else if (result.responseCode != '00')
                        reject(this.generateErrorResponse(result));
                    else resolve({                        
                        status: "success"
                    });
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
            COMMISSIONAPPLYTYPE: "CA",
            STATUS: 'OK'
        }
        return new Promise((resolve, reject) => {
            this.post(req, (err, result) => {
                this.logOperation("submerchant-create", req, result).then(() => {
                    if (err) reject(err);
                    else if (result.responseCode != '00') {
                        this.updateSubMerchant(request).then((r)=>resolve(<any>r)).catch(err=>reject(err));
                        reject(this.generateErrorResponse(result));
                    }
                        
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