import { BaseTask } from "./basetask";
import { Order } from "../../db/models/order";
import * as sq from 'sequelize';
import { OrderItemStatus } from "../../models/order";
import Butcher from "../../db/models/butcher";


export default class ButcherStats extends BaseTask {

    get interval() {
        return "20 0 * * *"
    }



    async run() {
        console.log('running product stats job', Date.now())
        await Order.sequelize.query(`
        
        update Products as dest, 
        (
        SELECT oi.productid as pid, avg(r.userRating1) as ratingAvg, count(*) as total FROM Reviews r, Orders o, OrderItems oi 
                WHERE r.type='order' and oi.status='teslim edildi' and r.ref1=o.id and oi.orderid = o.id 
                group by oi.productid
        ) as src
        set 
        dest.ratingValue = src.ratingAvg,
        dest.reviewCount = src.total
        where
        dest.id = src.pid

        `,
            {
                type: sq.QueryTypes.BULKUPDATE,
            });
        console.log('done product stats job', Date.now())
    }
}