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



export default class OrderRemainers extends BaseTask {

    get interval() {
        return "*/15 * * * *"
    }

    async run() {
        console.log('running OrderRemainers job', Helper.formatDate(Helper.Now(), true));

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
                    status: OrderItemStatus.supplying,
                    butcherLastReminder: {
                        [Op.eq]: null
                    }
                }
            })

            orders = orders.filter(o=> {
                let oh = moment(o.creationDate).add(30, 'minutes').toDate();
                return oh < now;
            })
            for (let i = 0; i < orders.length; i++) {
                let manageUrl = `${this.url}/manageorder/${orders[i].ordernum}`;
                let text = `UYARI: Musteriniz hala cevabinizi bekliyor: ${orders[i].butcherName} siparis [${orders[i].displayName}] suresinde yanitlanmadi. LUTFEN SIMDI YANITLAYIN: ${manageUrl} `
                await api.sendButcherNotifications(orders[i], text);
                await new Promise(r => setTimeout(r, 5));
                orders[i].butcherLastReminder = now;
                orders[i].butcherLastReminderType = 'plan';
                orders[i].sentButcherReminders++;
                await  orders[i].save();
            }
        }


        console.log('done OrderRemainers job', Helper.formatDate(Helper.Now(), true))

    }
}