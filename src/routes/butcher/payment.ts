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



export default class Route extends ButcherRouter {

    async viewRoute() {
        await this.setButcher(); 
        this.res.render("pages/butcher.get-payment.ejs", this.viewData({

        }))
    }




    static SetRoutes(router: express.Router) {
        router.get("/odemeal", Route.BindRequest(this.prototype.viewRoute));        
    }
}

