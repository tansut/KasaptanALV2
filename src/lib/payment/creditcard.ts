var fs = require('fs')
import config from '../../config';
import * as path from "path";
import { Order } from '../../db/models/order';
import Helper from '../helper';
import Butcher from '../../db/models/butcher';
import SiteLogRoute from '../../routes/api/sitelog';
import { Transaction, or } from "sequelize";
import Payment from '../../db/models/payment';

const paymentConfig = require(path.join(config.projectDir, `payment.json`));

export type SubMerchantType = 'PRIVATE_COMPANY' | 'LIMITED_OR_JOINT_STOCK_COMPANY' | 'NONE'

export interface SubMerchantCreateRequest {
    name: string;
    taxOffice?: string;
    taxNumber?: string;
    legalCompanyTitle?: string;
    contactName?: string;
    contactSurname?: string;
    identityNumber?: string;
    email: string;
    address: string;

    iban: string;
    subMerchantExternalId: string;
    subMerchantType: SubMerchantType;    
}

export interface SubMerchantCreateResult {
    subMerchantKey: string;
    status: string;
    errorCode: string;
    errorMessage: string;
} 

export interface Creditcard {
    cardNumber: string;
    expireYear: string;
    expireMonth: string;
    cvc: string;
    cardHolderName: string;
}

export interface Buyer {
    id: string,
    name: string,
    surname: string,
    gsmNumber: string,
    email: string,
    identityNumber: string,
    registrationAddress: string,
    ip: string,
    city: string,
    country: string
}

export interface Address {
    contactName: string,
    city: string,
    country: string,
    address: string,
}


export interface BasketItem {
    id: string,
    name: string,
    category1: string,
    itemType: string,
    price: number;
     subMerchantKey?: string;
     subMerchantPrice?:number;
}

export interface PaymentRequest {
    price: number;
    paidPrice: number;
    currency: string;
    installment: string;
    registerCard: boolean;
    buyer: Buyer;
    shippingAddress: Address;
    billingAddress: Address;
    conversationId: string;
    basketId: string;
    basketItems: BasketItem[];    
    callbackUrl?: string;
}

export interface PaymentResult {
    status: string;
    threeDSHtmlContent?: string;
    paymentId: string;
    conversationId: string;
    paidPrice: number;
    price: number;
}

export type PaymentType = 'pre' | 'sales'

export interface PaymentTotal {
    paymentId: string;
    paid: number,
    type: PaymentType,
}


export class CreditcardPaymentProvider {

    logger: SiteLogRoute;
    userid: number;
    ip: string;

    constructor(config: any) {

    }

    validateCard(card: Creditcard) {

    }

    pay3dHandshakeSuccess(result: any): boolean {
        return false;
    }

    async savePayment(provider: string, payment: PaymentResult) {
        return Payment.create({
            userid: this.userid,
            conversationId: payment.conversationId,
            paymentId: payment.paymentId,
            provider: provider,
            ip: this.ip,
            price: payment.paidPrice
        })
    }

    get providerKey() {
        return "unset"
    }

    requestFromOrder(ol: Order[]): PaymentRequest {
        let basketItems: BasketItem [] = [];
        let price = 0.00, paidPrice = 0.00;
        ol.forEach((o, j) => {
            o.items.forEach((oi, i) => {
                basketItems.push({
                    category1: o.butcherName,
                    id: oi.product.id.toString() + '@' + o.butcherid.toString(),
                    itemType: 'PHYSICAL',
                    name: oi.product.name,
                    price: Helper.asCurrency(oi.price),
                    subMerchantKey: o.butcher[this.providerKey + "SubMerchantKey"],
                    subMerchantPrice: (i == 0 ? Helper.asCurrency(o.butcher.commissionFee): 0) + Helper.asCurrency(oi.price * (1.00 - o.butcher.commissionRate))
                }) 
            })
            price += Helper.asCurrency(o.subTotal) 
            paidPrice += Helper.asCurrency(o.total) 
        })

        let orderids = ol.map(o=>o.ordernum).join(',');
        let o = ol[0];

        let result = {
            price: Helper.asCurrency(price),
            paidPrice: Helper.asCurrency(paidPrice),
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
                gsmNumber: '',
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
        }
        return result;
    }

    subMerchantRequestFromButcher(b: Butcher): SubMerchantCreateRequest {
        return {
            address: b.address,
            email: b.email,
            iban: b.iban,
            name: b.name,
            legalCompanyTitle: b.legalName,
            subMerchantExternalId: b.id.toString(),
            subMerchantType: <any>b.companyType,
            taxNumber: b.taxNumber,
            taxOffice: b.taxOffice
        }
    }

    async logPaymentResult(logType: string, request: any, result: any) {
        if (this.logger) {
            let data = {
                request: request,
                response: result
            }
            return await this.logger.log( 
                {                    
                    logData: JSON.stringify(data),
                    logtype: logType,
                    f1: request.conversationId,
                    f2: result.paymentId,
                    status: result.status              
                }
            )
        } else return Promise.resolve();
    }

    async pay(request: PaymentRequest, card: Creditcard): Promise<PaymentResult> {
        return null;
    }

    async pay3dInit(request: PaymentRequest, card: Creditcard): Promise<PaymentResult> {
        return null;
    }

    async pay3dComplete(request: any): Promise<PaymentResult> {     
        return null   
    }

    async createSubMerchant(request: SubMerchantCreateRequest): Promise<SubMerchantCreateResult> {
        return null;
    }    
}

export class CreditcardPaymentFactory {
    static items: { [key: string]: typeof CreditcardPaymentProvider } = {}

    static register(key: string, cls: typeof CreditcardPaymentProvider) {
        CreditcardPaymentFactory.items[key] = cls;
        //console.log(key);
    }

    static getInstance(key?: string): CreditcardPaymentProvider {
        key = key || paymentConfig.default
        const cls = CreditcardPaymentFactory.items[key]
        return new cls(paymentConfig.providers[key][config.nodeenv])
    }

} 