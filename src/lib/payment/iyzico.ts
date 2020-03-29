import {PaymentRequest, CreditcardPaymentProvider, CreditcardPaymentFactory, PaymentResult, Creditcard, SubMerchantCreateRequest, SubMerchantCreateResult } from "./creditcard";

var Iyzipay = require('iyzipay');

export interface IyzicoConfig {
    apiKey: string,
    secretKey: string,
    uri: string;
}

export default class IyziPayment extends CreditcardPaymentProvider {
    static key = "iyzico";
    private iyzipay: any;
    constructor(config: IyzicoConfig) {
        super(config);
        this.iyzipay = new Iyzipay(config);
    }

    createIyzicoPaymentReq(request: PaymentRequest, card: Creditcard) {
        let req = <any>request;
        req.paymentCard = card;
        return req;
    }

    async pay3dInit(request: PaymentRequest, card: Creditcard): Promise<PaymentResult> {
        let req = this.createIyzicoPaymentReq(request, card);
        
        return new Promise((resolve, reject) => {
            this.iyzipay.threedsInitialize.create(req, (err, result) => {
                this.logPaymentResult("creditcard-3d-init", request, result).then(() => {
                    if (err) reject(err);
                    else if (result.status == 'failure') reject(result);
                    else resolve(result);
                }).catch(err=>reject(err))
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
                this.logPaymentResult("creditcard-3d-complete", request, result).then(() => {                    
                    if (err) reject(err);
                    else if (result.status == 'failure') reject(result);
                    else return this.savePayment("3d-iyzico", result).then(()=>resolve(result)).catch(err=>reject(err));
                }).catch(err=>reject(err))
            });
        })
    }


    async pay(request: PaymentRequest, card: Creditcard): Promise<PaymentResult> {
        let req = this.createIyzicoPaymentReq(request, card);
        
        return new Promise((resolve, reject) => {
            this.iyzipay.payment.create(req, (err, result) => {
                this.logPaymentResult("creditcard-payment-create", request, result).then(() => {
                    if (err) reject(err);
                    else if (result.status == 'failure') reject(result);
                    else return this.savePayment('pos-iyzico', result).then(()=>resolve(result)).catch(err=>reject(err));                    
                }).catch(err=>reject(err))
            });
        })
    }

    async createSubMerchant(request: SubMerchantCreateRequest): Promise<SubMerchantCreateResult> {
        return new Promise((resolve, reject) => {
            this.iyzipay.subMerchant.create(request, function (err, result) {
                if (err) reject(err);
                else if (result.status == 'failure') reject(result);
                else resolve(result);
            });
        })
    }


    static register() {
        CreditcardPaymentFactory.register(IyziPayment.key, IyziPayment)
    }
} 