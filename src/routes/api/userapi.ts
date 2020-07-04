import * as express from "express";
import { ViewRouter, ApiRouter } from '../../lib/router';
import moment = require('moment');
import { CacheManager } from "../../lib/cache";
import Butcher from "../../db/models/butcher";
import { Auth } from "../../lib/common";
import ButcherProduct from "../../db/models/butcherproduct";
import Product from "../../db/models/product";
import Area from "../../db/models/area";
import Helper from "../../lib/helper";
import OrderApi from "./order"
import { Order } from "../../db/models/order";
import { OrderItemStatus } from "../../models/order";
import { Sms } from "../../lib/sms";
import SiteLogRoute from "./sitelog";
import User from "../../db/models/user";
import UserRoute from "./user";
import { Google } from "../../lib/google";



export default class Route extends ApiRouter {

    async geocode() {
        if(!this.req.body.address)
            return this.next();
        let coded = await Google.getLocation(this.req.body.address)
        this.res.send(coded)
    }

    static SetRoutes(router: express.Router) {
        router.post("/geocode", Route.BindRequest(this.prototype.geocode));        
    }
}