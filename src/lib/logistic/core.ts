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
import { OrderSource, OrderType } from '../../models/order';
import { ShipmentTypeDesc } from '../../models/shipment';
import { GeoLocation } from '../../models/geo';
import Dispatcher from '../../db/models/dispatcher';
import { off } from 'process';
import Area from '../../db/models/area';
import ButcherArea from '../../db/models/butcherarea';

const paymentConfig = require(path.join(config.projectDir, `logistic.json`));

export interface CustomerPriceParams {
    distance?: number;
    orderTotal: number;
    regularPrice?: number;
}

export interface CustomerPriceConfig {
    kmPrice?: number;
    kmMin?: number;
    freeShip?: number;
    contrib?: number;
    kmMax?: number;
    minOrder?: number;
    kmMultiplier?: number;
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
    distance?:number;
}

export interface OrderRequest extends BasicRequest {
    notifyCustomerSms: boolean;
    distance?:number;
}

export interface OfferResponse extends BasicResponse {
    totalFee: number;
    deliveryFee?: number;
    weightFee?: number;
    discount?: number;
    points?: Point[];
    orderTotal: number;
    customerFee: number;
    distance?: number;
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
    orderTotal: number;
    customerFee: number;
    distance?: number;

}


export interface FromTo {
    sId?: string;
    fId?: string;
    start: GeoLocation;
    finish: GeoLocation;
}

export interface LogisticProviderOptions {
    dispatcher: Dispatcher
}


export interface DistanceParams {
    areaOnly?: boolean;

}

export class LogisticProvider {
    logger: SiteLogRoute;
    userid: number;
    ip: string;
    options: LogisticProviderOptions;
    lastOffer: OfferResponse;
    description: string;
    safeRequests: boolean = true;
    async distance(ft: FromTo, params: DistanceParams = null) {
        params = params || {
            areaOnly: true
        }
        let saved: ButcherArea = null;
        if (ft.sId && ft.fId) {
        saved = await ButcherArea.findOne({
            where: {
                butcherid: parseInt(ft.sId),
                areaid: parseInt(ft.fId),                
            },

            include:[{
                model: Area,
            }]
        })
        }
        let km = 0;
        if (saved) {
            let distanceDif = params.areaOnly ? 0.0: Helper.distance(ft.finish, saved.area.location);
            km = saved.bestKm + distanceDif;
        } 
        return km || Helper.distance(ft.start, ft.finish) * 1.5;
    }


    roundCustomerFee(x) {
        return Helper.asCurrency(Math.ceil(x/5)*5)
    }

    optimizedSlice(result: PriceSlice []) {
        let tobeRemoved = [], cleaned: PriceSlice [] = []
        for(var i = result.length-1; i >=0; i--) {
            let prev = i - 1;
            if (prev > 0) {
                if (result[i].cost == result[prev].cost) {
                    tobeRemoved.push(prev)
                }
            }
        }
        result.forEach((item,i)=> {
            if (tobeRemoved.findIndex(c=>c==i) < 0) 
            cleaned.push(item);
            if (cleaned.length > 1) {
                cleaned[cleaned.length-1].start = cleaned[cleaned.length-2].end
            }
        })
        return cleaned;
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
                contactPhone: '05326274151',
                id: fromTo.sId,
                lat: fromTo.start.coordinates[0],
                lng: fromTo.start.coordinates[1],
                orderId: ''
            }, {                
                address: 'Foo',
                contactPhone: '05326274151',
                id: fromTo.fId,
                lat: fromTo.finish.coordinates[0],
                lng: fromTo.finish.coordinates[1],
                orderId: ''
            }]
        }
        return req
    }

    calculateCustomerFee(offer: OfferResponse | OrderResponse) {
        offer.customerFee = offer.totalFee;
    }


    async priceSlice(ft: FromTo, slice: number = 100.00, options = {}): Promise<PriceSlice[]> {
        let prices = [], result: PriceSlice[] = [];
        
        return result;
    }

    fromOrder(o: Order): BasicRequest {
        let finish = null;
        if (o.shipmentType == "plan" || o.shipmentType == "sameday") {
            o.shipmentstart = o.shipmentstart || Helper.Now();
            finish = new Date(o.shipmentstart);
            finish.setHours(o.shipmentstart.getHours() + 1);
            // shour = Math.round(o.shipmenthour / 100);
            // fHour = o.shipmenthour % 100;
            // start = Helper.newDate2(o.shipmentdate.getFullYear(), o.shipmentdate.getMonth(), o.shipmentdate.getDate(), shour, 0, 0);
            // finish = Helper.newDate2(o.shipmentdate.getFullYear(), o.shipmentdate.getMonth(), o.shipmentdate.getDate(), fHour, 0, 0);
            // start = start < Helper.Now() ? null: start;
            // finish = !start ? null: finish;
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
                    id: o.butcher.id.toString(),
                    orderId: o.ordernum,
                    start: o.shipmentstart,
                    note: "Kasaba uğrayıp müşteri paketini alın"
                },
                {
                    id: o.areaLevel3Id ? o.areaLevel3Id.toString(): '',
                    address: o.displayAddress,
                    contactName: o.name,
                    contactPhone: o.phone,
                    lat: o.shipLocation.coordinates[0],
                    lng: o.shipLocation.coordinates[1],
                    orderId: o.ordernum,
                    note: o.adresTarif,
                    apartment: `Bina: ${o.bina}`,
                    floor: `Kat: ${o.kat}`,
                    entrance: `Daire: ${o.daire}`,
                    finish: finish,
                }
            ]
        }
    }
    



    offerFromOrder(o: Order): OfferRequest {
        let req: OfferRequest = <any>this.fromOrder(o);
        req.notifyCustomerSms = true;
        return req;
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