var fs = require('fs')
import config from '../../config';
import * as path from "path";
import { Order } from '../../db/models/order';
import Helper from '../helper';
import Butcher from '../../db/models/butcher';
import SiteLogRoute from '../../routes/api/sitelog';
import { Transaction, or } from "sequelize";
import Payment from '../../db/models/payment';
import { ComissionHelper } from '../commissionHelper';
import AccountModel from '../../db/models/accountmodel';
import { Account } from '../../models/account';

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
    errorCode?: string;
    errorMessage?: string;
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
    merchantDebtApplied?: number;
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
    itemTransactions: ItemTransaction[];
}

export interface ItemTransaction {
    itemId: string;
    paymentTransactionId: string;
    //transactionStatus: number,
    price: number,
    paidPrice: number    
}

export interface SubMerchantItemApproveRequest {
    paymentTransactionId: string;
    conversationId?: string;
}

export interface SubMerchantItemApproveResponse {
    paymentTransactionId: string;
    conversationId?: string;
    status: string;
    errorCode: string;
    errorMessage:string;
}


export type PaymentType = 'pre' | 'sales'

export interface PaymentTotal {
    paymentId: string;
    paid: number,
    type: PaymentType,
}

export interface ErrorResponse {
    errorCode: string;
    errorMessage: string;
}


export class CreditcardPaymentProvider {

    logger: SiteLogRoute;
    userid: number;
    ip: string;
    marketPlace: boolean = false;

    constructor(config: any) {
        this.marketPlace = config.marketPlace == "true";
    }

    validateCard(card: Creditcard) {

    }

    pay3dHandshakeSuccess(result: any): boolean {
        return false;
    }

    async savePayment(provider: string, request: any, response: PaymentResult) {
        return Payment.create({
            userid: this.userid,
            conversationId: response.conversationId,
            paymentId: response.paymentId,
            provider: provider,
            ip: this.ip,
            price: response.paidPrice,
            request: JSON.stringify(request),
            response: JSON.stringify(response)
        })
    }

    get providerKey() {
        return "unset"
    }

    getSubmerchantId(o: Order) {
        return o.butcher[this.providerKey + "SubMerchantKey"]
    }

    async paySession(request: PaymentRequest, card: Creditcard) {
        return false
    }

    getMerchantMoney(o: Order, shouldBePaid: number) {
        let butcherPuanEarned = o.butcherPuanAccounts.find(p => p.code == 'total');
        let kalitteOnlyPuanEarned = o.kalitteOnlyPuanAccounts.find(p => p.code == 'total');
        let kalitteByButcherEarned = o.kalitteByButcherPuanAccounts.find(p => p.code == 'total');
        let calc = new ComissionHelper(o.butcher.commissionRate, o.butcher.commissionFee);
        let totalFee = calc.calculateButcherComission(shouldBePaid);
        let merchantPrice = Helper.asCurrency(totalFee.inputTotal - totalFee.kalitteFee - totalFee.kalitteVat);
        let butcherPuan = Helper.asCurrency(butcherPuanEarned.alacak - butcherPuanEarned.borc);
        let kalitteByButcherPuan = Helper.asCurrency(kalitteByButcherEarned.alacak - kalitteByButcherEarned.borc);
        let totalPuanByButcher = Helper.asCurrency(butcherPuan + kalitteByButcherPuan);
        merchantPrice = Helper.asCurrency(merchantPrice - totalPuanByButcher);
        return merchantPrice;
    }


    requestFromOrder(ol: Order[], debts: { [key: string]: number; } = {}): PaymentRequest {
        let basketItems: BasketItem [] = [];
        let price = 0.00, paidPrice = 0.00;
        ol.forEach((o, j) => {            
            let total = o.workedAccounts.find(p => p.code == 'total');

            let shouldBePaid = Helper.asCurrency(total.alacak - total.borc);

            let merchantPrice = 0.00;       
            
            let butcherDebt = 0.00, debtApplied = 0.00;
            
            if (this.marketPlace) {                
                merchantPrice = this.getMerchantMoney(o, shouldBePaid);                               
                butcherDebt = debts[o.butcherid];
                if (merchantPrice <= butcherDebt) {
                    debtApplied = merchantPrice - 1.00;
                } else debtApplied = butcherDebt;
                merchantPrice = Helper.asCurrency(this.getMerchantMoney(o, shouldBePaid) - debtApplied); 

            }
            basketItems.push({
                category1: o.butcherName,
                id: o.ordernum,
                itemType: 'PHYSICAL',
                name: o.name + ' ' + o.ordernum + ' nolu ' + 'ürün siparişi',
                price: Helper.asCurrency(shouldBePaid),
                merchantDebtApplied: debtApplied,
                subMerchantKey: this.marketPlace ? this.getSubmerchantId(o): undefined,
                subMerchantPrice: merchantPrice > 0.00 ? merchantPrice: undefined
            }) 

            price += Helper.asCurrency(shouldBePaid); 
            paidPrice += Helper.asCurrency(shouldBePaid); 
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
        }
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

    subMerchantRequestFromButcher(b: Butcher): SubMerchantCreateRequest {
        return {
            address: b.address,
            email: b.email,
            iban: b.iban,
            name: b.name,
            legalCompanyTitle: b.legalName,
            subMerchantExternalId: b.id.toString(),
            subMerchantType: <any>b.companyType,
            taxNumber: b.companyType == 'LIMITED_OR_JOINT_STOCK_COMPANY' ? b.taxNumber: undefined,
            taxOffice: b.taxOffice,
            identityNumber: b.companyType != 'LIMITED_OR_JOINT_STOCK_COMPANY' ? b.taxNumber: undefined
        }
    }

    async logOperation(logType: string, request: any, result: any) {
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

    async approveItem(request: SubMerchantItemApproveRequest): Promise<SubMerchantItemApproveResponse> {
        return null;
    }    

    async disApproveItem(request: SubMerchantItemApproveRequest): Promise<SubMerchantItemApproveResponse> {
        return null;
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
    }

    static getInstance(key?: string): CreditcardPaymentProvider {
        key = key || paymentConfig.default || config.paymentProvider
        const cls = CreditcardPaymentFactory.items[key]
        return new cls(paymentConfig.providers[key][config.nodeenv])
    }

} 