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
const moment = require("moment");
const home_1 = require("./home");
const order_1 = require("../../db/models/order");
const sequelize_1 = require("sequelize");
class Route extends home_1.ButcherRouter {
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
    viewRoute() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.setButcher();
            let sdate = new Date(2000, 1, 1);
            let fdate = moment().endOf("month").toDate();
            let q = this.req.query.q || '7days';
            if (q == '7days') {
                sdate = moment().startOf('day').subtract(7, "days").toDate();
            }
            else if (q == 'thismonth') {
                sdate = moment().startOf("month").toDate();
                fdate = moment().endOf("month").toDate();
            }
            else {
                sdate = moment().subtract(1, "month").startOf("month").toDate();
                fdate = moment(sdate).endOf("month").toDate();
            }
            let orders = yield order_1.Order.findAll({
                where: {
                    butcherid: this.butcher.id,
                    [sequelize_1.Op.and]: [
                        {
                            creationDate: {
                                [sequelize_1.Op.gte]: sdate
                            }
                        },
                        {
                            creationDate: {
                                [sequelize_1.Op.lte]: fdate
                            }
                        }
                    ]
                },
                order: [['id', 'desc']]
            });
            this.res.render("pages/butcher.orders.ejs", this.viewData({
                orders: orders
            }));
        });
    }
    static SetRoutes(router) {
        router.get("/siparislerim", Route.BindRequest(this.prototype.viewRoute));
    }
}
exports.default = Route;
