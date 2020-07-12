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
const sq = require("sequelize");
class ButcherStats extends basetask_1.BaseTask {
    get interval() {
        return "0 0 */8 * * *";
    }
    run() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('running product stats job', Date.now());
            yield order_1.Order.sequelize.query(`
        
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

        `, {
                type: sq.QueryTypes.BULKUPDATE,
            });
            console.log('done product stats job', Date.now());
        });
    }
}
exports.default = ButcherStats;

//# sourceMappingURL=productstats.js.map
