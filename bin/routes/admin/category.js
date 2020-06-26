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
const category_1 = require("../../db/models/category");
const productManager_1 = require("../../lib/productManager");
class Route extends router_1.ViewRouter {
    listViewRoute() {
        return __awaiter(this, void 0, void 0, function* () {
            let data = yield category_1.default.findAll({
                order: ["name", "type"]
            });
            this.res.render('pages/admin/category.list.ejs', this.viewData({ categories: data }));
        });
    }
    saveProductViewRoute() {
        return __awaiter(this, void 0, void 0, function* () {
            let category = yield category_1.default.findOne({
                where: {
                    slug: this.req.params.category
                }
            });
            let products = yield productManager_1.default.getProductsOfCategories([category.id]);
            let product = products.find(p => p.id == parseInt(this.req.body.productid));
            let pcategory = product.categories.find(p => p.categoryid == category.id);
            if (this.req.body.op == 'update') {
                pcategory.displayOrder = parseInt(this.req.body.displayorder);
                yield pcategory.save();
            }
            else {
                yield pcategory.destroy();
            }
            products = yield productManager_1.default.getProductsOfCategories([category.id]);
            this.res.render('pages/admin/category.productlist.ejs', this.viewData({ category: category, products: products }));
        });
    }
    productViewRoute() {
        return __awaiter(this, void 0, void 0, function* () {
            let category = yield category_1.default.findOne({
                where: {
                    slug: this.req.params.category
                }
            });
            let products = yield productManager_1.default.getProductsOfCategories([category.id]);
            this.res.render('pages/admin/category.productlist.ejs', this.viewData({ category: category, products: products }));
        });
    }
    static SetRoutes(router) {
        router.get("/category/list", Route.BindRequest(Route.prototype.listViewRoute));
        router.get("/category/:category/products", Route.BindRequest(Route.prototype.productViewRoute));
        router.post("/category/:category/products", Route.BindRequest(Route.prototype.saveProductViewRoute));
    }
}
exports.default = Route;
