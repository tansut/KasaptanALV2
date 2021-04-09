import { ApiRouter, ViewRouter } from '../lib/router';
import * as express from "express";
import ButcherModel from '../db/models/butcher';
import moment = require('moment');
import { Auth } from '../lib/common';
import AreaModel from '../db/models/area';
import Helper from '../lib/helper';
import Area from '../db/models/area';
import Category from '../db/models/category';
import Content from '../db/models/content';
import config from '../config';
import * as path from 'path';
import * as fs from 'fs';
import { readFileSync } from 'fs';
import UserRoute from './api/user';
import { Order } from '../db/models/order';
let ellipsis = require('text-ellipsis');
var MarkdownIt = require('markdown-it')
import iyzico from '../lib/payment/iyzico';
import { CreditcardPaymentFactory, Creditcard, PaymentResult, PaymentRequest, PaymentTotal, CreditcardPaymentProvider } from '../lib/payment/creditcard';
import OrderApi from "./api/order"
import SiteLogRoute from './api/sitelog';
import SiteLog from '../db/models/sitelog';
import Payment from '../db/models/payment';
import AccountModel from '../db/models/accountmodel';
import { Account } from '../models/account';
import { PaymentRouter } from '../lib/paymentrouter';
import { stringify } from 'querystring';
import { ComissionResult, ComissionHelper } from '../lib/commissionHelper';
import { PuanResult } from '../models/puan';
import Review from '../db/models/review';
import { DeliveryStatus, DeliveryStatusDesc, OrderItemStatus } from '../models/order';
import { LocationType, LocationTypeDesc } from '../models/geo';
import { LogisticFactory } from '../lib/logistic/core';
import { off } from 'process';
import Dispatcher from '../db/models/dispatcher';
import Butcher from '../db/models/butcher';
import { Shipment, ShipmentHours } from '../models/shipment';
var MarkdownIt = require('markdown-it')

export default class Route extends ViewRouter {
    order: Order;
    api: OrderApi;
    OrderStatus =  OrderItemStatus;

    DeliveryStatusDesc = DeliveryStatusDesc;
    _paymentProvider: CreditcardPaymentProvider
    markdown = new MarkdownIt();
    butcherFee: ComissionResult;
    LocationTypeDesc = LocationTypeDesc;

    balance: AccountModel;
    shouldBePaid = 0.00;
    paid = 0.00;
    productTotal = 0.00;
    teslimatKasaptan = 0.00;
    teslimatButcher = 0.00;
    puanBalanceButcher: AccountModel;
    puanBalanceKalitte: AccountModel;
    earnedPuanButcher = 0.00;
    earnedPuanKalitte = 0.00;
    earnedPuanTotal = 0.00;
    mayEarnPuanTotal = 0.00;
    usedPuanTotal = 0.00;
    butcherDebt = 0.00


    possiblePuanList: PuanResult[] = [];

    puanAccountsKalitte: AccountModel[] = []
    puanAccountsButcher: AccountModel[] = []

    async getOrderSummary() {
        let acountingSummary = await this.api.getWorkingAccounts(this.order);
        if (acountingSummary.length == 1) {
            let initial = this.api.generateInitialAccounting(this.order);
            await this.api.saveAccountingOperations([initial]);
            await this.getOrder();
        }
        this.productTotal = this.api.calculateProduct(this.order);

        this.teslimatButcher = this.api.calculateTeslimatOfButcher(this.order);
        this.teslimatKasaptan = this.api.calculateTeslimatOfKasaptanAl(this.order);

        this.balance = this.order.workedAccounts.find(p => p.code == 'total')
        this.shouldBePaid = Helper.asCurrency(this.balance.alacak - this.balance.borc);
        this.usedPuanTotal = this.api.calculateUsedPuan(this.order);

        this.paid = this.api.calculatePaid(this.order) - this.usedPuanTotal;
        this.puanBalanceKalitte = this.order.kalittePuanAccounts.find(p => p.code == 'total');
        this.puanBalanceButcher = this.order.butcherPuanAccounts.find(p => p.code == 'total');
        this.earnedPuanKalitte = this.puanBalanceKalitte ? Helper.asCurrency(this.puanBalanceKalitte.alacak - this.puanBalanceKalitte.borc) : 0.00
        this.earnedPuanButcher = this.puanBalanceButcher ? Helper.asCurrency(this.puanBalanceButcher.alacak - this.puanBalanceButcher.borc) : 0.00
        this.earnedPuanTotal = Helper.asCurrency(this.earnedPuanKalitte + this.earnedPuanButcher)
        this.mayEarnPuanTotal = 0.00;

        if (this.shouldBePaid > 0) {
            this.possiblePuanList = this.api.getPossiblePuanGain(this.order, this.productTotal);
            this.possiblePuanList.forEach(pg => this.mayEarnPuanTotal += pg.earned)
            this.mayEarnPuanTotal = Helper.asCurrency(this.mayEarnPuanTotal)
        }

        let calc = new ComissionHelper(this.order.getButcherRate(), this.order.getButcherFee(), this.order.butcher.vatRate);
        this.butcherFee = calc.calculateButcherComission(this.productTotal + this.teslimatButcher);

        let kalitteByButcherPuanAccounts = this.order.kalitteByButcherPuanAccounts.find(p => p.code == 'total')

        let butcherToCustomer = Helper.asCurrency((kalitteByButcherPuanAccounts.alacak - kalitteByButcherPuanAccounts.borc) + (this.puanBalanceButcher.alacak - this.puanBalanceButcher.borc));

        if (butcherToCustomer <= 0) {
            this.possiblePuanList = this.api.getPossiblePuanGain(this.order, this.productTotal);
            this.possiblePuanList.forEach(pg => butcherToCustomer += pg.earned)
        }

        this.butcherFee.butcherToCustomer = Helper.asCurrency(butcherToCustomer);
        await this.api.fillButcherDebtAccounts(this.order)

        let butcherDebptAccounts = await AccountModel.summary([Account.generateCode("kasaplardan-alacaklar", [this.order.butcherid])]);
        this.butcherDebt = butcherDebptAccounts.borc - butcherDebptAccounts.alacak;

    }

    get paymentProvider() {
        if (!this._paymentProvider) {
            let payment = CreditcardPaymentFactory.getInstance();
            let log = new SiteLogRoute(this.constructorParams);
            payment.logger = log;
            payment.userid = this.req.user ? this.req.user.id : null;
            payment.ip = this.req.header("x-forwarded-for") || this.req.connection.remoteAddress;
            this._paymentProvider = payment
        }
        return this._paymentProvider;

    }




    // async orderSaveRoute() {
    //     let userMessage = "";

    //     await this.getOrder();
    //     await this.getOrderSummary()

    //     if (!this.order)
    //         return this.next();

    //     if (this.req.body.saveOrderStatus == "true" && this.order.status != this.req.body.orderStatus) {
    //         this.order.statusDesc ? null : (this.order.statusDesc = '')
    //         this.order.statusDesc += `\n- ${Helper.formatDate(Helper.Now(), true)} tarihinde ${this.order.status} -> ${this.req.body.orderStatus}`
    //         await this.api.completeOrderStatus(this.order, this.req.body.orderStatus);
    //         if (this.req.body.orderStatus == OrderItemStatus.success)
    //             userMessage = "KASABA MAKBUZ İLETMEYİ UNUTMAYIN"
    //     }

    //     if (this.req.body.makeManuelPayment == "true") {
    //         if (this.shouldBePaid > 0) {
    //             await this.api.completeManuelPayment(this.order, this.shouldBePaid)
    //         } else userMessage = "Ödemesi yok siparişin";
    //     }

    //     if (this.req.body.makeManuelPaymentDebt == "true") {
    //         if (this.paid > 0) {
    //             let toKalitte = Helper.asCurrency(this.butcherFee.kalitteFee + this.butcherFee.kalitteVat)
    //             await this.api.completeManualPaymentDept(this.order)
    //         } else userMessage = "Ödemesi yok siparişin";
    //     }




    //     // if (this.req.body.loadPuans == "true") {
    //     //     if (this.shouldBePaid > 0) {
    //     //         userMessage = "Ödemesi henüz yapılmamış siparişin";

    //     //     } else await this.api.completeLoadPuan(this.order, this.paid)

    //     // }

    //     if (this.req.body["kurye-maliyet"] == "true" && this.order.butcher.logisticProvider) {
    //         let provider = LogisticFactory.getInstance(this.order.butcher.logisticProvider, {
    //             dispatcher: await Dispatcher.findByPk(this.order.dispatcherid, {
    //                 include: [{
    //                     model: Butcher,
    //                     as: 'butcher',
    //                 }]
    //             })
    //         });
    //         provider.safeRequests = false;
    //         let request = provider.offerFromOrder(this.order);
    //         try {
    //             let offer = await provider.requestOffer(request);
    //             userMessage = `Taşıma: ${offer.totalFee}, İndirim: ${offer.discount}`;
    //         } catch (err) {
    //             userMessage = err.message
    //         }
    //     }

    //     if (this.req.body["kurye-cagir"] == "true" && this.order.butcher.logisticProvider) {
    //         let provider = LogisticFactory.getInstance(this.order.butcher.logisticProvider, {
    //             dispatcher: await Dispatcher.findByPk(this.order.dispatcherid, {
    //                 include: [{
    //                     model: Butcher,
    //                     as: 'butcher',
    //                 }]
    //             })
    //         });
    //         provider.safeRequests = false;
    //         let request = provider.orderFromOrder(this.order);
    //         try {
    //             let offer = await provider.createOrder(request);
    //             userMessage = `Kurye çağrıldı:`;
    //         } catch (err) {
    //             userMessage = err.message
    //         }

    //     }


    //     if (this.req.body.approveOrderSubMerchant == "true") {
    //         await this.paymentProvider.approveItem({
    //             paymentTransactionId: this.order.paymentTransactionId
    //         })
    //         this.order.subMerchantStatus = 'approved';
    //         userMessage = `${this.order.ordernum} subMerchant ONAYLANDI`
    //         await this.order.save();
    //     }
    //     if (this.req.body.disApproveOrderSubMerchant == "true") {
    //         await this.paymentProvider.disApproveItem({
    //             paymentTransactionId: this.order.paymentTransactionId
    //         })
    //         this.order.subMerchantStatus = 'disapproved';
    //         userMessage = `${this.order.ordernum} subMerchant ONAY KALDIRILDI`

    //         await this.order.save();
    //     }

    //     if (this.req.body.addcomment) {
    //         let comment = this.req.body.comment;
    //         let puan = Helper.parseFloat(this.req.body.commentpuan);
    //         let review = await Review.findOne({
    //             where: {
    //                 userId: this.order.userId,
    //                 type: 'order',
    //                 ref1: this.order.id
    //             }
    //         })
    //         if (review == null) {
    //             review = new Review();
    //             review.userId = this.order.userId;
    //             review.type = 'order';
    //             review.ref1 = this.order.id;
    //             review.ref2 = this.order.butcherid,
    //                 review.itemDate = this.order.creationDate;
    //             review.ref2Text = this.order.butcher.name;
    //             review.ref2slug = this.order.butcher.slug;
    //             review.content = comment;
    //             review.level1Id = this.order.areaLevel1Id;
    //             review.level2Id = this.order.areaLevel2Id;
    //             review.level3Id = this.order.areaLevel3Id;
    //             review.level1Text = this.order.areaLevel1Text;
    //             review.level2Text = this.order.areaLevel2Text;
    //             review.level3Text = this.order.areaLevel3Text;
    //             review.areaSlug = (await AreaModel.findByPk(review.level3Id)).slug;
    //             review.userRating1 = puan;
    //             let words = this.order.name.match(/\S+/g).map(w => `${w}`)
    //             if (words.length >= 2)
    //                 review.displayUser = words[0] + ' ' + words[1][0] + '.';
    //             else review.displayUser = words[0] + '.'

    //         } else {
    //             review.content = comment;
    //             review.userRating1 = puan;
    //         }

    //         await review.save();
    //         userMessage = "Yorum eklendi"
    //     }


    //     //


    //     await this.getOrder();
    //     await this.getOrderSummary()

    //     this.sendView("pages/operator.manageorder.ejs", { ...{ _usrmsg: { text: userMessage } }, ...this.api.getView(this.order), ...{ enableImgContextMenu: true } });


    // }

    get hideOrderDetails() {
        if (this.req.user && this.req.user.hasRole('admin')) return false;
        if (this.order.dispatcherType == 'butcher' || this.order.dispatcherType == 'butcher/auto') return false;
        return true;
    }

    async getOrder() {
        let ordernum = this.req.params.ordernum;
        this.api = new OrderApi(this.constructorParams);
        this.order = await this.api.getOrder(ordernum, true);
    }

    async ordersListRoute() {
        this.api = new OrderApi(this.constructorParams);
        let orders = await this.api.getOrders();
        this.sendView('pages/operator.orders.ejs', { orders: orders })
    }


    async orderItemUpdateRoute() {
        await this.getOrder();
        if (!this.order)
            return this.next();


        let itemid = this.req.body.itemid;

        let orderitem = this.order.items.find(p => p.id == parseInt(itemid))
        let userMessage = "";

        try {
            if (this.req.body.approveSubMerchant) {
                await this.paymentProvider.approveItem({
                    paymentTransactionId: orderitem.paymentTransactionId
                })
                orderitem.subMerchantStatus = 'approved';
                userMessage = `${orderitem.productName} subMerchant ONAYLANDI`
                await orderitem.save();
            }
            if (this.req.body.disApproveSubMerchant) {
                await this.paymentProvider.disApproveItem({
                    paymentTransactionId: orderitem.paymentTransactionId
                })
                orderitem.subMerchantStatus = 'disapproved';
                userMessage = `${orderitem.productName} subMerchant ONAY KALDIRILDI`

                await orderitem.save();
            }

            if (this.req.body.saveOrderItemStatus == "true") {
                if (orderitem.status != this.req.body.orderItemStatus) {
                    orderitem.statusDesc ? null : (orderitem.statusDesc = '')
                    orderitem.statusDesc += `\n- ${Helper.formatDate(Helper.Now(), true)} tarihinde ${orderitem.status} -> ${this.req.body.orderItemStatus}\n`
                    await this.api.completeOrderItemStatus(orderitem, this.req.body.orderItemStatus)
                    userMessage = `${orderitem.productName} yeni durum: ${orderitem.status}`

                }
            }
        } catch (err) {
            userMessage = err.message || err.errorMessage
        }

        await this.getOrder();
        await this.getOrderSummary();

        this.sendView("pages/operator.manageorder.ejs", {
            ...{ _usrmsg: { text: userMessage } },
            ...this.api.getView(this.order), ...{ enableImgContextMenu: true }
        });

    }

     availableTimes(): Object {       
        let shipmentHours = []
        let oh = Math.round(this.order.shipmenthour - (this.order.shipmenthour%100));
        let od = this.order.shipmentdate.setHours(oh);
        if (this.order.dispatcherType == 'banabikurye' || this.order.dispatcherType == 'banabikurye/car') {
            for (let i = 9; i < 22; i++) {
                let selected = true;
                if (Helper.isToday(this.order.shipmentdate) && Helper.Now().getHours() > i)
                    selected = false;
                    shipmentHours.push({
                    hour: i*100,
                    text: i.toString() + ':00',
                    selected: selected && (i*100 == oh)
                })
                shipmentHours.push({
                    hour: i*100+30,
                    text: i.toString() + ':30',
                    selected: selected && (i*100+30 == oh)
                })            
            }
        } else {
            let hours = ShipmentHours;
            Object.keys(hours).forEach(k=> {
                shipmentHours.push({
                    hour: k,
                    text: hours[k],
                    selected: this.order.shipmenthour == parseInt(k)
                })                    
            })
        }

         return shipmentHours;
    }

     availableDays(): Object {                
        let res = {};
        let nextDay = Helper.Now()
        for(let i = 0; i < 7; i++) {            
            let text = i == 0 ? 'Bugün': Helper.formatDate(nextDay)
            res[nextDay.toDateString()] = text;
            nextDay = Helper.NextDay(nextDay);
        }
        return res;
    }  


    
    @Auth.Anonymous()
    async printViewRoute() {
        await this.getOrder();
        if (!this.order)
            return this.next();

        await this.getOrderSummary();

        let pageInfo = {};

        let pageTitle = '', pageDescription = '';


        pageTitle = `${this.order.butcherName} ${Helper.formatDate(this.order.creationDate)} tarihli sipariş`;
        pageDescription = `KasaptanAl.com Siparişi`
        let pageThumbnail = this.req.helper.imgUrl('butcher-google-photos', this.order.butcher.slug)


        pageInfo = {
            pageTitle: pageTitle,
            pageDescription: pageDescription,
            pageThumbnail: pageThumbnail
        }



        this.sendView("pages/printorder.ejs", { ...pageInfo, ...this.api.getView(this.order), ...{ enableImgContextMenu: true } });
    }

    @Auth.Anonymous()
    async orderViewRoute() {
        await this.getOrder();
        if (!this.order)
            return this.next();

        await this.getOrderSummary();

        let pageInfo = {};

        let pageTitle = '', pageDescription = '';


        pageTitle = `${this.order.butcherName} ${Helper.formatDate(this.order.creationDate)} tarihli sipariş`;
        pageDescription = `KasaptanAl.com online siparişi`
        let pageThumbnail = this.req.helper.imgUrl('butcher-google-photos', this.order.butcher.slug)


        pageInfo = {
            pageTitle: pageTitle,
            pageDescription: pageDescription,
            pageThumbnail: pageThumbnail
        }



        this.sendView("pages/manageorder.ejs", { ...pageInfo, ...this.api.getView(this.order), ...{ enableImgContextMenu: true } });
    }





    static SetRoutes(router: express.Router) {
        router.get('/manageorder/:ordernum', Route.BindRequest(Route.prototype.orderViewRoute));
        router.get('/printorder/:ordernum', Route.BindRequest(Route.prototype.printViewRoute));

    }
}