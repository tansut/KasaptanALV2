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
const router_1 = require("../../lib/router");
const butcher_1 = require("../../db/models/butcher");
const butcherproduct_1 = require("../../db/models/butcherproduct");
const product_1 = require("../../db/models/product");
const sequelize_1 = require("sequelize");
class Route extends router_1.ApiRouter {
    listButcherProducts() {
        return __awaiter(this, void 0, void 0, function* () {
            let where = {};
            if (this.req.body.butcher) {
                where["butcherid"] = this.req.body.butcher;
            }
            if (this.req.body.hasButcherNote) {
                where["fromButcherDesc"] = {
                    [sequelize_1.Op.and]: {
                        [sequelize_1.Op.ne]: '',
                    }
                };
            }
            if (this.req.body.managerApproved == "") {
            }
            else {
                where["managerApproved"] = this.req.body.managerApproved == "false" ? false : true;
            }
            let result = yield butcherproduct_1.default.findAll({
                where: where,
                limit: 500,
                order: [['updatedon', 'desc']],
                include: [
                    {
                        model: product_1.default
                    },
                    {
                        model: butcher_1.default
                    }
                ]
            }).map(b => {
                return {
                    id: b.id,
                    productId: b.productid,
                    productName: b.product.name,
                    toButcherNote: b.product.butcherNote,
                    fromButcherNote: b.fromButcherDesc,
                    customerNote: b.mddesc,
                    customerLongNote: b.longdesc,
                    butcherName: b.butcher.name,
                    butcherSlug: b.butcher.slug,
                    updatedOn: b.updatedOn
                };
            });
            this.res.send(result);
        });
    }
    saveButcherProducts() {
        return __awaiter(this, void 0, void 0, function* () {
            let item = yield butcherproduct_1.default.findByPk(this.req.body.id);
            item.mddesc = this.req.body.customerNote;
            item.longdesc = this.req.body.customerLongNote;
            item.managerApproved = true;
            yield item.save();
            this.res.sendStatus(200);
        });
    }
    listButchers() {
        return __awaiter(this, void 0, void 0, function* () {
            let butchers = yield butcher_1.default.findAll({
                where: {
                    approved: 1
                },
                order: [['name', 'asc']],
                raw: true
            });
            this.res.send(butchers);
        });
    }
    static SetRoutes(router) {
        router.post("/butcherproducts/list", Route.BindRequest(this.prototype.listButcherProducts));
        router.post("/butcherproducts/save", Route.BindRequest(this.prototype.saveButcherProducts));
        router.get("/butchers", Route.BindRequest(this.prototype.listButchers));
    }
}
exports.default = Route;
