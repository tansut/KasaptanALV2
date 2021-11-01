import { ApiRouter, ViewRouter } from '../../lib/router';
import * as express from "express";
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
import { PuanResult } from '../../models/puan';
import Review from '../../db/models/review';
import { LocationType, LocationTypeDesc } from '../../models/geo';
import { LogisticFactory } from '../../lib/logistic/core';
import { off } from 'process';
import Dispatcher from '../../db/models/dispatcher';
import Butcher from '../../db/models/butcher';
var MarkdownIt = require('markdown-it')
import { DeliveryStatus, DeliveryStatusDesc, OrderItemStatus } from '../../models/order';

export default class Route extends ViewRouter {

    async ViewRoute() {
        this.renderView("pages/operator.butcherapplications.ejs");
    }



    static SetRoutes(router: express.Router) {
        router.get('/butcherapplications', Route.BindRequest(Route.prototype.ViewRoute))
    }
}