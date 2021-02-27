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
const router_1 = require("../lib/router");
const common_1 = require("../lib/common");
let ellipsis = require('text-ellipsis');
const resource_1 = require("./resource");
const product_1 = require("../db/models/product");
const productManager_1 = require("../lib/productManager");
const product_2 = require("./api/product");
const config_1 = require("../config");
var MarkdownIt = require('markdown-it');
const _ = require("lodash");
const dispatcher_1 = require("./api/dispatcher");
class Route extends router_1.ViewRouter {
    constructor() {
        super(...arguments);
        this.markdown = new MarkdownIt();
        this.forceSemt = false;
        this.foods = [];
        this.foodsWithCats = {};
        this.foodCategory = "";
        this._ = _;
        this.subCategories = [];
        this.prices = [];
    }
    renderPage(view, viewAsTarif = false) {
        let pageTitle = viewAsTarif ? (this.category.tarifPageTitle || this.category.tarifTitle) : this.category.pageTitle;
        let pageDescription = viewAsTarif ? this.category.tarifPageDesc : this.category.pageDescription;
        let append = (viewAsTarif || this.category.type == 'resource') ? '' : '';
        this.res.render(view, this.viewData({
            pageTitle: (pageTitle || this.category.name + ' Et Lezzetleri') + append,
            pageDescription: pageDescription,
            pageThumbnail: this.req.helper.imgUrl('category-photos', this.category.slug)
        }));
    }
    getFoods(category) {
        return this.foodsWithCats[category.id] || [];
    }
    getPriceData(product) {
        let price = this.prices.find(p => p.pid == product.id);
        if (!price)
            return null;
        let units = ['kg', 'unit1', 'unit2', 'unit3'];
        let usedUnit = null;
        for (let i = 0; i < units.length; i++) {
            let avgPrice = price[`${units[i]}avg`];
            if (avgPrice > 0) {
                usedUnit = units[i];
                break;
            }
        }
        if (usedUnit) {
            return {
                offerCount: price['count'],
                highPrice: Number(price[`${usedUnit}max`].toFixed(2)),
                lowPrice: Number(price[`${usedUnit}min`].toFixed(2)),
                priceUnit: usedUnit == 'kg' ? 'KG' : product[`${usedUnit}title`],
                priceCurrency: "TRY"
            };
        }
        else
            return null;
    }
    generateFoodWithCats(foods) {
        let res = {};
        foods.forEach(f => {
            f.categories.forEach(fc => {
                if (!res[fc.categoryid])
                    res[fc.categoryid] = [];
                res[fc.categoryid].push(f);
            });
        });
        return res;
    }
    fillFoodsAndTarifs(categoryid, subcategory, discardFoodCategory = false) {
        return __awaiter(this, void 0, void 0, function* () {
            if (subcategory) {
                let category = this.req.__categories.find(p => p.slug == subcategory);
                this.products = yield productManager_1.default.getProductsOfCategories([category.id]);
                this.foods = yield new product_2.default(this.constructorParams).getFoodAndTarifResources(this.products, null, (categoryid && !discardFoodCategory) ? [categoryid] : null);
                this.foodsWithCats = this.generateFoodWithCats(this.foods);
            }
            else {
                this.foods = yield new product_2.default(this.constructorParams).getFoodAndTarifResources(null, null, categoryid ? [categoryid] : null);
                this.foodsWithCats = this.generateFoodWithCats(this.foods);
            }
        });
    }
    fillFoods(categoryid, subcategory, discardFoodCategory = false) {
        return __awaiter(this, void 0, void 0, function* () {
            if (subcategory) {
                let category = this.req.__categories.find(p => p.slug == subcategory);
                this.products = yield productManager_1.default.getProductsOfCategories([category.id]);
                this.foods = yield new product_2.default(this.constructorParams).getFoodResources(this.products, null, (categoryid && !discardFoodCategory) ? [categoryid] : null);
                this.foodsWithCats = this.generateFoodWithCats(this.foods);
            }
            else {
                this.foods = yield new product_2.default(this.constructorParams).getFoodResources(null, null, categoryid ? [categoryid] : null);
                this.foodsWithCats = this.generateFoodWithCats(this.foods);
            }
        });
    }
    fillTarifs(categoryid, subcategory, discardFoodCategory = false) {
        return __awaiter(this, void 0, void 0, function* () {
            if (subcategory) {
                let category = this.req.__categories.find(p => p.slug == subcategory);
                this.products = yield productManager_1.default.getProductsOfCategories([category.id]);
                this.foods = yield new product_2.default(this.constructorParams).getTarifResources(this.products, null, (categoryid && !discardFoodCategory) ? [categoryid] : null);
                this.foodsWithCats = this.generateFoodWithCats(this.foods);
            }
            else {
                this.foods = yield new product_2.default(this.constructorParams).getTarifResources(null, null, categoryid ? [categoryid] : null);
                this.foodsWithCats = this.generateFoodWithCats(this.foods);
            }
        });
    }
    foodsAndTarifsRoute() {
        return __awaiter(this, void 0, void 0, function* () {
            this.foodCategory = this.req.query.tab;
            if (this.foodCategory == 'tarifler') {
                yield this.fillTarifs();
            }
            else if (this.foodCategory == 'yemekler') {
                yield this.fillFoods();
            }
            else
                yield this.fillFoodsAndTarifs();
            this.sendView('pages/foods.ejs', {
                pageTitle: 'Et Yemekleri ve Tarifleri'
            });
        });
    }
    viewTarifsRoute() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.req.params.category) {
                this.category = this.req.__categories.find(p => p.slug == this.req.params.category);
                if (!this.category)
                    return this.next();
                //await this.fillTarifs(this.req.params.category)
            }
            else {
                yield this.fillTarifs();
            }
            this.res.render('pages/tarifs.ejs', this.viewData({
                pageTitle: 'Et Yemek Tarifleri'
            }));
        });
    }
    viewAsFoodAndTarifRoute(back = false) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.req.params.category) {
                return this.next();
            }
            this.category = this.req.__categories.find(p => p.slug == this.req.params.category);
            if (!this.category)
                return this.next();
            this.foodCategory = this.req.query.tab;
            if (this.category.type == 'resource') {
                if (this.foodCategory == 'tarifler') {
                    yield this.fillTarifs(this.category.id);
                }
                else if (this.foodCategory == 'yemekler') {
                    yield this.fillFoods(this.category.id);
                }
                else
                    yield this.fillFoodsAndTarifs(this.category.id);
                this.renderPage('pages/category-food.ejs');
            }
            else {
                if (this.foodCategory == 'tarifler') {
                    yield this.fillTarifs(this.category.id, this.category.slug, true);
                }
                else if (this.foodCategory == 'yemekler') {
                    yield this.fillFoods(this.category.id, this.category.slug, true);
                }
                else
                    yield this.fillFoodsAndTarifs(this.category.id, this.category.slug, true);
                this.renderPage('pages/category-sub-food.ejs', true);
            }
        });
    }
    viewProductCategoryRoute(back = false) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.req.params.category) {
                return this.next();
            }
            this.category = this.req.__categories.find(p => p.slug == this.req.params.category);
            if (!this.category)
                return this.next();
            if (this.category.type == 'resource') {
                return this.res.redirect('/et-yemekleri/' + this.category.slug, 301);
                //await this.fillFoods(this.category.id, this.req.params.subcategory);
                //this.renderPage('pages/category-food.ejs')
            }
            else if (this.category.type.startsWith("product")) {
                let parse = this.category.type.split(':');
                let filters = parse[1].split('=');
                let where = {};
                where[filters[0]] = filters[1];
                where['status'] = "onsale";
                this.products = yield product_1.default.findAll({
                    where: where,
                    order: ['tag1']
                });
                this.subCategories = productManager_1.default.generateSubcategories(this.category, this.products);
            }
            else {
                this.products = yield productManager_1.default.getProductsOfCategories([this.category.id]);
                this.subCategories = productManager_1.default.generateSubcategories(this.category, this.products);
                if (this.category.relatedFoodCategory) {
                    this.foods = yield new product_2.default(this.constructorParams).getFoodAndTarifResources(null, null, [this.category.relatedFoodCategory]);
                }
                else if (this.category.tarifTitle) {
                    this.foods = yield new product_2.default(this.constructorParams).getFoodAndTarifResources(this.products, 15);
                }
            }
            let api = new product_2.default(this.constructorParams);
            if (this.req.prefAddr) {
                let dapi = new dispatcher_1.default(this.constructorParams);
                let q = {
                    adr: this.req.prefAddr,
                    excludeCitywide: this.category.slug != 'tum-turkiye',
                };
                let serving = yield dapi.getDispatchers(q);
                this.prices = serving.length ? yield api.getPriceStats(this.products.map(p => p.id), serving.map(b => b.butcherid)) : [];
            }
            else
                this.prices = [];
            this.forceSemt = true;
            this.appUI.title = 'Ürünler';
            this.appUI.tabIndex = 1;
            this.renderPage('pages/category.ejs');
        });
    }
    categoryPhotoRoute() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.req.params.category || !this.req.params.filename)
                return this.next();
            let category = this.req.__categories.find(p => p.slug == this.req.params.category);
            if (!category)
                return this.next();
            let photo, thumbnail = false, url = "";
            let res = new resource_1.default({
                req: this.req,
                res: this.res,
                next: this.next
            });
            let type = "category-photos";
            let defaultFile = "public/img/category-default-thumbnail.jpg";
            if (this.req.params.filename == "thumbnail") {
                thumbnail = true;
                photo = this.req.helper.getResourcesOfType(type + category.id).find(p => p.ref1 == category.id);
            }
            else
                photo = this.req.helper.getResourcesOfType(type + this.req.params.filename).find(p => p.contentUrl == this.req.params.filename);
            res.sendResource(photo, thumbnail, thumbnail ? defaultFile : null);
        });
    }
    static SetRoutes(router) {
        router.get("/:category", Route.BindRequest(Route.prototype.viewProductCategoryRoute));
        router.get("/:category/et-yemekleri", Route.BindRequest(Route.prototype.viewAsFoodAndTarifRoute));
        router.get("/et-yemekleri", Route.BindRequest(Route.prototype.foodsAndTarifsRoute));
        router.get("/et-yemekleri/:category", Route.BindRequest(Route.prototype.viewAsFoodAndTarifRoute));
        // router.get("/et-yemek-tarifleri", Route.BindRequest(Route.prototype.viewTarifsRoute));
        // router.get("/et-yemek-tarifleri/kategori/:category", Route.BindRequest(Route.prototype.viewTarifsRoute));
        //router.get("/et-yemekleri/kategori/:category", Route.BindRequest(Route.prototype.viewFoodsRoute));
        config_1.default.nodeenv == 'development' ? router.get("/:category/resimler/:filename", Route.BindRequest(Route.prototype.categoryPhotoRoute)) : null;
    }
}
__decorate([
    common_1.Auth.Anonymous(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], Route.prototype, "foodsAndTarifsRoute", null);
__decorate([
    common_1.Auth.Anonymous(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], Route.prototype, "viewTarifsRoute", null);
__decorate([
    common_1.Auth.Anonymous(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Boolean]),
    __metadata("design:returntype", Promise)
], Route.prototype, "viewAsFoodAndTarifRoute", null);
__decorate([
    common_1.Auth.Anonymous(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Boolean]),
    __metadata("design:returntype", Promise)
], Route.prototype, "viewProductCategoryRoute", null);
__decorate([
    common_1.Auth.Anonymous(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], Route.prototype, "categoryPhotoRoute", null);
exports.default = Route;
