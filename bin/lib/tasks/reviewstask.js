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
const review_1 = require("../../db/models/review");
const sequelize_1 = require("sequelize");
const product_1 = require("../../db/models/product");
class ButcherStats extends basetask_1.BaseTask {
    get interval() {
        return "0 0 */1 * * *";
    }
    run() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('running reviews job', Date.now());
            let reviews = yield review_1.default.findAll({
                where: {
                    settingsjson: {
                        [sequelize_1.Op.is]: null
                    },
                    type: 'order'
                }
            });
            for (let i = 0; i < reviews.length; i++) {
                let r = reviews[i];
                let products = yield order_1.OrderItem.findAll({
                    where: {
                        orderid: r.ref1,
                        status: order_2.OrderItemStatus.success
                    },
                    include: [{
                            model: product_1.default
                        }]
                }).map((oi) => __awaiter(this, void 0, void 0, function* () { return oi.product; }));
                if (products.length) {
                    r.settings = {
                        products: products.map(p => {
                            return {
                                name: p.name,
                                slug: p.slug,
                                id: p.id
                            };
                        })
                    };
                    yield r.save();
                }
            }
            console.log('done reviews job', Date.now());
        });
    }
}
exports.default = ButcherStats;
