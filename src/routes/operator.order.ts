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
import { CreditcardPaymentFactory, Creditcard, PaymentResult, PaymentRequest, PaymentTotal, CreditcardPaymentProvider } from '../lib/payment/creditcard';
import OrderApi from "./api/order"
import SiteLogRoute from './api/sitelog';
import SiteLog from '../db/models/sitelog';
import Payment from '../db/models/payment';
import AccountModel from '../db/models/accountmodel';
import { Account } from '../models/account';
import { PaymentRouter } from '../lib/paymentrouter';
import { stringify } from 'querystring';

export default class Route extends ViewRouter {
    order: Order;
    api: OrderApi;
    acountingSummary: AccountModel[];
    _paymentProvider: CreditcardPaymentProvider

    get paymentProvider() {
        if (!this._paymentProvider) {
            let payment = CreditcardPaymentFactory.getInstance();
            let log = new SiteLogRoute(this.constructorParams);
            payment.logger = log;
            payment.userid = this.req.user ? this.req.user.id: null;
            payment.ip = this.req.header("x-forwarded-for") || this.req.connection.remoteAddress;
            this._paymentProvider = payment
        }
        return this._paymentProvider;

    }


    async getOrderSummary() {
        this.acountingSummary = await this.api.getWorkingAccounts(this.order);
        if (this.acountingSummary.length == 1) {
            let initial = this.api.generateInitialAccounting(this.order);
            await this.api.saveAccountingOperations([initial]);
            this.acountingSummary = await this.api.getWorkingAccounts(this.order);
        }
    }

    

    async getOrder() {
        let ordernum = this.req.params.ordernum;
        this.api = new OrderApi(this.constructorParams);
        this.order = await this.api.getOrder(ordernum);
    }

    
    async orderItemUpdateRoute() {
        await this.getOrder();
        if (!this.order)
            return this.next();


        let itemid = this.req.body.itemid;

        let orderitem = this.order.items.find(p=>p.id == parseInt(itemid))
        let userMessage = "";

        try {
            if (this.req.body.approveSubMerchant) {            
                await this.paymentProvider.approveItem({
                    paymentTransactionId: orderitem.paymentTransactionId
                })
                orderitem.subMerchantStatus = 'approved';
                await orderitem.save();
            }
            if (this.req.body.disApproveSubMerchant) {            
                await this.paymentProvider.disApproveItem({
                    paymentTransactionId: orderitem.paymentTransactionId
                })
                orderitem.subMerchantStatus = 'disapproved';
                await orderitem.save();
            }
        } catch(err) {
            userMessage = err.message || err.errorMessage
        }

        await this.getOrder();
        await this.getOrderSummary();            

        this.sendView("pages/operator.manageorder.ejs", { ...{ _usrmsg: { text: userMessage } }, ...{ accounting: this.acountingSummary }, ...this.api.getView(this.order, this.acountingSummary), ...{ enableImgContextMenu: true } });

    }

    
    async orderViewRoute() {
        await this.getOrder();
        if (!this.order)
            return this.next();

        await this.getOrderSummary();            

            this.sendView("pages/operator.manageorder.ejs", { ... { accounting: this.acountingSummary }, ...this.api.getView(this.order, this.acountingSummary), ...{ enableImgContextMenu: true } });
    }

    //approveSubMerchant



    static SetRoutes(router: express.Router) {
        router.get('/operator/order/:ordernum', Route.BindRequest(Route.prototype.orderViewRoute))
        router.post('/operator/order/:ordernum/item', Route.BindRequest(Route.prototype.orderItemUpdateRoute))
        //router.post('/pay/:ordernum', Route.BindRequest(Route.prototype.payOrderRoute))
    }
}