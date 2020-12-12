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
const category_1 = require("../../db/models/category");
const productcategory_1 = require("../../db/models/productcategory");
const helper_1 = require("../helper");
class ButcherStats extends basetask_1.BaseTask {
    get interval() {
        return "0 0 */6 * * *";
    }
    run() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('running popular products job', Date.now());
            let popular = yield category_1.default.findOne({ where: { slug: "populer-etler" } });
            let popularWeek = yield category_1.default.findOne({ where: { slug: "bu-hafta" } });
            if (!popular || !popularWeek)
                return;
            yield productcategory_1.default.destroy({
                where: {
                    categoryid: popular.id
                }
            });
            // await ProductCategory.destroy({
            //     where: {
            //         categoryid: popularWeek.id
            //     } 
            // });
            let numWeeks = -4;
            let startWeek = helper_1.default.Now();
            startWeek.setDate(startWeek.getDate() + numWeeks * 7);
            yield order_1.Order.sequelize.query(`
        
        insert into ProductCategories (displayOrder,                      creationDate,   updatedOn,           productid,        categoryid)
        SELECT count(*) as total, now(), now(), p.id, :popular  FROM OrderItems oi, Products p where oi.creationDate > :start && p.id =oi.productid  group by p.id order by total desc limit 30;
        

        `, {
                replacements: { start: startWeek, popular: popular.id },
                type: sq.QueryTypes.BULKUPDATE,
            });
            // await Order.sequelize.query(`
            // insert into ProductCategories (displayOrder,                      creationDate,   updatedOn,           productid,        categoryid)
            // SELECT count(*) as total, now(), now(), p.id, :popular  FROM OrderItems oi, Products p where oi.creationDate > :start and p.id =oi.productid  group by p.id order by total desc limit 10;
            // `,
            //     {
            //         replacements: { start: startWeek, popular: popularWeek.id},
            //         type: sq.QueryTypes.BULKUPDATE,
            //     });
            console.log('done popular job', Date.now());
        });
    }
}
exports.default = ButcherStats;
