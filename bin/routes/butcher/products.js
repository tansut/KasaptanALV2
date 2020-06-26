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
const butcherproduct_1 = require("../../db/models/butcherproduct");
const product_1 = require("../../db/models/product");
const home_1 = require("./home");
const _ = require("lodash");
const helper_1 = require("../../lib/helper");
const context_1 = require("../../db/context");
const butcherpricehistory_1 = require("../../db/models/butcherpricehistory");
class Route extends home_1.ButcherRouter {
    constructor() {
        super(...arguments);
        this.sellingProducts = [];
        this.otherProducts = [];
        this._ = _;
    }
    getProducts() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield product_1.default.findAll({
                include: [{
                        all: true
                    }
                ],
                order: ["Tag1", "Name"],
                where: {}
            });
        });
    }
    getProductUnits(product, bp) {
        let result = [];
        (product.unit1 && product.unit1 != "") ? result.push({
            unit: product.unit1,
            unitTitle: product.unit1title,
            unitWeight: product.unit1weight,
            kgRatio: product.unit1kgRatio,
            desc: product.unit1desc,
            enabled: bp.unit1enabled,
            butcherNote: product.unit1ButcherNote,
            butcherUnitWeight: bp.unit1weight,
            butcherkgRatio: bp.unit1kgRatio,
            price: helper_1.default.asCurrency(bp.unit1price > 0 ? bp.unit1price : product.unit1kgRatio * bp.kgPrice)
        }) : null;
        (product.unit2 && product.unit2 != "") ? result.push({
            unit: product.unit2,
            unitTitle: product.unit2title,
            unitWeight: product.unit2weight,
            kgRatio: product.unit2kgRatio,
            butcherUnitWeight: bp.unit2weight,
            butcherkgRatio: bp.unit2kgRatio,
            desc: product.unit2desc,
            enabled: bp.unit2enabled,
            butcherNote: product.unit2ButcherNote,
            price: helper_1.default.asCurrency(bp.unit2price > 0 ? bp.unit2price : product.unit2kgRatio * bp.kgPrice)
        }) : null;
        (product.unit3 && product.unit3 != "") ? result.push({
            unit: product.unit3,
            unitTitle: product.unit3title,
            unitWeight: product.unit3weight,
            butcherUnitWeight: bp.unit3weight,
            butcherkgRatio: bp.unit3kgRatio,
            kgRatio: product.unit3kgRatio,
            desc: product.unit3desc,
            enabled: bp.unit3enabled,
            butcherNote: product.unit3ButcherNote,
            price: helper_1.default.asCurrency(bp.unit3price > 0 ? bp.unit3price : product.unit3kgRatio * bp.kgPrice)
        }) : null;
        return result;
    }
    getButcherProductInfo(butcherProduct, product = null) {
        //let butcherProduct = this.butcher.products.find(c => c.productid == productid)
        return butcherProduct ? {
            displayOrder: butcherProduct.displayOrder,
            enabled: butcherProduct.enabled,
            bp: butcherProduct,
            product: product || butcherProduct.product,
            unit1price: butcherProduct.unit1price,
            unit2price: butcherProduct.unit2price,
            unit3price: butcherProduct.unit3price,
            unit1enabled: butcherProduct.unit1enabled,
            unit2enabled: butcherProduct.unit2enabled,
            unit3enabled: butcherProduct.unit3enabled,
            unit1kgRatio: butcherProduct.unit1kgRatio,
            unit2kgRatio: butcherProduct.unit2kgRatio,
            unit3kgRatio: butcherProduct.unit3kgRatio,
            unit1weight: butcherProduct.unit1weight,
            unit2weight: butcherProduct.unit2weight,
            unit3weight: butcherProduct.unit3weight,
            vitrin: butcherProduct.vitrin,
            kgPrice: butcherProduct.kgPrice,
            mddesc: butcherProduct.mddesc
        } : {
            displayOrder: "",
            enabled: false,
            unit1price: 0,
            unit2price: 0,
            unit3price: 0,
            unit1enabled: true,
            unit2enabled: true,
            unit3enabled: true,
            vitrin: false,
            kgPrice: 0,
            unit1kgRatio: 0,
            unit2kgRatio: 0,
            unit3kgRatio: 0,
            unit1weight: '',
            unit2weight: '',
            unit3weight: '',
            mddesc: "",
            product: product
        };
    }
    setProducts() {
        return __awaiter(this, void 0, void 0, function* () {
            let selling = this.butcher.products.filter(p => {
                return p.enabled;
            });
            selling = _.sortBy(selling, ["displayOrder"]).reverse();
            let allproducts = yield this.getProducts();
            let others = allproducts.filter(p => {
                let bp = this.butcher.products.find(bp => {
                    return bp.enabled == true && bp.productid == p.id;
                });
                return !bp;
            });
            others = _.sortBy(others, ["displayOrder"]).reverse();
            this.sellingProducts = selling.map(p => this.getButcherProductInfo(p));
            this.otherProducts = others.map(p => this.getButcherProductInfo(null, p));
        });
    }
    manageHistory(rec, t) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!rec.enabled)
                return;
            let existing = yield butcherpricehistory_1.default.findOne({
                where: {
                    butcherid: rec.butcherid,
                    productid: rec.productid,
                },
                order: [['id', 'desc']],
            });
            if (existing) {
                if (existing.unit1price == rec.unit1price &&
                    existing.unit2price == rec.unit2price &&
                    existing.unit3price == rec.unit3price &&
                    existing.unit4price == rec.unit4price &&
                    existing.unit5price == rec.unit5price &&
                    existing.kgPrice == rec.kgPrice)
                    return;
            }
            let newItem = new butcherpricehistory_1.default();
            newItem.unit1price = rec.unit1price;
            newItem.unit2price = rec.unit2price;
            newItem.unit3price = rec.unit3price;
            newItem.unit4price = rec.unit4price;
            newItem.unit5price = rec.unit5price;
            newItem.kgPrice = rec.kgPrice;
            newItem.productid = rec.productid;
            newItem.butcherid = rec.butcherid;
            return newItem.save({
                transaction: t
            });
        });
    }
    saveProductRoute() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.setButcher();
            let productid = parseInt(this.req.body.productid);
            let newItem = yield butcherproduct_1.default.findOne({
                where: {
                    butcherid: this.butcher.id,
                    productid: productid
                }
            });
            if (newItem == null)
                newItem = new butcherproduct_1.default();
            newItem.enabled = this.req.body.productenabled == "on";
            newItem.vitrin = this.req.body.productvitrin == "on";
            newItem.butcherid = this.butcher.id;
            newItem.productid = productid;
            newItem.displayOrder = (this.req.body.productdisplayorder ? parseInt(this.req.body.productdisplayorder) : newItem.displayOrder);
            newItem.unit1price = this.req.body.unit1price ? parseFloat(this.req.body.unit1price) : 0;
            newItem.unit2price = this.req.body.unit2price ? parseFloat(this.req.body.unit2price) : 0;
            newItem.unit3price = this.req.body.unit3price ? parseFloat(this.req.body.unit3price) : 0;
            newItem.kgPrice = this.req.body.productkgPrice ? parseFloat(this.req.body.productkgPrice) : 0;
            newItem.mddesc = this.req.body.productmddesc;
            newItem.unit1enabled = this.req.body.unit1enabled == "on";
            newItem.unit2enabled = this.req.body.unit2enabled == "on";
            newItem.unit3enabled = this.req.body.unit3enabled == "on";
            newItem.unit1kgRatio = this.req.body.unit1butcherkgRatio ? parseFloat(this.req.body.unit1butcherkgRatio) : 0;
            newItem.unit2kgRatio = this.req.body.unit2butcherkgRatio ? parseFloat(this.req.body.unit2butcherkgRatio) : 0;
            newItem.unit3kgRatio = this.req.body.unit3butcherkgRatio ? parseFloat(this.req.body.unit3butcherkgRatio) : 0;
            newItem.unit1weight = this.req.body.unit1butcherunitWeight;
            newItem.unit2weight = this.req.body.unit2butcherunitWeight;
            newItem.unit3weight = this.req.body.unit3butcherunitWeight;
            if (newItem.enabled && (!(helper_1.default.nvl(newItem.kgPrice) || helper_1.default.nvl(newItem.unit1price) || helper_1.default.nvl(newItem.unit2price) || helper_1.default.nvl(newItem.unit3price)) ||
                !(newItem.unit1enabled || newItem.unit2enabled || newItem.unit3enabled))) {
                this.goto = "p" + productid.toString();
                yield this.setProducts();
                this.res.render("pages/butcher.products.ejs", this.viewData({
                    _usrmsg: {
                        text: "Geçerli satış değerleri girmeden ürün satılamaz",
                        type: 'danger'
                    }
                }));
            }
            else {
                yield context_1.default.getContext().transaction((t) => {
                    return newItem.save({
                        transaction: t
                    }).then(() => this.manageHistory(newItem, t));
                });
                yield this.setButcher();
                yield this.setProducts();
                this.goto = "p" + productid.toString();
                this.res.render("pages/butcher.products.ejs", this.viewData({}));
            }
        });
    }
    viewListRoute() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.setButcher();
            yield this.setProducts();
            // (p.kgPrice > 0 || p.unit1price > 0 || p.unit2price > 0 || p.unit3price > 0)
            this.res.render("pages/butcher.product-list.ejs", this.viewData({}));
        });
    }
    viewRoute() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.setButcher();
            yield this.setProducts();
            // (p.kgPrice > 0 || p.unit1price > 0 || p.unit2price > 0 || p.unit3price > 0)
            this.res.render("pages/butcher.products.ejs", this.viewData({}));
        });
    }
    static SetRoutes(router) {
        router.get("/urunler", Route.BindRequest(this.prototype.viewRoute));
        router.get("/urun-listesi", Route.BindRequest(this.prototype.viewListRoute));
        router.get("/product/save", Route.BindRequest(this.prototype.viewRoute));
        router.post("/product/save", Route.BindRequest(this.prototype.saveProductRoute));
    }
}
exports.default = Route;
