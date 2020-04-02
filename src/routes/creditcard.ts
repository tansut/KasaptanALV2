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
import { CreditcardPaymentFactory, Creditcard, PaymentResult } from '../lib/payment/creditcard';
import OrderApi from "./api/order"
import SiteLogRoute from './api/sitelog';
import SiteLog from '../db/models/sitelog';
import Payment from '../db/models/payment';
import { PaymentRouter } from '../lib/paymentrouter';

export default class Route extends PaymentRouter {

    orders: Order[] = [];


    @Auth.Anonymous()
    async paySessionRoute() {
        debugger
    }
    


    @Auth.Anonymous()
    async payRoute() {

        let orderids = this.req.body.ordernum.split(',');
        let orderApi = new OrderApi(this.constructorParams);
        let userMessage = "";

        for (let i = 0; i < orderids.length; i++)
            this.orders.push(await orderApi.getOrder(orderids[i]))

        if (this.pageHasPaymentId) {
            let threedPaymentMade = await this.created3DPayment();
            if (threedPaymentMade) {
                await this.paymentSuccess(threedPaymentMade);
                userMessage = "Başarılı 3d ödemesi"
            } else {
                userMessage = "Hatalı 3d ödemesi"
            }
        } else if (this.req.body.makepayment == "true") {
            let req = this.paymentProvider.requestFromOrder(this.orders);
            let paymentResult: PaymentResult;

            if (this.threeDPaymentRequested) {
                try {
                    await this.init3dPayment(req);
                } catch (err) {
                    userMessage = err.message || err.errorMessage
                }
            } else {
                let creditCard = this.getCreditCard();
                try {
                    paymentResult = await this.createPayment(req, creditCard);
                    await this.paymentSuccess(paymentResult)
                    userMessage = "başarılı"
                } catch (err) {
                    userMessage = err.message || err.errorMessage
                }
            }
        }

        this.sendView("pages/testcard.ejs", {
            _usrmsg: userMessage ? { text: userMessage }: null
        })

    }

    static SetRoutes(router: express.Router) {
        router.post("/testcard", Route.BindRequest(Route.prototype.payRoute));
        router.get("/3dpaymentHtml", Route.BindRequest(Route.prototype.threeDRoute));
        router.post("/3dnotify", Route.BindRequest(Route.prototype.threeDNotifyRoute));
        router.post("/pay-session", Route.BindRequest(Route.prototype.paySessionRoute));
        router.get('/testcard', Route.BindToView("pages/testcard.ejs"))
        router.get('/3dnotify', Route.BindToView("pages/3dcomplete.ejs"))

        
    }
}