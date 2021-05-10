"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const basetask_1 = require("./basetask");
const order_1 = require("../../db/models/order");
const order_2 = require("../../models/order");
const butcher_1 = require("../../db/models/butcher");
const sequelize_1 = require("sequelize");
const helper_1 = require("../helper");
const order_3 = require("../../routes/api/order");
const moment = require("moment");
class OrderRemainers extends basetask_1.BaseTask {
    get interval() {
        return "*/15 * * * *";
    }
    run() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('running OrderRemainers job', helper_1.default.formatDate(helper_1.default.Now(), true));
            let mesaiStart = helper_1.default.Now();
            mesaiStart.setHours(9);
            mesaiStart.setMinutes(0);
            let mesaiEnd = helper_1.default.Now();
            mesaiEnd.setHours(19);
            mesaiEnd.setMinutes(0);
            let now = helper_1.default.Now();
            if ((now > mesaiStart) && (now < mesaiEnd)) {
                let api = new order_3.default();
                let orders = yield order_1.Order.findAll({
                    limit: 10,
                    include: [{
                            model: butcher_1.default
                        }],
                    where: {
                        status: order_2.OrderItemStatus.supplying,
                        butcherLastReminder: {
                            [sequelize_1.Op.eq]: null
                        }
                    }
                });
                orders = orders.filter(o => {
                    let oh = moment(o.creationDate).add(30, 'minutes').toDate();
                    return oh < now;
                });
                for (let i = 0; i < orders.length; i++) {
                    let manageUrl = `${this.url}/manageorder/${orders[i].ordernum}`;
                    let text = `UYARI: Musteriniz hala cevabinizi bekliyor: ${orders[i].butcherName} siparis [${orders[i].displayName}] suresinde yanitlanmadi. LUTFEN SIMDI YANITLAYIN: ${manageUrl} `;
                    yield api.sendButcherNotifications(orders[i], text);
                    yield new Promise(r => setTimeout(r, 5));
                    orders[i].butcherLastReminder = now;
                    orders[i].butcherLastReminderType = 'plan';
                    orders[i].sentButcherReminders++;
                    yield orders[i].save();
                }
            }
            console.log('done OrderRemainers job', helper_1.default.formatDate(helper_1.default.Now(), true));
        });
    }
}
exports.default = OrderRemainers;
