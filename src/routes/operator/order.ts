import { ApiRouter, ViewRouter } from '../../lib/router';
import * as express from "express";
import * as maps from "@google/maps"
import ButcherModel from '../../db/models/butcher';
import moment = require('moment');
import { Auth } from '../../lib/common';
import AreaModel from '../../db/models/area';
import Helper from '../../lib/helper';
import Area from '../../db/models/area';
import Category from '../../db/models/category';
import Content from '../../db/models/content';
import config from '../../config';
import * as path from 'path';
import * as fs from 'fs';
import { readFileSync } from 'fs';
import UserRoute from '../api/user';
import { Order } from '../../db/models/order';
let ellipsis = require('text-ellipsis');
var MarkdownIt = require('markdown-it')
import iyzico from '../../lib/payment/iyzico';
import { CreditcardPaymentFactory, Creditcard, PaymentResult, PaymentRequest, PaymentTotal, CreditcardPaymentProvider } from '../../lib/payment/creditcard';
import OrderApi from "../api/order"
import SiteLogRoute from '../api/sitelog';
import SiteLog from '../../db/models/sitelog';
import Payment from '../../db/models/payment';
import AccountModel from '../../db/models/accountmodel';
import { Account } from '../../models/account';
import { PaymentRouter } from '../../lib/paymentrouter';
import { stringify } from 'querystring';
import { ComissionResult, ComissionHelper } from '../../lib/commissionHelper';
var MarkdownIt = require('markdown-it')

export default class Route extends ViewRouter {
    order: Order;
    api: OrderApi;
    _paymentProvider: CreditcardPaymentProvider
    markdown = new MarkdownIt();
    butcherFee: ComissionResult;

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
        let acountingSummary = await this.api.getWorkingAccounts(this.order);
        if (acountingSummary.length == 1) {
            let initial = this.api.generateInitialAccounting(this.order);
            await this.api.saveAccountingOperations([initial]);
            acountingSummary = await this.api.getWorkingAccounts(this.order);
        }
        let calc = new ComissionHelper(this.order.butcher.commissionRate, this.order.butcher.commissionFee);
        this.butcherFee = calc.calculate(this.order.workedAccounts.find(p=>p.code == 'total').alacak);
    }

    async orderSaveRoute() {
        let userMessage = "";

        await this.getOrder();

        if (!this.order)
            return this.next();

        if (this.req.body.saveOrderStatus == "true" && this.order.status != this.req.body.orderStatus) {
            this.order.statusDesc ? null : (this.order.statusDesc = '')
            this.order.statusDesc += `\n- ${Helper.formatDate(Helper.Now(), true)} tarihinde ${this.order.status} -> ${this.req.body.orderStatus}` 
            await this.api.completeOrderStatus(this.order, this.req.body.orderStatus);
            // this.order.status = this.req.body.orderStatus;
            // await this.order.save()
        }

        if (this.req.body.approveOrderSubMerchant == "true") {            
            await this.paymentProvider.approveItem({
                paymentTransactionId: this.order.paymentTransactionId
            })
            this.order.subMerchantStatus = 'approved';
            userMessage = `${this.order.ordernum} subMerchant ONAYLANDI`
            await this.order.save();
        }
        if (this.req.body.disApproveOrderSubMerchant == "true") {            
            await this.paymentProvider.disApproveItem({
                paymentTransactionId: this.order.paymentTransactionId
            })
            this.order.subMerchantStatus = 'disapproved';
            userMessage = `${this.order.ordernum} subMerchant ONAY KALDIRILDI`

            await this.order.save();
        }


        //

        
        await this.getOrder();

        this.sendView("pages/operator.manageorder.ejs", { ...{ _usrmsg: { text: userMessage } }, ...this.api.getView(this.order), ...{ enableImgContextMenu: true } });


    }

    async getOrder() {
        let ordernum = this.req.params.ordernum;
        this.api = new OrderApi(this.constructorParams);
        this.order = await this.api.getOrder(ordernum);
    }

    async ordersListRoute() {
        this.api = new OrderApi(this.constructorParams);
        let orders = await this.api.getOrders();
        this.sendView('pages/operator.orders.ejs', {orders: orders})
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
        } catch(err) {
            userMessage = err.message || err.errorMessage
        }

        await this.getOrder();
        await this.getOrderSummary();            

        this.sendView("pages/operator.manageorder.ejs", { 
            ...{ _usrmsg: { text: userMessage } },             
         ...this.api.getView(this.order), ...{ enableImgContextMenu: true } });

    }

    
    async orderViewRoute() {
        await this.getOrder();
        if (!this.order)
            return this.next();

        await this.getOrderSummary();            

            this.sendView("pages/operator.manageorder.ejs", { ...this.api.getView(this.order), ...{ enableImgContextMenu: true } });
    }

    //approveSubMerchant



    static SetRoutes(router: express.Router) {
        router.get('/order/:ordernum', Route.BindRequest(Route.prototype.orderViewRoute))
        router.get('/orders', Route.BindRequest(Route.prototype.ordersListRoute))
        router.post('/order/:ordernum', Route.BindRequest(Route.prototype.orderSaveRoute))
        router.post('/order/:ordernum/item', Route.BindRequest(Route.prototype.orderItemUpdateRoute))
        //router.post('/pay/:ordernum', Route.BindRequest(Route.prototype.payOrderRoute))
    }
}