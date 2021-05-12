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
import { Op, Sequelize } from "sequelize";
import Review from "../../db/models/review";



export default class Route extends ApiRouter {

    
    async listReviews() {
        let result = await Review.findAll({
            where: {
                published: false
            }
        })
        this.res.send(result)
    }


    async saveReview() {
        let r = await Review.findByPk(parseInt(this.req.body.id));
        r.published = true;
        r.userRating1 = Helper.parseFloat(this.req.body.star);
        r.content = this.req.body.content;
        await r.save();
        this.res.send(r)
    }


    static SetRoutes(router: express.Router) {
        router.post("/reviews/list", Route.BindRequest(this.prototype.listReviews));        
        router.post("/reviews/save", Route.BindRequest(this.prototype.saveReview));        
    }
}