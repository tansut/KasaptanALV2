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

export default class Route extends PaymentRouter {
    order: Order;
    api: OrderApi;
    acountingSummary: AccountModel[];

    async getOrderSummary() {
        this.acountingSummary = await this.api.getWorkingAccounts(this.order);
        if (this.acountingSummary.length == 1) {
            let initial = this.api.generateInitialAccounting(this.order);
            await this.api.saveAccountingOperations([initial]);
            this.acountingSummary = await this.api.getWorkingAccounts(this.order);
        }
    }


    async paymentSuccess(payment: PaymentTotal) {
        await this.api.makeCreditcardPayment([this.order], payment);
        await this.getOrderSummary();
    }

    getPaymentRequest() {
        let request = this.paymentProvider.requestFromOrder([this.order]);
        let total = this.acountingSummary.find(p => p.code == 'total');
        let shouldBePaid = total.alacak - total.borc;
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

        if (this.pageHasPaymentId) {
            try {
                this.getPaymentRequest();
                let threedPaymentMade = await this.created3DPayment();
                if (threedPaymentMade) {
                    await this.paymentSuccess(threedPaymentMade);                
                    userMessage = "Ödemeniz başarıyla alındı"
                } else {
                    userMessage = "Ödeme işlemi başarısız"
                }
            } catch(err) {
                userMessage = err.message || err.errorMessage
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
            try {
                let req: PaymentRequest = this.getPaymentRequest();
                if (this.threeDPaymentRequested) {
                    await this.init3dPayment(req);
                } else {
                    let creditCard = this.getCreditCard();
                    paymentResult = await this.createPayment(req, creditCard);
                    await this.paymentSuccess({
                        paymentId: paymentResult.paymentId,
                        paid: paymentResult.paidPrice,
                        type: "sales"
                    })
                    userMessage = "Ödemenizi başarıyla aldık"
                }
            } catch (err) {
                userMessage = err.message || err.errorMessage
            }
        }

        this.sendView("pages/payorder.ejs", { ...{ _usrmsg: { text: userMessage } }, ...{ accounting: this.acountingSummary }, ...this.api.getView(this.order, this.acountingSummary), ...{ enableImgContextMenu: true } });
    }

    async getOrder() {
        let ordernum = this.req.params.ordernum;
        this.api = new OrderApi(this.constructorParams);
        this.order = await this.api.getOrder(ordernum);
    }

    @Auth.Anonymous()
    async payOrderViewRoute() {
        await this.getOrder();
        if (!this.order)
            return this.next();

        await this.getOrderSummary();            

            this.sendView("pages/payorder.ejs", { ... { accounting: this.acountingSummary }, ...this.api.getView(this.order, this.acountingSummary), ...{ enableImgContextMenu: true } });
    }





    static SetRoutes(router: express.Router) {
        router.get('/pay/:ordernum', Route.BindRequest(Route.prototype.payOrderViewRoute))
        router.post('/pay/:ordernum', Route.BindRequest(Route.prototype.payOrderRoute))
    }
}