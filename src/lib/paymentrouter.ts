import * as http from './http';
import * as express from "express";
import { auth } from '../middleware/auth';
import { Auth } from './common';
import 'reflect-metadata';
import { request } from 'https';
import * as stream from 'stream';
import * as _ from 'lodash';
import * as moment from 'moment';
import sequelize = require('sequelize');
import config from "../config";
import * as path from "path";
import Area from '../db/models/area';
import Category from '../db/models/category';
import Product from '../db/models/product';
import { where } from 'sequelize';
let ellipsis = require('text-ellipsis');
import { PreferredAddress } from '../db/models/user';
import { ViewRouter } from './router';
import { Creditcard, CreditcardPaymentFactory, PaymentTotal, PaymentRequest, PaymentResult, CreditcardPaymentProvider } from './payment/creditcard';
import SiteLogRoute from '../routes/api/sitelog';
var MarkdownIt = require('markdown-it')
import Payment from '../db/models/payment';
import { Order } from '../db/models/order';


export class PaymentRouter extends ViewRouter  {
    _paymentProvider: CreditcardPaymentProvider;
    threeDhtml: string;

    async paymentSuccess(payment: PaymentResult) {
    }

    get pageHasPaymentId() {
        return this.req.body.paymentId
    }

    get threeDPaymentRequested() {
        return this.req.body['3d'] == "on"
    }

    async init3dPayment(req: PaymentRequest) {
        req.callbackUrl = this.url + '/3dnotify';
        let creditCard = this.getCreditCard();
        let paymentResult: PaymentResult;

        try {
            paymentResult = await this.paymentProvider.pay3dInit(req, creditCard);
            let buff = new Buffer(paymentResult.threeDSHtmlContent, 'base64');
            this.req.session.threeDhtml = buff.toString('ascii');
            await new Promise((resolve, reject) => {
                this.req.session.save(err => (err ? reject(err) : resolve()))
            })
            this.threeDhtml = "/3dpaymentHtml";
        } catch (err) {
            throw err;
        }
    }


    async createPayment(req: PaymentRequest, card: Creditcard) {
        return this.paymentProvider.pay(req, card);
    }


    async created3DPayment(): Promise<PaymentResult> {
        if (this.req.body.paymentId) {
            let payment = await Payment.findOne({
                where: {
                    paymentId: this.req.body.paymentId
                }
            })
            return payment ? JSON.parse(payment.response) : null;

        } else return null;
    }

    @Auth.Anonymous()    
    async threeDRoute() {
        this.res.send(this.req.session.threeDhtml);
        this.req.session.threeDhtml = undefined;
    }     


    @Auth.Anonymous()
    async threeDNotifyRoute() {
        let result = this.req.body;

        let request = {
            conversationData: result.conversationData,
            conversationId: result.conversationId,
            paymentId: result.paymentId
        }
        try {
            if (!this.paymentProvider.pay3dHandshakeSuccess(result))
                throw new Error("3d işlemi başarısız" );
            let threedResult = await this.paymentProvider.pay3dComplete(request);
            this.res.render("pages/3dcomplete", {
                paymentId: threedResult.paymentId
            })
        } catch(err) {
            this.res.status(500);
            this.res.render("pages/3dcomplete", {
                paymentId: ''
            })            
        }           
    }    

    getCreditCard(): Creditcard {
        return {
            cardHolderName: this.req.body.name,
            cardNumber: this.req.body.number.replace(/\s+/g, ''),
            cvc: this.req.body.cvc,
            expireMonth: this.req.body.expiry.split('/')[0].replace(/\s+/g, ''),
            expireYear: this.req.body.expiry.split('/')[1].replace(/\s+/g, '')
        }        
    }

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


}

