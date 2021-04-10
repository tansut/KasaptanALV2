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



 class Test extends BaseTask {

    get interval() {
        return "*/15 * * * *"
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
        let oneHourLater = moment(Helper.Now()).add(1, 'hour').date();

        console.log("Now", now);
        console.log("mstart", mesaiStart);
        console.log("mend", mesaiEnd);

        if (true) {
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
                console.log("o.creation", o.creationDate);
                let oh = moment(o.creationDate).add(30, 'minutes').toDate();
                console.log("oh", oh);
                console.log("expn", oh < now);

                return oh < now;
            })


            // for (let i = 0; i < orders.length; i++) {
            //     let manageUrl = `${this.url}/manageorder/${orders[i].ordernum}`;
            //     let text = `UYARI: Musteriniz hala cevabinizi bekliyor: ${orders[i].butcherName} siparis [${orders[i].name}] suresinde yanitlanmadi. LUTFEN SIMDI YANITLAYIN: ${manageUrl} `
            //     await api.sendButcherNotifications(orders[i], text);
            //     orders[i].butcherLastReminder = Helper.Now();
            //     orders[i].butcherLastReminderType = 'plan';
            //     await  orders[i].save();
            // }
        }


        console.log('done OrderRemainers job', Date.now())

    }
}

async function init() {
    await db.init()
    let o = new Test('');
    await o.run();
}



init();