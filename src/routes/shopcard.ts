import { ApiRouter, ViewRouter, IRequestParams } from '../lib/router';
import * as express from "express";
import * as maps from "@google/maps"
import ButcherModel from '../db/models/butcher';
import moment = require('moment');
import { Auth, ProductTypeManager, ProductTypeFactory, KurbanProductManager } from '../lib/common';
import AreaModel from '../db/models/area';
import Helper from '../lib/helper';
import Area from '../db/models/area';
import Category from '../db/models/category';
import Content from '../db/models/content';
import config from '../config';
import * as path from 'path';
import * as fs from 'fs';
import { readFileSync } from 'fs';
import { ShopCard } from '../models/shopcard';
import { ShipmentType, ShipmentTypeDesc, ShipmentHours, ShipmentDays, Shipment, ShipmentHowToDesc } from '../models/shipment';
import { PaymentTypeDesc } from '../models/payment';
import { Order, OrderItem } from '../db/models/order';
import Dispatcher, { DispatcherQuery } from './api/dispatcher';
import OrderApi from './api/order';
let ellipsis = require('text-ellipsis');
var MarkdownIt = require('markdown-it')
import { Creditcard, CreditcardPaymentFactory } from '../lib/payment/creditcard'
import { PuanCalculator, ComissionHelper } from '../lib/commissionHelper';
import { PuanResult } from '../models/puan';
import { DispatcherTypeDesc } from '../db/models/dispatcher';
import { all } from 'sequelize/types/lib/operators';
import { OfferResponse, OfferRequest, FromTo } from '../lib/logistic/core';
import { off } from 'process';
import { GeoLocation } from '../models/geo';
import email from '../lib/email';

export default class Route extends ViewRouter {
    shopcard: ShopCard;
    DispatcherTypeDesc = DispatcherTypeDesc
    shipmentHours = ShipmentHours;
    shipmentDays = ShipmentDays;
    moment = moment;
    markdown = new MarkdownIt();

    Shipment = Shipment;
    Butchers: ButcherModel[] = null;
    puanCalculator: PuanCalculator;
    mayEarnPuanTotal = 0.00;
    usablePuanTotal = 0.00;
    possiblePuanList: PuanResult[] = [];
    orderapi: OrderApi;

    destinationMatrix = {} 


    async getOrderSummary() {
        await this.loadButchers();
        let orders = []
        this.mayEarnPuanTotal = 0.00;
        this.usablePuanTotal = 0.00;
        if (this.shopcard.items.length > 0) {
            orders = await this.orderapi.getFromShopcard(this.shopcard);
            for (var i = 0; i < orders.length; i++) {
                if (this.req.user) {
                    await this.orderapi.fillFirstOrderDetails(orders[i]);
                }
                let puanUsable = await this.orderapi.getUsablePuans(orders[i]);
                this.usablePuanTotal+=puanUsable;
                let list = this.orderapi.getPossiblePuanGain(orders[i], this.shopcard.getButcherTotalWithoutShipping(orders[i].butcherid), true);
                this.possiblePuanList = this.possiblePuanList.concat(list);
            }
            this.possiblePuanList.forEach(pg => this.mayEarnPuanTotal += pg.earned)
            this.mayEarnPuanTotal = Helper.asCurrency(this.mayEarnPuanTotal);
            if (this.req.user) {
                this.usablePuanTotal = Math.min(this.usablePuanTotal, this.req.user.usablePuans);
            }
        }
        return orders;
    }


    renderPage(page: string, userMessage?: any) {
        userMessage = userMessage || {}
        this.sendView(page, {
            ...userMessage, ...{
                shopcard: this.shopcard,
            }
        })
    }





    @Auth.Anonymous()
    async viewRoute() {
        this.shopcard = await ShopCard.createFromRequest(this.req);
        await this.setDispatcher();
        await this.getOrderSummary();
        this.renderPage(`pages/shopcard.ejs`)

    }


    shipPossibleToday(): boolean {
        return Object.keys(this.Shipment.availableTimes()).length > 0;
    }

    @Auth.Anonymous()
    async savecardRoute() {
        this.shopcard = await ShopCard.createFromRequest(this.req);
        this.shopcard.note = this.req.body["order-comments"] || "";
        await this.setDispatcher();        
        if (this.shopcard.getOrderType() == 'kurban') {
            let man = ProductTypeFactory.create('kurban', this.shopcard.items[0].productTypeData) as KurbanProductManager;
            let ship = this.shopcard.shipment[Object.keys(this.shopcard.shipment)[0]];
            this.fillDefaultAddress();
            if (['0', '1', '2'].indexOf(man.teslimat) >= 0) {
                ship.howTo = "take";
                 await this.shopcard.saveToRequest(this.req);
                this.renderPage("pages/checkout.adres-take.ejs")
            } else {
                ship.howTo = "ship";
                await this.shopcard.saveToRequest(this.req);
                this.renderPage("pages/checkout.adres.ejs");
            }
        }
        else
        {
            await this.shopcard.saveToRequest(this.req);
            this.renderPage("pages/checkout.ship.ejs");
        } 
    }

    @Auth.Anonymous()
    async adresViewRoute() {
        this.shopcard = await ShopCard.createFromRequest(this.req);
        await this.setDispatcher();
        if (this.req.user && !this.shopcard.address.name) {
            this.shopcard.address.name = this.req.user.name;
            this.shopcard.address.email = this.req.user.email;
            this.shopcard.address.phone = this.req.user.mphone;
        }

        this.renderPage("pages/checkout.adres.ejs");
    }

    getProductTypeManager(i: number): ProductTypeManager {
        let item = this.shopcard.items[i];
        let params = {

        }
        params = { ...params, ...item.productTypeData }
        let result = ProductTypeFactory.create(item.product.productType, params)
        return result;
    }

    allowNonOnline(bi) {
        let allow = true;
        if (this.shopcard.getOrderType() == 'kurban') {
            allow = false;
        }
        if (allow) {
            if (this.shopcard.shipment[bi].dispatcher && !this.shopcard.shipment[bi].dispatcher.type.startsWith("butcher")) {
                allow = false;
            }

            if (allow && this.shopcard.shipment[bi].dispatcher) {
                allow = this.shopcard.shipment[bi].dispatcher.toAreaLevel > 0;
            }

        }
        
        return allow;
    }

    // calculateCostForCustomer(shipment: Shipment, o: Order) {
    //     if (o.dispatcherFee > 0.00) {
    //         let dispatcherFee = Helper.asCurrency(o.dispatcherFee / 1.18);
    //         let calc = new ComissionHelper(o.getButcherRate(), o.getButcherFee());
    //         let commission = calc.calculateButcherComission(o.subTotal);    
    //         let contribute = Helper.asCurrency(commission.kalitteFee * 0.4);
    //         let calculated = Helper.asCurrency(Math.max(0.00, dispatcherFee - contribute));
    //         let calculatedVat = Helper.asCurrency(calculated * 0.18)
    //         let totalShip = Helper.asCurrency(Math.round(calculated + calculatedVat));
    //         return totalShip > 0.00 ? Math.max(5.00, totalShip): 0.00;
    //     } else return 0.00;
    // }

    // async setDispatcher_old() {
    //     let api = new Dispatcher(this.constructorParams);
    //     let orders = await this.orderapi.getFromShopcard(this.shopcard);
    //     var self = this;
    //     for (let o in this.shopcard.shipment) {
    //         if (true) {
    //             let order = orders.find(oo => oo.butcherid == parseInt(o))
    //             let dispatch = await api.bestDispatcher(parseInt(o), {
    //                 level1Id: this.shopcard.address.level1Id,
    //                 level2Id: this.shopcard.address.level2Id,
    //                 level3Id: this.shopcard.address.level3Id
    //             }, order);
    //             if (dispatch && !dispatch.takeOnly) {
    //                 this.shopcard.shipment[o].dispatcher = {
    //                     id: dispatch.id,
    //                     feeOffer: dispatch.feeOffer,
    //                     name: dispatch.name,
    //                     fee: dispatch.fee,
    //                     totalForFree: dispatch.totalForFree,
    //                     type: dispatch.type,
    //                     min: dispatch.min,
    //                     takeOnly: dispatch.takeOnly,
    //                     location: dispatch.butcher ? <any>dispatch.butcher.location : null,
    //                     // calculateCostForCustomer: function(shipment) {
    //                     //     return self.calculateCostForCustomer(shipment, order)
    //                     // }
    //                 }
    //                 if (dispatch.min > this.shopcard.butchers[o].subTotal) {
    //                     this.shopcard.shipment[o].howTo = 'ship';
    //                 }
    //                 else if (dispatch.takeOnly) {
    //                     this.shopcard.shipment[o].howTo = 'take';
    //                 }
    //                 else if (this.shopcard.shipment[o].howTo == 'unset') {
    //                     this.shopcard.shipment[o].howTo = 'ship'
    //                 }
    //             } else {
    //                 this.shopcard.shipment[o].dispatcher = null;
    //                 this.shopcard.shipment[o].howTo = 'take'
    //             }
    //         }
    //     }
    // }

    async setDispatcher(): Promise<{ [key: number]: OfferResponse; }> {
        let api = new Dispatcher(this.constructorParams);
        let orders = await this.orderapi.getFromShopcard(this.shopcard);
        let offers = {};
        for (let o in this.shopcard.shipment) {
            let order = orders.find(oo => oo.butcherid == parseInt(o));
            if (this.shopcard.shipment[o].howTo == 'unset') {
                this.shopcard.shipment[o].howTo = 'ship'
            }

            let area = await Area.findByPk(this.shopcard.address.level3Id);
            if (this.shopcard.shipment[o].howTo == 'ship') {

                let q: DispatcherQuery = {
                    adr: {
                        level1Id: this.shopcard.address.level1Id,
                        level2Id: this.shopcard.address.level2Id,
                        level3Id: this.shopcard.address.level3Id
                    },
                    useLevel1: order.orderType == 'kurban',
                    butcher: parseInt(o),
                    orderType: order.orderType
                }
        
                let serving = await api.getDispatchers(q);
                let provider = serving.length ? serving[0].provider: null;

                if (provider && !provider.options.dispatcher.takeOnly) {
                    let dispatcher = this.shopcard.shipment[o].dispatcher = {
                        id: provider.options.dispatcher.id,
                        feeOffer: provider.options.dispatcher.feeOffer,
                        toAreaLevel: provider.options.dispatcher.toarealevel,
                        longDesc: provider.options.dispatcher.longdesc,
                        name: provider.options.dispatcher.name,
                        fee: provider.options.dispatcher.fee,
                        totalForFree: provider.options.dispatcher.totalForFree,
                        type: provider.options.dispatcher.type,
                        min: provider.options.dispatcher.min,
                        minCalculated: provider.options.dispatcher.minCalculated,
                        takeOnly: provider.options.dispatcher.takeOnly,
                        km: 0,
                        //location: provider.options.dispatcher.butcher ? <any>provider.options.dispatcher.butcher.location : null,
                    }
                    let req: OfferRequest;
                    if (order && order.shipLocation) {
                        req = provider.offerFromOrder(order);
                        let offer = await provider.requestOffer(req)
                        if (offer) {
                            provider.lastOffer = offer;
                            dispatcher.feeOffer = provider.lastOffer.totalFee;
                            dispatcher.fee = provider.lastOffer.customerFee;
                            dispatcher.km = provider.lastOffer.distance;
                            offers[o] = offer;
                        } else {
                            // dispatcher = this.shopcard.shipment[o].dispatcher = null;
                            // this.shopcard.shipment[o].howTo = 'take';
                        }
                    } else {
                        // req = provider.offerRequestFromTo({
                        //     start: provider.options.dispatcher.butcher.location,
                        //     finish: area.location
                        // });
                        // req.orderTotal = this.shopcard.butchers[o].subTotal;
                    }
                    


                    this.destinationMatrix[o] = {
                        start: provider.options.dispatcher.butcher.location,
                        finish: area.location,
                        provider: provider,
                        slices: await provider.priceSlice({
                            start: provider.options.dispatcher.butcher.location,
                            sId: provider.options.dispatcher.butcher.id.toString(),
                            finish: area.location,
                            fId: area.id.toString()
                          })
                    } 

                    
                    if (provider.options.dispatcher.minCalculated > this.shopcard.butchers[o].subTotal) {
                        this.shopcard.shipment[o].howTo = 'ship';
                    }
                    else if (provider.options.dispatcher.takeOnly) {
                        this.shopcard.shipment[o].howTo = 'take';
                    }
                } else {
                    this.shopcard.shipment[o].dispatcher = null;
                    this.shopcard.shipment[o].howTo = 'take'
                }
            } else {
                this.shopcard.shipment[o].dispatcher = null;
            }

        }

        return offers;
    }

    @Auth.Anonymous()
    async saveadresTakeRoute() {
        this.shopcard = await ShopCard.createFromRequest(this.req);
        if (this.req.user) {
            this.shopcard.address.name = this.req.body.name;
            this.shopcard.address.email = this.req.body.email;
            this.shopcard.address.phone = this.req.body.phone;
        }
        await this.setDispatcher();
        await this.shopcard.saveToRequest(this.req);
        await this.getOrderSummary();
        this.renderPage("pages/checkout.payment.ejs");
    }


    @Auth.Anonymous()
    async saveadresRoute() {
        this.shopcard = await ShopCard.createFromRequest(this.req);
        this.shopcard.address.name = this.req.body.name;
        this.shopcard.address.email = this.req.body.email;
        this.shopcard.address.phone = this.req.body.phone;
        this.shopcard.address.adres = this.req.body.address;
        this.shopcard.address.kat = this.req.body.kat;
        this.shopcard.address.daire = this.req.body.daire;
        this.shopcard.address.bina = this.req.body.bina;
        this.shopcard.address.addresstarif = this.req.body.addresstarif;
        if (this.req.body.lat && this.req.body.long && (parseFloat(this.req.body.lat) > 0) && (parseFloat(this.req.body.long) > 0)) {
            this.shopcard.address.location = {
                type: 'Point',
                coordinates: [parseFloat(this.req.body.lat), parseFloat(this.req.body.long)]
            }
            this.shopcard.address.accuracy = parseFloat(this.req.body.accuracy)
        } else this.shopcard.address.location = null;
        if (this.req.body.geolat && this.req.body.geolong && (parseFloat(this.req.body.geolat) > 0) && (parseFloat(this.req.body.geolong) > 0)) {
            this.shopcard.address.geolocation = {
                type: 'Point',
                coordinates: [parseFloat(this.req.body.geolat), parseFloat(this.req.body.geolong)]
            }
            this.shopcard.address.geolocationType = this.req.body.geolocationtype;
        } else this.shopcard.address.geolocation = null;
        await this.setDispatcher();
        await this.shopcard.saveToRequest(this.req);
        await this.getOrderSummary()
        this.renderPage("pages/checkout.payment.ejs");
    }

    @Auth.Anonymous()
    async shipViewRoute() {
        this.shopcard = await ShopCard.createFromRequest(this.req);
        await this.setDispatcher();
        await this.shopcard.saveToRequest(this.req);
        if (this.shopcard.getOrderType() == 'kurban') {
            this.viewRoute()
        } else this.renderPage("pages/checkout.ship.ejs");
    }

    fillDefaultAddress() {
        if (this.req.user) {
            this.shopcard.address.name = this.shopcard.address.name || this.req.user.name;
            this.shopcard.address.email = this.shopcard.address.email || this.req.user.email;
            this.shopcard.address.phone = this.shopcard.address.phone || this.req.user.mphone;
            this.shopcard.address.adres = this.shopcard.address.adres || this.req.user.lastAddress;
            this.shopcard.address.bina = this.shopcard.address.bina || this.req.user.lastBina;
            this.shopcard.address.addresstarif = this.shopcard.address.addresstarif || this.req.user.lastTarif;
            this.shopcard.address.kat = this.shopcard.address.kat || this.req.user.lastKat;
            this.shopcard.address.daire = this.shopcard.address.daire || this.req.user.lastDaire;
            this.shopcard.address.geolocationType = this.shopcard.address.geolocationType || this.req.user.lastLocationType;
            this.shopcard.address.geolocation = this.shopcard.address.geolocation || this.req.user.lastLocation;
        }
    }

    @Auth.Anonymous()
    async saveshipRoute() {
        this.shopcard = await ShopCard.createFromRequest(this.req);
        await this.loadButchers();
        let needAddress = false;
        let hasDispatcher = true;

        for (let k in this.shopcard.butchers) {
            let butcher = this.shopcard.butchers[k];
            this.shopcard.shipment[k].type = this.req.body[`shipping-method${k}`];
            this.shopcard.shipment[k].howTo = this.req.body[`howto${k}`];
            needAddress = !needAddress ? (this.shopcard.shipment[k].howTo == 'ship') : true;
            // this.shopcard.shipment[k].desc = ShipmentTypeDesc[this.shopcard.shipment[k].type];
            // this.shopcard.shipment[k].howToDesc = ShipmentHowToDesc[this.shopcard.shipment[k].howTo];
            this.shopcard.shipment[k].informMe = this.req.body[`informme${k}`] == 'on';
            let checkShipdate = true;
            if (this.shopcard.shipment[k].type == 'plan') {
                this.shopcard.shipment[k].days = [this.req.body[`planday${k}`]];
                this.shopcard.shipment[k].hours = [this.req.body[`plantime${k}`]];
                this.shopcard.shipment[k].daysText = [Shipment.availableDays()[this.req.body[`planday${k}`]]];
                this.shopcard.shipment[k].hoursText = [this.shipmentHours[parseInt(this.req.body[`plantime${k}`])]];
            } else if (this.shopcard.shipment[k].type == 'sameday') {
                this.shopcard.shipment[k].days = [Helper.Now().toDateString()];
                this.shopcard.shipment[k].hours = [this.req.body[`samedaytime${k}`]];
                this.shopcard.shipment[k].daysText = ['Bugün - ' + Helper.formatDate(Helper.Now())];
                this.shopcard.shipment[k].hoursText = [this.shipmentHours[parseInt(this.req.body[`samedaytime${k}`])]];
            } else checkShipdate = false;
            if (checkShipdate) {
                let sd = Helper.newDate(this.shopcard.shipment[k].days[0])
                let shipday = `shipday${sd.getDay()}`;
                let canShip = this.Butchers.find(b=>b.id == butcher.id)[shipday];
                if (!canShip) {
                    this.renderPage("pages/checkout.ship.ejs", { _usrmsg: {type:'danger', text: `${butcher.name} maalesef seçtiğiniz teslim günü çalışmamaktadır.`} });
                    return;                
                }
            }
        }
        this.fillDefaultAddress();        
        let offer = await this.setDispatcher();       
        // for (let o in this.shopcard.shipment) {
        //     if (offer[o]) {
                
        //     } else if (this.shopcard.shipment[o].howTo == 'ship') {
        //         //hasDispatcher = false;
        //     }
            
        // }
        // if (!hasDispatcher) {
        //     this.renderPage("pages/checkout.ship.ejs", { _usrmsg: {type:'danger', text: 'Lütfen en az sipariş tutarını gözeterek devam edin.'} });
        //     return;
        // }
        this.shopcard.calculateShippingCosts();
        await this.shopcard.saveToRequest(this.req);

        //this.renderPage("pages/checkout.adres.ejs")
        needAddress ? this.renderPage("pages/checkout.adres.ejs") : this.renderPage("pages/checkout.adres-take.ejs");
    }

    async loadButchers() {
        this.Butchers = this.Butchers || await ButcherModel.findAll({
            include: [{
                model: Area,
                all: true,
                as: "areaLevel1Id"

            }], where: { id: Object.keys(this.shopcard.butchers) }
        });
    }

    @Auth.Anonymous()
    async paymentViewRoute() {
        this.shopcard = await ShopCard.createFromRequest(this.req);
        await this.setDispatcher();
        await this.getOrderSummary();
        this.renderPage("pages/checkout.payment.ejs");
    }

    constructor(reqp?: IRequestParams) {
        super(reqp);
        this.puanCalculator = new PuanCalculator();
        this.orderapi = new OrderApi(this.constructorParams)
    }

    @Auth.Anonymous()
    async savepaymentRoute() {
        this.shopcard = await ShopCard.createFromRequest(this.req);
        for (let k in this.shopcard.butchers) {
            let butcher = this.shopcard.butchers[k];
            this.shopcard.payment[k].type = this.req.body[`paymentmethod${k}`];
            this.shopcard.payment[k].desc = PaymentTypeDesc[this.shopcard.payment[k].type];
            this.shopcard.shipment[k].nointeraction = this.req.body[`nointeraction${k}`] == "on";
        }
        this.shopcard.arrangeButchers();
        await this.setDispatcher();
        this.shopcard.calculateShippingCosts();
        await this.shopcard.saveToRequest(this.req);
        await this.getOrderSummary();
        this.renderPage("pages/checkout.review.ejs");
    }

    @Auth.Anonymous()
    async reviewViewRoute(userMessage?: any) {
        this.shopcard = await ShopCard.createFromRequest(this.req);
        this.shopcard.arrangeButchers();
        await this.setDispatcher();
        this.shopcard.calculateShippingCosts();
        await this.shopcard.saveToRequest(this.req);
        await this.getOrderSummary();
        this.renderPage("pages/checkout.review.ejs", userMessage);
    }

    @Auth.Anonymous()
    async savereviewRoute() {
        this.shopcard = await ShopCard.createFromRequest(this.req);
        await this.setDispatcher();

        this.shopcard.calculateShippingCosts();
        try {
            let api = new OrderApi(this.constructorParams);
            let orders = await api.create(this.shopcard);
            if (this.req.body.usepuan == "true") {
                for (var i = 0; i < orders.length;i++) {
                    orders[i].requestedPuan = await this.orderapi.getUsablePuans(orders[i]);
                    await orders[i].save();
                }                
            }
            await ShopCard.empty(this.req);
            // if (orders.length == 1 && orders[0].paymentType == 'onlinepayment') {
            //     this.res.redirect(`/user/orders/${orders[0].ordernum}?new=1`)
            // }
            // else 

            this.res.render("pages/checkout.complete.ejs", this.viewData({
                orders: orders,

            }));
        } catch (err) {
            email.send('tansut@gmail.com', 'hata/CreateOrder: kasaptanAl.com', "error.ejs", {
                text: err + '/' + err.message,
                stack: err.stack
            })
            await this.reviewViewRoute({ _usrmsg: { text: err.message || err.errorMessage } })
        }
    }

    @Auth.Anonymous()
    async redirectToShopcard() {
        this.res.redirect('/alisveris-sepetim');
    }

    static SetRoutes(router: express.Router) {
        router.get("/alisveris-sepetim", Route.BindRequest(Route.prototype.viewRoute));
        router.get("/alisveris-sepetim/adres", Route.BindRequest(Route.prototype.adresViewRoute));
        
        router.post("/alisveris-sepetim/savecard", Route.BindRequest(Route.prototype.savecardRoute));
        router.post("/alisveris-sepetim/saveadres", Route.BindRequest(Route.prototype.saveadresRoute));
        router.post("/alisveris-sepetim/saveadrestake", Route.BindRequest(Route.prototype.saveadresTakeRoute));

        router.get("/alisveris-sepetim/savecard", Route.BindRequest(Route.prototype.savecardRoute));
        router.get("/alisveris-sepetim/saveadres", Route.BindRequest(Route.prototype.redirectToShopcard));
        router.get("/alisveris-sepetim/saveadrestake", Route.BindRequest(Route.prototype.redirectToShopcard));        
        router.get("/alisveris-sepetim/saveship", Route.BindRequest(Route.prototype.redirectToShopcard));
        router.get("/alisveris-sepetim/savepayment", Route.BindRequest(Route.prototype.redirectToShopcard));
        router.get("/alisveris-sepetim/savereview", Route.BindRequest(Route.prototype.savereviewRoute));


        router.get("/alisveris-sepetim/ship", Route.BindRequest(Route.prototype.shipViewRoute));
        router.post("/alisveris-sepetim/saveship", Route.BindRequest(Route.prototype.saveshipRoute));
        router.get("/alisveris-sepetim/payment", Route.BindRequest(Route.prototype.paymentViewRoute));
        router.post("/alisveris-sepetim/savepayment", Route.BindRequest(Route.prototype.savepaymentRoute));
        router.get("/alisveris-sepetim/review", Route.BindRequest(Route.prototype.reviewViewRoute));
        router.post("/alisveris-sepetim/savereview", Route.BindRequest(Route.prototype.savereviewRoute));


    }
}