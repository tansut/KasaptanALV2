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
const sequelize_1 = require("sequelize");
const helper_1 = require("../helper");
const moment = require("moment");
const sms_1 = require("../sms");
const sitelog_1 = require("../../routes/api/sitelog");
class OrderRemainers extends basetask_1.BaseTask {
    get interval() {
        return "*/60 * * * *";
    }
    run() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('running OrderEvalRemainers job', helper_1.default.formatDate(helper_1.default.Now(), true));
            let mesaiStart = helper_1.default.Now();
            mesaiStart.setHours(11);
            mesaiStart.setMinutes(0);
            let mesaiEnd = helper_1.default.Now();
            mesaiEnd.setHours(21);
            mesaiEnd.setMinutes(0);
            let now = helper_1.default.Now();
            let oneweek = moment(now).subtract(1, 'week').toDate();
            let twoweeks = moment(now).subtract(2, 'weeks').toDate();
            if ((now > mesaiStart) && (now < mesaiEnd)) {
                let orders = yield order_1.Order.findAll({
                    limit: 30,
                    where: {
                        orderSource: 'kasaptanal.com',
                        status: order_2.OrderItemStatus.success,
                        customerLastReminderType: {
                            [sequelize_1.Op.or]: [{ [sequelize_1.Op.ne]: 'eval' }, { [sequelize_1.Op.eq]: null }]
                        },
                        creationDate: {
                            [sequelize_1.Op.and]: [{
                                    [sequelize_1.Op.lte]: oneweek
                                }, {
                                    [sequelize_1.Op.gte]: twoweeks
                                }]
                        }
                    }
                });
                for (let i = 0; i < orders.length; i++) {
                    let userUrl = `${this.url}/eval/${orders[i].ordernum}`;
                    yield sms_1.Sms.send(orders[i].phone, `Gorusleriniz cok onemli. KasaptanAl ${orders[i].butcherName} siparisinizi simdi degerlendirin: ${userUrl} `, false, new sitelog_1.default());
                    yield new Promise(r => setTimeout(r, 25));
                    orders[i].customerLastReminder = now;
                    orders[i].customerLastReminderType = 'eval';
                    orders[i].sentCustomerReminders++;
                    yield orders[i].save();
                }
            }
            console.log('done OrderEvalRemainers job', helper_1.default.formatDate(helper_1.default.Now(), true));
        });
    }
}
exports.default = OrderRemainers;
