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
import SiteLog from "../../db/models/sitelog";



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

    async listButcherApplicationsRoute() {
        //if (!this.req.user.hasRole('admin')) return this.next();
        
        let sdate = Helper.newDate2(2000,1,1);
        let fdate = moment().endOf("month").toDate();

        let q = this.req.query.q || '3days';

        if (q == '3days') {
            sdate = moment().startOf('day').subtract(3, "days").toDate();
        } else if (q == '7days') {
            sdate = moment().startOf('day').subtract(7, "days").toDate();
        } else if (q=='thismonth') {
            sdate = moment().startOf("month").toDate();
            fdate = moment().endOf("month").toDate();
        } else if (q=='all') {
            sdate = moment().startOf('day').subtract(10, "month").toDate();

        } else {
            sdate = moment().subtract(1, "month").startOf("month").toDate();
            fdate = moment(sdate).endOf("month").toDate();
        }

        let where = {
            logtype: 'BAS',
            creationDate: {
                [Op.and]: [
                    {
                        [Op.gte]: sdate
                    },
                    {
                        [Op.lte]: fdate
                    }
                ]
            }
                           
        };



        let orders = await SiteLog.findAll({
            where: where,
            order: [['id', 'desc']]
        })



        let result = orders.map(o=> {
            let data = JSON.parse(o.logData);
            return {
                date: o.creationDate, 
                name: data.name,
                tel: data.tel,
                city: data.city,
                butcherAddress: data.butcherAddress,
                butcher: data.butcher

                
                
            }
        });
        this.res.send(result)
    }


    static SetRoutes(router: express.Router) {
        router.post("/reviews/list", Route.BindRequest(this.prototype.listReviews));        
        router.post("/reviews/save", Route.BindRequest(this.prototype.saveReview));        
        router.get("/butcherapplications/list", Route.BindRequest(this.prototype.listButcherApplicationsRoute));        
    }
}