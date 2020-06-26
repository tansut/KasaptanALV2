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
exports.SiteStats = void 0;
const Nexmo = require("nexmo");
const user_1 = require("../db/models/user");
const product_1 = require("../db/models/product");
const area_1 = require("../db/models/area");
const order_1 = require("../db/models/order");
const sq = require("sequelize");
const order_2 = require("../models/order");
class SiteStats {
    static get() {
        return __awaiter(this, void 0, void 0, function* () {
            let os = yield order_1.Order.sequelize.query(`SELECT sum(quantity * pounitkgRatio) as kg, count(*) as total, count(distinct orderid) as totalOrder, count(distinct userid) as totalUser
        FROM OrderItems oi, Orders o 
        where o.id = oi.orderid`, {
                type: sq.QueryTypes.SELECT,
            });
            let osStats = yield order_1.Order.sequelize.query(`SELECT o.status as status, count(*) as total from Orders o group by o.status`, {
                type: sq.QueryTypes.SELECT,
            });
            let success = 0;
            let fail = 0;
            osStats.forEach(stat => {
                if (stat.status == order_2.OrderItemStatus.success)
                    success += stat.total;
                if (stat.status == order_2.OrderItemStatus.butcherCannotShip)
                    fail += stat.total;
            });
            let total = success + fail;
            return {
                customer: yield user_1.default.count(),
                product: yield product_1.default.count(),
                semt: yield area_1.default.count({ where: { status: 'active' } }),
                kg: os[0].kg,
                ship: total <= 0 ? 100 : Math.round(100 * (success / total))
            };
        });
    }
}
exports.SiteStats = SiteStats;

//# sourceMappingURL=sitestats.js.map
