import { ApiRouter, ViewRouter } from '../lib/router';
import * as express from "express";
import * as maps from "@google/maps"
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
import { CreditcardPaymentFactory, Creditcard, PaymentResult, PaymentRequest, PaymentTotal } from '../lib/payment/creditcard';
import OrderApi from "./api/order"
import SiteLogRoute from './api/sitelog';
import SiteLog from '../db/models/sitelog';
import Payment from '../db/models/payment';
import AccountModel from '../db/models/accountmodel';
import { Account } from '../models/account';
import { PaymentRouter } from '../lib/paymentrouter';
import { PuanCalculator } from '../lib/commissionHelper';
import { PuanResult } from '../models/puan';
import email from '../lib/email';

export default class Route extends PaymentRouter {
    order: Order;
    api: OrderApi;
    balance: AccountModel;
    shouldBePaid = 0.00;
    puanBalanceButcher: AccountModel;
    puanBalanceKalitte: AccountModel;
    earnedPuanButcher = 0.00;
    earnedPuanKalitte = 0.00;
    earnedPuanTotal = 0.00;
    mayEarnPuanTotal = 0.00;

    possiblePuanList: PuanResult[] = [];

    renderPage(userMessage?: string) {
        let pageInfo = {};
        if (this.shouldBePaid > 0.00) {
            let pageTitle = '', pageDescription = '';

            if (this.mayEarnPuanTotal > 0.00) {
                pageTitle = `Online ödeyin, ${this.mayEarnPuanTotal} TL değerinde puan kazanın: ${Helper.formatDate(this.order.creationDate)} tarihli ${this.order.butcherName} siparişiniz`;
                pageDescription = `Nefis ürünlerinizi güvenle online ödeyin, puan kazanın, zaman kazanın, sağlığınızı koruyun.`

            }
            else {
                pageTitle = `Online Ödeyin: ${Helper.formatDate(this.order.creationDate)} tarihli ${this.order.butcherName} siparişiniz`;
                pageDescription = `Nefis ürünlerinizi güvenle online ödeyin, hem zamandan kazanın, hem sağlığınızı koruyun.`
            }

            pageInfo = {
                pageTitle: pageTitle,
                pageDescription: pageDescription
            }
        } else {

        }

        this.sendView("pages/payorder.ejs", { ...pageInfo, ...{ _usrmsg: { text: userMessage } }, ...this.api.getView(this.order), ...{ enableImgContextMenu: true } });

    }

    async getOrderSummary() {
        if (this.order.workedAccounts.length == 1) {
            let initial = this.api.generateInitialAccounting(this.order);
            await this.api.saveAccountingOperations([initial]);
            await this.getOrder();
        }

        this.balance = this.order.workedAccounts.find(p => p.code == 'total')
        this.shouldBePaid = Helper.asCurrency(this.balance.alacak - this.balance.borc);
        this.puanBalanceKalitte = this.order.kalittePuanAccounts.find(p => p.code == 'total');
        this.puanBalanceButcher = this.order.butcherPuanAccounts.find(p => p.code == 'total');
        this.earnedPuanKalitte = this.puanBalanceKalitte ? Helper.asCurrency(this.puanBalanceKalitte.alacak - this.puanBalanceKalitte.borc) : 0.00
        this.earnedPuanButcher = this.puanBalanceButcher ? Helper.asCurrency(this.puanBalanceButcher.alacak - this.puanBalanceButcher.borc) : 0.00
        this.earnedPuanTotal = Helper.asCurrency(this.earnedPuanKalitte + this.earnedPuanButcher)
        if (this.shouldBePaid > 0) {
            this.possiblePuanList = this.api.getPossiblePuanGain(this.order, this.shouldBePaid);
            this.possiblePuanList.forEach(pg => this.mayEarnPuanTotal += pg.earned)
            this.mayEarnPuanTotal = Helper.asCurrency(this.mayEarnPuanTotal)
        }
    }


    async paymentSuccess(request: PaymentRequest, payment: PaymentResult) {
        await this.api.completeCreditcardPayment([this.order], request, payment);
        await this.getOrder();
        await this.getOrderSummary()
    }

    async getPaymentRequest() {
        let total = this.order.workedAccounts.find(p => p.code == 'total');


        
        let shouldBePaid = Helper.asCurrency(total.alacak - total.borc);
        if (shouldBePaid <= 0.00)
            throw new Error("Geçersiz ödeme işlemi, siparişin borcu yoktur");

        this.api.fillPuanAccounts(this.order, shouldBePaid);

        let butcherDebptAccounts = await AccountModel.summary([Account.generateCode("kasaplardan-alacaklar", [this.order.butcherid, 1]), Account.generateCode("kasaplardan-alacaklar", [this.order.butcherid, 2])])
        let butcherDebt = Helper.asCurrency(butcherDebptAccounts.borc - butcherDebptAccounts.alacak);

        let debt = {};

        //debt[this.order.butcherid] = butcherDebt;
        debt[this.order.butcherid] = 0.00;
        
        let request = this.paymentProvider.requestFromOrder([this.order], debt);

        if (shouldBePaid != request.paidPrice)
            throw new Error("Geçersiz sipariş ve muhasebesel tutarlar");

        return request;
    }

    @Auth.Anonymous()
    async payOrderRoute() {
        await this.getOrder();
        if (!this.order)
            return this.next();

        await this.getOrderSummary();

        let userMessage = "";

        try {
            if (this.pageHasPaymentId) {
                let req = await this.getPaymentRequest();
                let threedPaymentMade = await this.created3DPayment();
                if (threedPaymentMade) {
                    await this.paymentSuccess(req, threedPaymentMade);
                    userMessage = "Ödemeniz başarıyla alındı"
                } else {
                    throw new Error("Ödeme işlemi başarısız")
                }

            } else if (this.req.body.makepayment == "true") {
                if (this.req.body.secureship == 'on') {
                    this.order.noInteraction = true;
                    await this.order.save()
                } else {
                    this.order.noInteraction = false;
                    await this.order.save()
                }

                let paymentResult: PaymentResult;

                let req: PaymentRequest = await this.getPaymentRequest();
                if (this.threeDPaymentRequested) {
                    await this.init3dPayment(req);
                } else {
                    let creditCard = this.getCreditCard();
                    paymentResult = await this.createPayment(req, creditCard);
                    await this.paymentSuccess(req, paymentResult)
                    userMessage = "Ödemenizi başarıyla aldık"
                }

            }
        } catch (err) {
            userMessage = err.message || err.errorMessage;
            email.send('tansut@gmail.com', 'hata/payment: kasaptanAl.com', "error.ejs", {
                text: JSON.stringify(err || {}) + '/' + userMessage + ' ' + this.order.ordernum,
                stack: err.stack
            })            
        }

        this.renderPage(userMessage);

    }

    async getOrder() {
        let ordernum = this.req.params.ordernum;
        this.api = new OrderApi(this.constructorParams);
        this.order = await this.api.getOrder(ordernum, true);
    }

    @Auth.Anonymous()
    async payOrderViewRoute() {
        await this.getOrder();
        if (!this.order)
            return this.next();

        await this.getOrderSummary();


        this.renderPage();
    }





    static SetRoutes(router: express.Router) {
        router.get('/pay/:ordernum', Route.BindRequest(Route.prototype.payOrderViewRoute))
        router.post('/pay/:ordernum', Route.BindRequest(Route.prototype.payOrderRoute))
    }
}