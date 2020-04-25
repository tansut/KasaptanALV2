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


export class PaymentRouter extends ViewRouter {
    _paymentProvider: CreditcardPaymentProvider;
    threeDhtml: string;

    async paymentSuccess(request: PaymentRequest, payment: PaymentResult) {
        if (this.req.body.paymentId) {
            await Payment.update(
                {
                    status: 'used'
                },
                {
                    where: {
                        paymentId: this.req.body.paymentId
                    }
                }
            )
        }
    }

    get pageHasPaymentId() {
        return this.req.body.paymentId
    }

    get threeDPaymentRequested() {
        return this.req.body['3d'] == "on"
    }

    async init3dPayment(req: PaymentRequest) {
        req.callbackUrl = this.url + '/3dnotify?provider=' + this.paymentProvider.providerKey;
        let creditCard = this.getCreditCard();
        let paymentResult: PaymentResult;

        try {
            paymentResult = await this.paymentProvider.pay3dInit(req, creditCard);
            this.req.session.threeDhtml = paymentResult.threeDSHtmlContent;
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
                    paymentId: this.req.body.paymentId,
                    status: 'unused'
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
        let view = `pages/_partial/paymentprovider/${this.paymentProvider.providerKey}.3dcomplete.ejs`;
        try {
            let shakeResult = await this.paymentProvider.pay3dHandshakeSuccess(result);
            if (!shakeResult)
                throw new Error("3d işlemi başarısız");
            let threedResult = await this.paymentProvider.pay3dComplete(result);
            this.res.render(view, {
                paymentId: threedResult.paymentId,
                ordernum: result.merchantPaymentId,
            })
        } catch (err) {            
            this.res.status(500);            
            this.res.render(view, {
                paymentId: 'NONE',
                ordernum: result.merchantPaymentId
            })
        }
    }

    getCreditCard(): Creditcard {
        this.req.body.pan = this.req.body.pan || "";
        this.req.body.expiry = <string>this.req.body.expiry || "";
        let expireMonth = "";
        let expireYear = "";
        if (this.req.body.expiry.includes("/")) {
            expireMonth = this.req.body.expiry.split('/')[0]
            expireYear = this.req.body.expiry.split('/')[1]
        } else {
            if (this.req.body.expiry.length == 4) {
                expireMonth = this.req.body.expiry.slice(0, 2);
                expireYear = this.req.body.expiry.slice(2, 4);
            } else if (this.req.body.expiry.length == 6) {
                expireMonth = this.req.body.expiry.slice(0, 2);
                expireYear = this.req.body.expiry.slice(2, 6);
            }
        }

        if (expireYear.length == 2) {
            expireYear = "20" + expireYear
        }

        if (expireMonth.length == 1) {
            expireMonth = "0" + expireMonth
        }

        return {
            cardHolderName: this.req.body.cardOwner,
            cardNumber: this.req.body.pan.replace(/\s+/g, ''),
            cvc: this.req.body.cvv,
            expireMonth: expireMonth.replace(/\s+/g, ''),
            expireYear: expireYear.replace(/\s+/g, '')
        }
    }

    get paymentProvider() {
        if (!this._paymentProvider) {
            let payment = CreditcardPaymentFactory.getInstance(this.req.query.provider);
            let log = new SiteLogRoute(this.constructorParams);
            payment.logger = log;
            payment.userid = this.req.user ? this.req.user.id : null;
            payment.ip = this.req.header("x-forwarded-for") || this.req.connection.remoteAddress;
            this._paymentProvider = payment
        }
        return this._paymentProvider;

    }


}

