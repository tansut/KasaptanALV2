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
const productManager_1 = require("../lib/productManager");
const product_1 = require("./api/product");
class Route extends router_1.ViewRouter {
    renderPage(view) {
        let pageTitle = this.category.pageTitle;
        let pageDescription = this.category.pageDescription;
        this.res.render(view, this.viewData({
            pageTitle: pageTitle || this.category.name,
            pageDescription: pageDescription,
            pageThumbnail: this.req.helper.imgUrl('category-photos', this.category.category.slug)
        }));
    }
    viewAllRoute() {
        return __awaiter(this, void 0, void 0, function* () {
            this.renderView("pages/reyon-price-view.ejs");
        });
    }
    viewProductCategoryRoute(back = false) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.req.params.category) {
                return this.next();
            }
            this.category = this.req.__pricecategories.find(p => p.slug == this.req.params.category);
            if (!this.category)
                return this.next();
            this.products = yield productManager_1.default.getProductsOfCategories([this.category.categoryid]);
            let api = new product_1.default(this.constructorParams);
            this.prices = yield api.getPriceStats(this.products.map(p => p.id));
            this.renderPage('pages/pricecategory.ejs');
        });
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
    static SetRoutes(router) {
        router.get("/:category", Route.BindRequest(Route.prototype.viewProductCategoryRoute));
        router.get("/et-fiyatlari", Route.BindRequest(Route.prototype.viewAllRoute));
    }
}
__decorate([
    common_1.Auth.Anonymous(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], Route.prototype, "viewAllRoute", null);
__decorate([
    common_1.Auth.Anonymous(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Boolean]),
    __metadata("design:returntype", Promise)
], Route.prototype, "viewProductCategoryRoute", null);
exports.default = Route;
