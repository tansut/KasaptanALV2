const Nexmo = require("nexmo")
import config from "../config";
import axios, { AxiosResponse } from "axios";
import email from './email';
import SiteLogRoute from "../routes/api/sitelog";
import { SiteStatsData } from "../models/sitestat";
import User from "../db/models/user";
import Product from "../db/models/product";
import Area from "../db/models/area";
import { Order } from "../db/models/order";
import * as sq from 'sequelize';
import { OrderItemStatus } from "../models/order";


export class SiteStats {
    static async get(): Promise<SiteStatsData> {
        let os = <any>await Order.sequelize.query(`SELECT sum(quantity * pounitkgRatio) as kg, count(*) as total, count(distinct orderid) as totalOrder, count(distinct userid) as totalUser
        FROM OrderItems oi, Orders o 
        where o.id = oi.orderid`, {
            type: sq.QueryTypes.SELECT,
        })

        let osStats = <any>await Order.sequelize.query(`SELECT o.status as status, count(*) as total from Orders o group by o.status`, {
            type: sq.QueryTypes.SELECT,
        })

        let success = 0
        let fail = 0

        osStats.forEach(stat => {
            if (stat.status == OrderItemStatus.success) success+=stat.total;
            if (stat.status == OrderItemStatus.butcherCannotShip) fail+=stat.total;

        });

        let total = success + fail;
        

        return {
            customer: await User.count(),
            product: await Product.count(),
            semt: await Area.count({where: {status: 'active'}}),
            kg: os[0].kg,
            ship: total <= 0 ? 100: Math.round(100 * (success / total))
        }
    }
}