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
let ellipsis = require('text-ellipsis');
var MarkdownIt = require('markdown-it')

export default class Route extends ViewRouter {



    renderPage() {
        this.res.render(`pages/resetpassword.ejs`, this.viewData({}))
    }



    @Auth.Anonymous()
    async resetRoute() {
        this.renderPage();

    }


    @Auth.Anonymous()
    async viewRoute() {

        this.renderPage();
    }




    static SetRoutes(router: express.Router) {
        router.get("/reset-password", Route.BindRequest(Route.prototype.viewRoute));
        router.post("/reset-password", Route.BindRequest(Route.prototype.resetRoute));
        router.get('/login', Route.BindToView("pages/login.ejs"))
    }
}