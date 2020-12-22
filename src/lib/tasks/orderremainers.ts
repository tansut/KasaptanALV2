import { BaseTask } from "./basetask";
import { Order, OrderItem } from "../../db/models/order";
import * as sq from 'sequelize';
import { OrderItemStatus } from "../../models/order";
import Butcher from "../../db/models/butcher";
import Review from "../../db/models/review";
import { Op, Sequelize, Transaction } from "sequelize";
import Product from "../../db/models/product";
import Area from "../../db/models/area";
import db from "../../db/context";
import Helper from "../helper";
import OrderApi from '../../routes/api/order';
import * as moment from 'moment';



export default class OrderRemainers extends BaseTask {

    get interval() {
        return "*/15 * * * *"
    }



    async run() {
        console.log('running OrderRemainers job', Date.now());

        let mesaiStart = Helper.Now();
        mesaiStart.setHours(9);

        let mesaiEnd = Helper.Now();
        mesaiEnd.setHours(19);

        let now = Helper.Now();
        let oneHourLater = Helper.Now().setTime(now.getTime() + (1*60*60*1000));


        if ((now > mesaiStart) && (now < mesaiEnd)) {
            let api = new OrderApi();
            let orders = await Order.findAll({
                limit: 10,
                include: [{
                    model: Butcher
                }],
                where: {
                    status: OrderItemStatus.supplying,
                    butcherLastReminder: {
                        [Op.eq]: null
                    }
                }
            })

            orders = orders.filter(o=> {
                let oh = moment(o.creationDate).add(30, 'minutes').date();
                return oh < oneHourLater
            })


            for (let i = 0; i < orders.length; i++) {
                let manageUrl = `${this.url}/manageorder/${orders[i].ordernum}`;
                let text = `MÜŞTERİNİZ YANITNIZI BEKLİYOR: ${orders[i].butcherName} siparis [${orders[i].name}] suresinde yanitlanmadi. LUTFEN SIMDI YANITLAYIN: ${manageUrl} `
                await api.sendButcherNotifications(orders[i], text);
                orders[i].butcherLastReminder = Helper.Now();
                orders[i].butcherLastReminderType = 'plan';
                await  orders[i].save();
            }
        }


        console.log('done OrderRemainers job', Date.now())

    }
}