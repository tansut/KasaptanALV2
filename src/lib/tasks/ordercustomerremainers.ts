import { BaseTask } from "./basetask";
import { Order, OrderItem } from "../../db/models/order";
import * as sq from 'sequelize';
import { OrderItemStatus } from "../../models/order";
import Butcher from "../../db/models/butcher";
import Review from "../../db/models/review";
import { Op, Sequelize } from "sequelize";
import Product from "../../db/models/product";
import Area from "../../db/models/area";
import db from "../../db/context";
import Helper from "../helper";
import OrderApi from '../../routes/api/order';
import * as moment from 'moment';
import { Sms } from "../sms";
import SiteLogRoute from "../../routes/api/sitelog";



export default class OrderRemainers extends BaseTask {

    get interval() {
        return "*/20 * * * *"
    }

    async run() {
        console.log('running OrderRemainers job', Date.now());

        let mesaiStart = Helper.Now();
        mesaiStart.setHours(9);
        mesaiStart.setMinutes(0);

        let mesaiEnd = Helper.Now();
        mesaiEnd.setHours(19);
        mesaiEnd.setMinutes(0);


        let now = Helper.Now();

        if ((now > mesaiStart) && (now < mesaiEnd)) {
            let api = new OrderApi();
            let orders = await Order.findAll({
                limit: 10,
                include: [{
                    model: Butcher
                }],
                where: {
                    status: OrderItemStatus.reqirePayment,
                    customerLastReminder: {
                        [Op.eq]: null
                    }
                }
            })

            orders = orders.filter(o=> {
                let oh = moment(o.creationDate).add(30, 'minutes').toDate();
                return oh < now;
            })
            for (let i = 0; i < orders.length; i++) {
                let userUrl = `${this.url}/user/orders/${orders[i].ordernum}`;
                await Sms.send(orders[i].phone, `KasaptanAl.com ${orders[i].butcherName} siparisiniz henuz odenmemis gozukuyor. Bilgi: ${userUrl} `, false, new SiteLogRoute())
                orders[i].customerLastReminder = now;
                orders[i].customerLastReminderType = 'pay';
                orders[i].sentCustomerReminders++;
                await  orders[i].save();
            }
        }


        console.log('done OrderRemainers job', Date.now())

    }
}