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
import { Order } from "../../db/models/order";
import { Op } from 'sequelize';


export default class Route extends ButcherRouter {
    orders: Order[];


    // set @butcher = 10;

    // SELECT 'online satis toplam', sum(a.borc), sum(a.alacak) FROM  Accounts a where code in
    // (
    // select concat('205.',  o.userid, '.', o.ordernum, '.500') from Orders o where o.butcherid=@butcher and o.status ='teslim edildi' and  o.orderSource='kasaptanal.com'
    // )
    // union
    // SELECT 'kapida satis toplam', sum(a.borc), sum(a.alacak) FROM  Accounts a where code in
    // (
    // select concat('205.',  o.userid, '.', o.ordernum, '.600') from Orders o where o.butcherid=@butcher  and o.status ='teslim edildi' and o.orderSource='kasaptanal.com'
    // )
    // union
    // SELECT 'kasap puan-1', sum(a.borc), sum(a.alacak) FROM  Accounts a where code in
    // (
    // select concat('130.',  o.userid, '.', o.butcherid, '.', o.ordernum) from Orders o where o.butcherid=@butcher and o.status ='teslim edildi' and o.orderSource='kasaptanal.com'
    // )
    // union
    // SELECT 'dagitilan puan-2', sum(a.borc), sum(a.alacak) FROM  Accounts a where code in
    // (
    // select concat('132.',  o.userid, '.2.', o.ordernum) from Orders o where o.butcherid=@butcher and o.status ='teslim edildi' and o.orderSource='kasaptanal.com'
    // )


    async viewRoute() {
        await this.setButcher();

        let sdate = Helper.newDate2(2000,1,1);
        let fdate = moment().endOf("month").toDate();

        let q = this.req.query.q || '7days';

        if (q == '7days') {
            sdate = moment().startOf('day').subtract(7, "days").toDate();
        } else if (q=='thismonth') {
            sdate = moment().startOf("month").toDate();
            fdate = moment().endOf("month").toDate();
        } else {
            sdate = moment().subtract(1, "month").startOf("month").toDate();
            fdate = moment(sdate).endOf("month").toDate();
        }

        let orders = await Order.findAll({
            where: {
                butcherid: this.butcher.id,
                [Op.and]: [
                    {
                        creationDate: {
                            [Op.gte]: sdate
                        }
                    },
                    {
                        creationDate: {
                            [Op.lte]: fdate
                        }
                    }    
                ]                
            },
            order: [['id', 'desc']]
        })


        this.res.render("pages/butcher.orders.ejs", this.viewData({
            orders: orders
        }))
    }

    static SetRoutes(router: express.Router) {
        router.get("/siparislerim", Route.BindRequest(this.prototype.viewRoute));
    }
}

