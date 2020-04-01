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
import { ComissionResult, ComissionHelper } from '../lib/commissionHelper';
let ellipsis = require('text-ellipsis');
var MarkdownIt = require('markdown-it')

export default class Route extends ViewRouter {
    feeResult: ComissionResult;


    renderPage(msg: any = undefined) {        
        this.sendView(`pages/butcher.feecalculator.ejs`, {
            pageTitle: 'Komisyon Hesap Makinesi'
        })
    }






    @Auth.Anonymous()
    async viewRoute() {
        if (this.req.query.go && this.req.query.total && this.req.query.rate) {
            this.calculateRoute(parseFloat(this.req.query.total), parseFloat(this.req.query.rate))
        }
        else this.renderPage();
    }

    @Auth.Anonymous()
    async calculateRoute(totalSales: number = 0.00, ratePercParam: number = 0.00) {
        
            let total = totalSales || parseFloat(this.req.body.salesTotal);
            let ratePerc = ratePercParam || parseFloat(this.req.body.rate);
            let calc = new ComissionHelper(ratePerc / 100, 0);
            this.feeResult = calc.calculate(total);
        
        this.renderPage();
    }



    static SetRoutes(router: express.Router) {
        router.get("/gelir-hesapla", Route.BindRequest(Route.prototype.viewRoute));
        router.post("/gelir-hesapla", Route.BindRequest(Route.prototype.calculateRoute));
    }
}