"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
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
const product_1 = require("../../db/models/product");
const common_1 = require("../../lib/common");
const resource_1 = require("../../db/models/resource");
const category_1 = require("../../db/models/category");
const productcategory_1 = require("../../db/models/productcategory");
const redirect_1 = require("../../db/models/redirect");
const cache_1 = require("../../lib/cache");
const common_2 = require("../../models/common");
const nutritionvalue_1 = require("../../db/models/nutritionvalue");
const nutritionvalueitem_1 = require("../../db/models/nutritionvalueitem");
class Route extends router_1.ViewRouter {
    constructor() {
        super(...arguments);
        this.nutritionValueUnits = common_2.NutritionValueUnits;
    }
    listViewRoute() {
        return __awaiter(this, void 0, void 0, function* () {
            let data = yield product_1.default.findAll({
                order: ["tag1", "name"],
                include: [{
                        model: productcategory_1.default,
                        include: [category_1.default]
                    }]
            });
            this.res.render('pages/admin/product.list.ejs', this.viewData({ products: data }));
        });
    }
    getResources(product) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield resource_1.default.findAll({
                where: {
                    type: "product-photos",
                    ref1: product.id
                },
                order: [["displayOrder", "DESC"], ["updatedOn", "DESC"]]
            });
        });
    }
    getCategories() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield category_1.default.findAll({
                where: {
                    type: ['reyon', 'list', 'home']
                }
            });
        });
    }
    getProduct(slug) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield product_1.default.findOne({
                include: [{
                        all: true
                    }
                ], where: { slug: slug }
            });
        });
    }
    getProductCategory(categoryid) {
        let productCategory = this.product.categories.find(c => c.categoryid == categoryid);
        return productCategory ? {
            subcategoryid: productCategory.subcategoryid,
            displayOrder: productCategory.displayOrder,
            enabled: true,
            productCategory: productCategory
        } : {
            displayOrder: "",
            enabled: false,
            subcategoryid: ""
        };
    }
    getNutItemAmount(type) {
        let item = this.editingNutritionValue.items.find(o => o.type == type);
        return item ? item.amount : '';
    }
    getNutItemUnit(type) {
        let item = this.editingNutritionValue.items.find(o => o.type == type);
        return item ? item.unit : '';
    }
    loadNutiritionValues() {
        return __awaiter(this, void 0, void 0, function* () {
            let nuts = yield nutritionvalue_1.default.findAll({
                where: {
                    type: "product",
                    ref: this.product.id
                },
                include: [
                    {
                        model: nutritionvalueitem_1.default
                    }
                ],
                order: [['displayOrder', 'desc']]
            });
            if (nuts.length)
                this.editingNutritionValue = nuts[0];
            else {
                this.editingNutritionValue = new nutritionvalue_1.default();
                this.editingNutritionValue.items = [];
            }
        });
    }
    editViewRoute() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.req.params.product) {
                return this.next();
            }
            let product = this.product = yield this.getProduct(this.req.params.product);
            let resources = yield this.getResources(product);
            let categories = yield this.getCategories();
            yield this.loadNutiritionValues();
            this.res.render('pages/admin/product.edit.ejs', this.viewData({ getProductCategory: this.getProductCategory, categories: categories, images: resources, product: product }));
        });
    }
    saveSeoRoute() {
        return __awaiter(this, void 0, void 0, function* () {
        });
    }
    nutritions() {
        let arr = [];
        for (var i in common_2.NutritionValueTitles) {
            arr.push(i);
        }
        let sorted = arr.sort((a, b) => {
            let ap = common_2.NutritionValueOrders[a];
            let bp = common_2.NutritionValueOrders[b];
            return ap - bp;
        });
        return sorted;
    }
    saveRoute() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.req.params.product) {
                return this.next();
            }
            this.product = yield this.getProduct(this.req.params.product);
            let resources = yield this.getResources(this.product);
            let categories = yield this.getCategories();
            let pSlug = this.product.slug;
            yield this.loadNutiritionValues();
            if (this.req.body.save == "true") {
                if (this.req.user.hasRole('admin')) {
                    this.product.slug = this.req.body.slug;
                    this.product.name = this.req.body.name;
                    this.product.tag1 = this.req.body.tag1;
                    this.product.tag2 = this.req.body.tag2;
                    this.product.tag3 = this.req.body.tag3;
                    this.product.keywords = this.req.body.keywords;
                    this.product.shortdesc = this.req.body.description;
                    this.product.notePlaceholder = this.req.body.notePlaceholder;
                    this.product.featuresText = this.req.body.featuresText;
                    this.product.butcherNote = this.req.body.butcherNote;
                    this.product.butcherProductNote = this.req.body.butcherProductNote;
                }
                this.product.mddesc = this.req.body.mddesc;
                if (pSlug != this.product.slug) {
                    let redirToOld = this.req.__redirects['/' + pSlug];
                    let redirToNew = this.req.__redirects['/' + this.product.slug];
                    if (redirToNew)
                        throw new Error(this.product.slug + ' yönlendirmede, eklenemez');
                    if (redirToOld) {
                        let r = yield redirect_1.default.findOne({
                            where: {
                                fromUrl: '/' + pSlug
                            }
                        });
                        r.toUrl = '/' + this.product.slug;
                        r.desc = 'updated for ' + this.product.name;
                        yield r.save();
                    }
                    else {
                        let r = new redirect_1.default({
                            fromUrl: '/' + pSlug,
                            toUrl: '/' + this.product.slug,
                            enabled: true,
                            desc: 'added for ' + this.product.name
                        });
                        yield r.save();
                    }
                }
                yield this.product.save();
            }
            else if (this.req.body.saveseo == "true") {
                this.product.pageTitle = this.req.body.pagetitle;
                this.product.pageDescription = this.req.body.pagedesc;
                yield this.product.save();
            }
            else if (this.req.body.savenut == "true") {
                this.editingNutritionValue.name = this.req.body[`nutname`];
                this.editingNutritionValue.amount = Number.parseInt(this.req.body[`nutamount`]);
                this.editingNutritionValue.unit = this.req.body[`nutunit`];
                this.editingNutritionValue.source = this.req.body[`nutsource`];
                this.editingNutritionValue.sourceUrl = this.req.body[`nutsourceUrl`];
                this.editingNutritionValue.calories = Number.parseInt(this.req.body[`nutcal`]);
                this.editingNutritionValue.description = this.req.body[`nutdesc`];
                this.editingNutritionValue.type = "product";
                this.editingNutritionValue.ref = this.product.id;
                yield this.editingNutritionValue.save();
                yield nutritionvalueitem_1.default.destroy({
                    where: {
                        nutritionid: this.editingNutritionValue.id
                    }
                });
                for (let i = 0; i < this.nutritions().length; i++) {
                    let n = this.nutritions()[i];
                    if (this.req.body[`nutitem${n}`]) {
                        let item = new nutritionvalueitem_1.default();
                        item.nutritionid = this.editingNutritionValue.id;
                        item.amount = parseFloat(this.req.body[`nutitem${n}`]);
                        item.unit = this.req.body[`nutitem${n}unit`];
                        item.type = n;
                        yield item.save();
                    }
                }
                yield this.loadNutiritionValues();
            }
            else if (this.req.body.saveunits == "true" && this.req.user.hasRole('admin')) {
                this.product.unit1 = this.req.body.unit1;
                this.product.unit1desc = this.req.body.unit1desc;
                this.product.unit1note = this.req.body.unit1note;
                this.product.unit1title = this.req.body.unit1title;
                this.product.unit2title = this.req.body.unit2title;
                this.product.unit3title = this.req.body.unit3title;
                this.product.unit1weight = this.req.body.unit1weight;
                this.product.unit2weight = this.req.body.unit2weight;
                this.product.unit3weight = this.req.body.unit3weight;
                this.product.unit2note = this.req.body.unit2note;
                this.product.unit3note = this.req.body.unit3note;
                this.product.unit2 = this.req.body.unit2;
                this.product.unit2desc = this.req.body.unit2desc;
                this.product.unit3 = this.req.body.unit3;
                this.product.unit3desc = this.req.body.unit3desc;
                this.product.unit1kgRatio = parseFloat(this.req.body.unit1kgRatio);
                this.product.unit2kgRatio = parseFloat(this.req.body.unit2kgRatio);
                this.product.unit3kgRatio = parseFloat(this.req.body.unit3kgRatio);
                this.product.unit1def = parseFloat(this.req.body.unit1def);
                this.product.unit2def = parseFloat(this.req.body.unit2def);
                this.product.unit3def = parseFloat(this.req.body.unit3def);
                this.product.unit1min = parseFloat(this.req.body.unit1min);
                this.product.unit2min = parseFloat(this.req.body.unit2min);
                this.product.unit3min = parseFloat(this.req.body.unit3min);
                this.product.unit1max = parseFloat(this.req.body.unit1max);
                this.product.unit2max = parseFloat(this.req.body.unit2max);
                this.product.unit3max = parseFloat(this.req.body.unit3max);
                this.product.unit1step = parseFloat(this.req.body.unit1step);
                this.product.unit2step = parseFloat(this.req.body.unit2step);
                this.product.unit3step = parseFloat(this.req.body.unit3step);
                this.product.unit1perPerson = parseFloat(this.req.body.unit1perPerson);
                this.product.unit2perPerson = parseFloat(this.req.body.unit2perPerson);
                this.product.unit3perPerson = parseFloat(this.req.body.unit3perPerson);
                this.product.unit1Order = parseInt(this.req.body.unit1Order);
                this.product.unit2Order = parseInt(this.req.body.unit2Order);
                this.product.unit3Order = parseInt(this.req.body.unit3Order);
                this.product.unit1WeigthNote = this.req.body.unit1WeigthNote;
                this.product.unit2WeigthNote = this.req.body.unit2WeigthNote;
                this.product.unit3WeigthNote = this.req.body.unit3WeigthNote;
                this.product.unit1ButcherNote = this.req.body.unit1ButcherNote;
                this.product.unit2ButcherNote = this.req.body.unit2ButcherNote;
                this.product.unit3ButcherNote = this.req.body.unit3ButcherNote;
                // this.product.defaultUnit = parseInt(this.req.body.defaultUnit);
                // this.product.defaultAmount = parseFloat(this.req.body.defaultAmount);
                //this.product.perPersonKg = parseFloat(this.req.body.perPersonKg);
                yield this.product.save();
            }
            else if (this.req.body.CopyUnit && this.req.user.hasRole('admin')) {
                let productToCopyId = parseInt(this.req.body['copy' + this.req.body.CopyUnit]);
                let productToCopy = yield product_1.default.findByPk(productToCopyId);
                Object.getOwnPropertyNames(productToCopy["rawAttributes"]).forEach(pn => {
                    if (pn && pn.includes(this.req.body.CopyUnit)) {
                        this.product[pn] = productToCopy[pn];
                    }
                });
                yield this.product.save();
            }
            else if (this.req.body.updatecategory == "true" && this.req.user.hasRole('admin')) {
                let categoryid = parseInt(this.req.body.categoryid);
                //let productCategory = this.getProductCategory(parseInt(this.req.body.categoryid));
                yield productcategory_1.default.destroy({
                    where: {
                        productid: this.product.id,
                        categoryid: categoryid
                    }
                });
                if (this.req.body.categoryenabled == "on") {
                    let newItem = new productcategory_1.default();
                    newItem.productid = this.product.id;
                    newItem.categoryid = categoryid;
                    newItem.displayOrder = (this.req.body.categorydisplayorder ? parseInt(this.req.body.categorydisplayorder) : 0);
                    newItem.subcategoryid = (this.req.body.categorysubcategoryid ? parseInt(this.req.body.categorysubcategoryid) : null);
                    yield newItem.save();
                }
                this.product = yield this.getProduct(this.req.params.product);
            }
            cache_1.CacheManager.clear();
            if (pSlug != this.product.slug) {
                this.res.redirect("/pages/admin/product/" + this.product.slug);
            }
            else
                this.res.render('pages/admin/product.edit.ejs', this.viewData({ categories: categories, images: resources, product: this.product }));
        });
    }
    static SetRoutes(router) {
        router.get("/product/list", Route.BindRequest(Route.prototype.listViewRoute));
        router.get("/product/:product", Route.BindRequest(Route.prototype.editViewRoute));
        router.post("/product/:product", Route.BindRequest(Route.prototype.saveRoute));
        router.post("/product/:product/saveseo", Route.BindRequest(Route.prototype.saveSeoRoute));
    }
}
__decorate([
    common_1.Auth.Anonymous(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], Route.prototype, "listViewRoute", null);
__decorate([
    common_1.Auth.Anonymous(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], Route.prototype, "editViewRoute", null);
__decorate([
    common_1.Auth.Anonymous(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], Route.prototype, "saveRoute", null);
exports.default = Route;
