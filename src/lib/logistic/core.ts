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
import { OrderSource } from '../../models/order';
import { ShipmentTypeDesc } from '../../models/shipment';
import { GeoLocation } from '../../models/geo';
import Dispatcher from '../../db/models/dispatcher';
import { off } from 'process';

const paymentConfig = require(path.join(config.projectDir, `logistic.json`));

export interface CustomerPriceParams {
    distance?: number;
    orderTotal: number;
    regularPrice?: number;
}

export interface CustomerPriceConfig {
    offerPrice?: number;
    pricePerKM?: number;
    priceStartsAt?: number;
    freeShipPerKM?: number;
    contribitionRatio?: number;
    maxDistance?: number;
    minOrder?: number;
}

export enum VehicleType {
    Motor,
    Car
}

export interface PriceSlice {
    start?: number;
    end?: number;
    cost: number;
}



export interface Point {
    id?: string;
    address?: string;
    contactName?: string;
    contactPhone?: string;
    orderId?: string;
    lat: number;
    lng: number;
    note?: string;
    entrance?: string;
    floor?: string;
    apartment?: string;
    start?: Date,
    finish?: Date,
    arrivalEstimatedStart?: Date,
    arrivalEstimatedFinish?: Date,
    arrivalActual?: Date
}

export interface BasicRequest {
    matter: string;
    orderTotal: number;
    vehicleType: VehicleType;
    weight: number;
    points: Point[];
}

export interface BasicResponse {
}

export interface OfferRequest extends BasicRequest {
    notifyCustomerSms: boolean;
}

export interface OrderRequest extends BasicRequest {
    notifyCustomerSms: boolean;
}

export interface OfferResponse extends BasicResponse {
    totalFee: number;
    deliveryFee?: number;
    weightFee?: number;
    discount?: number;
    points?: Point[];
    customerFee: number;
}

export interface OrderResponse extends BasicResponse {
    orderId: string;
    status: string;
    statusDesc: string;
    totalFee: number;
    deliveryFee: number;
    weightFee: number;
    payment: number;
    discount: number;
    createDate: Date;
    finishDate: Date;
    points: Point[];
}


export interface FromTo {
    start: GeoLocation;
    finish: GeoLocation;
}

export interface LogisticProviderOptions {
    dispatcher: Dispatcher
}


export class LogisticProvider {
    logger: SiteLogRoute;
    userid: number;
    ip: string;
    options: LogisticProviderOptions;
    lastOffer: OfferResponse;

    async distance(ft: FromTo) {
        return Helper.distance(ft.start, ft.finish);
    }


    offerRequestFromTo(fromTo: FromTo): OfferRequest {
        let req: OfferRequest = {
            orderTotal: 0.00,
            weight: 0,
            matter: 'Gıda',
            notifyCustomerSms: false,
            vehicleType: VehicleType.Motor,
            points: [{
                address: 'Foo',
                contactPhone: '05326374151',
                lat: fromTo.start.coordinates[0],
                lng: fromTo.start.coordinates[1],
                orderId: ''
            }, {
                address: 'Foo',
                contactPhone: '05326374151',
                lat: fromTo.finish.coordinates[0],
                lng: fromTo.finish.coordinates[1],
                orderId: ''
            }]
        }
        return req
    }

    async offerFromTo(fromTo: FromTo): Promise<OfferResponse> {
        let req = this.offerRequestFromTo(fromTo);
        return await this.requestOffer(req)
    }


    async priceSlice(distance: FromTo, slice: number = 50.00, options = {}): Promise<PriceSlice[]> {
        let arr: PriceSlice[] = []

        return arr;
    }

    fromOrder(o: Order): BasicRequest {
        let start = null, finish = null, shour = 0, fHour = 0;
        if (o.shipmentType == "plan" || o.shipmentType == "sameday") {
            shour = Math.round(o.shipmenthour / 100);
            fHour = o.shipmenthour % 100;
            start = new Date(o.shipmentdate.getFullYear(), o.shipmentdate.getMonth(), o.shipmentdate.getDate(), shour, 0, 0);
            finish = new Date(o.shipmentdate.getFullYear(), o.shipmentdate.getMonth(), o.shipmentdate.getDate(), fHour, 0, 0);
        }
        return {
            matter: 'Gıda',
            vehicleType: VehicleType.Motor,
            weight: 0,
            orderTotal: o.subTotal,
            points: [
                {
                    address: o.butcher.address,
                    contactName: o.butcher.name,
                    contactPhone: o.butcher.phone,
                    lat: o.butcher.lat,
                    lng: o.butcher.lng,
                    orderId: o.ordernum,
                    note: "Lütfen kasaba uğrayıp müşteri paketini alın: " + o.butcher.address,
                },
                {
                    address: o.displayAddress,
                    contactName: o.name,
                    contactPhone: o.phone,
                    lat: o.shipLocation.coordinates[0],
                    lng: o.shipLocation.coordinates[1],
                    orderId: o.ordernum,
                    note: o.displayAddress,
                    apartment: `Bina: ${o.bina}`,
                    floor: `Kat: ${o.kat}`,
                    entrance: `Daire: ${o.daire}`,
                    start: start ? start : undefined,
                    finish: finish ? finish : undefined,
                }
            ]
        }
    }

    getCustomerFeeConfig(): CustomerPriceConfig {
        return null;
    }

    calculateFeeForCustomer(params: CustomerPriceParams): OfferResponse {
        let input: CustomerPriceConfig = this.getCustomerFeeConfig();
        if (!input) return null;
        let fee = 0.00;
        if (input.maxDistance && params.distance > input.maxDistance)
            return null;
        if (input.minOrder && params.orderTotal < input.minOrder)
            return null;
        if (input.priceStartsAt && params.distance < input.priceStartsAt)
            fee = 0.00;
        let regular = params.distance ? Helper.asCurrency(input.pricePerKM * params.distance) : input.offerPrice;
        let contrib = input.contribitionRatio ? Helper.asCurrency(params.orderTotal * input.contribitionRatio) : 0.00;
        let free = input.freeShipPerKM ? (input.freeShipPerKM * params.distance) : 0.00;
        if (params.orderTotal >= free) fee = 0;
        let calc = Math.max(0, regular - contrib);
        fee = Helper.asCurrency(Math.round(calc / 2.5) * 2.5)
        return {
            totalFee: regular,
            customerFee: fee
        }
    }



    offerFromOrder(o: Order): OfferRequest {
        let req: OfferRequest = <any>this.fromOrder(o);
        req.notifyCustomerSms = true;
        return req;
    }

    async offerFromDispatcher(to: GeoLocation) {
       let fromTo: FromTo = {
           start: this.options.dispatcher.butcher.location,
           finish: to
       }
       let offer = await this.offerFromTo(fromTo);
       return offer;
    }

    orderFromOrder(o: Order): OrderRequest {
        let req: OrderRequest = <any>this.fromOrder(o);
        req.notifyCustomerSms = true;
        return req;
    }

    async requestOffer(req: OfferRequest): Promise<OfferResponse> {
        return null;
    }

    async createOrder(req: OrderRequest): Promise<OrderResponse> {
        return null;
    }

    constructor(config: any, options: LogisticProviderOptions) {
        this.options = options;
    }

    get providerKey() {
        return "unset"
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


}

export class LogisticFactory {
    static items: { [key: string]: typeof LogisticProvider } = {}

    static register(key: string, cls: typeof LogisticProvider) {
        LogisticFactory.items[key] = cls;
    }

    static getInstance(key: string, options: LogisticProviderOptions): LogisticProvider {
        key = key || paymentConfig.default || config.paymentProvider
        const cls = LogisticFactory.items[key]

        return new cls(paymentConfig.providers[key][config.nodeenv], options)
    }

} 