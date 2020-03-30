import {PaymentRequest, CreditcardPaymentProvider, CreditcardPaymentFactory, PaymentResult, Creditcard, SubMerchantCreateRequest, SubMerchantCreateResult, SubMerchantItemApproveRequest, SubMerchantItemApproveResponse } from "./creditcard";

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

    get providerKey() {
        return IyziPayment.key
    }

    async approveItem(request: SubMerchantItemApproveRequest): Promise<SubMerchantItemApproveResponse> {
        return new Promise((resolve, reject) => {
            this.iyzipay.approval.create(request, (err, result) => {
                this.logOperation("submerchant-approval", request, result).then(() => {
                    if (err) reject(err);
                    else if (result.status == 'failure') reject(result);
                    else resolve(result);
                }).catch(err=>reject(err))
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
                }).catch(err=>reject(err))
            });
        })          
    }     

    async pay3dInit(request: PaymentRequest, card: Creditcard): Promise<PaymentResult> {
        let req = this.createIyzicoPaymentReq(request, card);
        
        return new Promise((resolve, reject) => {
            this.iyzipay.threedsInitialize.create(req, (err, result) => {
                this.logOperation("creditcard-3d-init", request, result).then(() => {
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
                this.logOperation("creditcard-3d-complete", request, result).then(() => {                    
                    if (err) reject(err);
                    else if (result.status == 'failure') reject(result);
                    else return this.savePayment("3d-iyzico", request, result).then(()=>resolve(result)).catch(err=>reject(err));
                }).catch(err=>reject(err))
            });
        })
    }


    async pay(request: PaymentRequest, card: Creditcard): Promise<PaymentResult> {
        let req = this.createIyzicoPaymentReq(request, card);
        
        return new Promise((resolve, reject) => {
            this.iyzipay.payment.create(req, (err, result) => {
                this.logOperation("creditcard-payment-create", request, result).then(() => {
                    if (err) reject(err);
                    else if (result.status == 'failure') reject(result);
                    else return this.savePayment('pos-iyzico', request, result).then(()=>resolve(result)).catch(err=>reject(err));                    
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