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

const paymentConfig = require(path.join(config.projectDir, `logistic.json`));

export enum VehicleType {
    Motor,
    Car
}

export interface Point {
    id?: string;
    address?: string;
    contactName: string;
    contactPhone: string;
    orderId: string;
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
    vehicleType: VehicleType;
    weight: number;
    points: Point[];
}

export interface BasicResponse {
}

export interface OfferRequest extends BasicRequest {

}

export interface OrderRequest extends BasicRequest {

}

export interface OfferResponse extends BasicResponse {
    deliveryFee: number;
    weightFee: number;
    discount: number;
    points: Point[];
}

export interface OrderResponse extends BasicResponse {
    orderId: string;
    status: string;
    statusDesc: string;
    deliveryFee: number;
    weightFee: number;
    payment: number;
    discount: number;
    createDate: Date;
    finishDate: Date;
    points: Point[];
}


export class LogisticProvider {
    logger: SiteLogRoute;
    userid: number;
    ip: string;

    fromOrder(o: Order): BasicRequest {
        let start = null, finish = null, shour= 0, fHour = 0 ;
        if (o.shipmentType == "plan" || o.shipmentType == "sameday") {
            shour = Math.round(o.shipmenthour/100);
            fHour = o.shipmenthour % 100;            
            start = new Date(o.shipmentdate.getFullYear(), o.shipmentdate.getMonth(), o.shipmentdate.getDate(), shour, 0, 0);
            finish = new Date(o.shipmentdate.getFullYear(), o.shipmentdate.getMonth(), o.shipmentdate.getDate(), fHour, 0, 0);            
        }
        return {
            matter: 'Gıda',
            vehicleType: VehicleType.Motor,
            weight: 0,
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
                    start: start ? start: undefined,
                    finish: finish ? finish: undefined,
                }
            ]
        }
    }

    offerFromOrder(o: Order): OfferRequest {
        let req = this.fromOrder(o);
        return req;
    }

    orderFromOrder(o: Order): OrderRequest {
        let req = this.fromOrder(o);
        return req;
    }    

    async requestOffer(req: OfferRequest): Promise<OfferResponse> {
        return null;
    }

    async createOrder(req: OrderRequest): Promise<OrderResponse> {
        return null;
    }    

    constructor(config: any) {
       
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

    static getInstance(key?: string): LogisticProvider {
        key = key || paymentConfig.default || config.paymentProvider
        const cls = LogisticFactory.items[key]
        return new cls(paymentConfig.providers[key][config.nodeenv])
    }

} 