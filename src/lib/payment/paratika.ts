import { PaymentRequest, CreditcardPaymentProvider, CreditcardPaymentFactory, PaymentResult, Creditcard, SubMerchantCreateRequest, SubMerchantCreateResult, SubMerchantItemApproveRequest, SubMerchantItemApproveResponse } from "./creditcard";
import axios, { AxiosResponse } from "axios";
import { response } from "express";
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
       axios.post(this.config.uri, qs.stringify(body), config).then((result)=> {
           handler(null, result.data)
       }).catch((err)=>handler(err));        
    }

    createParatikaPaymentReq(request: PaymentRequest, card: Creditcard) {
        return {
            ACTION: "SALE",
            AMOUNT: request.paidPrice,
            CURRENCY: "TRY",
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
            CARDCVV: card.cvc
        }
    }

    get providerKey() {
        return ParatikaPayment.key
    }
    generateErrorResponse(response: any) {
        response.errorMessage = response.errorMsg;
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


    async pay(request: PaymentRequest, card: Creditcard): Promise<PaymentResult> {
        let req = this.createParatikaPaymentReq(request, card);
        return new Promise((resolve, reject) => {
            this.post(req, (err, result) => {
                this.logOperation("creditcard-payment-create", request, result).then(() => {
                    if (err) reject(err);
                    else if (result.responseCode != '00') 
                        reject(this.generateErrorResponse(result));
                    else return this.savePayment('pos-paratika', request, result).then(() => resolve(result)).catch(err => reject(err));
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
            this.post(req,  (err, result) => {
                this.logOperation("submerchant-create", req, result).then(() => {
                    if (err) reject(err);
                    else if (result.responseCode != '00') 
                        reject(this.generateErrorResponse(result));
                    else resolve({
                        subMerchantKey: result.seller.merchant.businessId,
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