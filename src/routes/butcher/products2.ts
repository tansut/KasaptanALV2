import * as express from "express";
import { ViewRouter } from '../../lib/router';
import moment = require('moment');
import { CacheManager } from "../../lib/cache";
import Butcher from "../../db/models/butcher";
import { Auth } from "../../lib/common";
import ButcherProduct from "../../db/models/butcherproduct";
import Product from "../../db/models/product";
import Area from "../../db/models/area";
import { ButcherRouter } from "./home";
import * as _ from "lodash";
import Helper from "../../lib/helper";
import db from "../../db/context";
import { Transaction } from "sequelize";
import ButcherPriceHistory from "../../db/models/butcherpricehistory";


export default class Route extends ButcherRouter {

    @Auth.Anonymous()
    async viewRoute() {
        if (await this.setButcher()) {
            this.renderView('pages/products.forbutchers.ejs', null, {
                butcher: this.butcher
            });
        }



    }





    static SetRoutes(router: express.Router) {
        router.get("/urunlerim", Route.BindRequest(this.prototype.viewRoute));

    }
}

