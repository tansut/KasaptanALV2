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
const product_1 = require("../db/models/product");
const common_1 = require("../lib/common");
const Jimp = require('jimp');
const category_1 = require("../db/models/category");
const productcategory_1 = require("../db/models/productcategory");
const productManager_1 = require("../lib/productManager");
let ellipsis = require('text-ellipsis');
class Route extends router_1.ViewRouter {
    constructor() {
        super(...arguments);
        this.browseTypes = {
            reyon: 'Reyonlar',
            list: 'Listeler'
        };
    }
    filterProductsByCategory(slug, chunk = 0) {
        let products = productManager_1.default.filterProductsByCategory(this.products, { slug: slug }, { productType: 'generic' }, { chunk: chunk });
        return products;
    }
    filterCategories(type) {
        return productManager_1.default.filterCategories(this.categories, { type: type });
    }
    fillProducts(categories) {
        return __awaiter(this, void 0, void 0, function* () {
            let cacheproducts = null; // this.dataCache.get("products")
            if (!cacheproducts) {
                let products = yield product_1.default.findAll({
                    order: ["displayOrder"],
                    where: {
                        productType: 'generic'
                    },
                    include: [{
                            model: productcategory_1.default,
                            include: [category_1.default]
                        },
                    ],
                });
                let productsByCategory = {};
                categories.map(p => {
                    let prods = productManager_1.default.filterProductsByCategory(products, {
                        slug: p.slug
                    });
                    productsByCategory[p.slug] = prods; // .map(p => p.toJSON())
                });
                cacheproducts = {
                    all: products,
                    byCategory: productsByCategory
                };
                //this.dataCache.set("products", cacheproducts);
            }
            return cacheproducts;
        });
    }
    productsView() {
        return __awaiter(this, void 0, void 0, function* () {
            //this.products = await ProductManager.getProducts();
            //((this.categories = await ProductManager.getCategories();
            //((this.res.render('pages/all-products.ejs', this.viewData({ ellipsis: ellipsis, products: this.products }))
        });
    }
    reyonView() {
        return __awaiter(this, void 0, void 0, function* () {
            // this.products =  await ProductManager.getProducts();
            // this.categories = this.req.__categories;
            this.products = yield this.fillProducts(this.req.__categories);
            this.sendView('pages/reyon-view.ejs', { ellipsis: ellipsis, products: this.products });
        });
    }
    redirectedReyon() {
        return __awaiter(this, void 0, void 0, function* () {
            this.res.redirect('/kasap-urunleri', 301);
        });
    }
    static SetRoutes(router) {
        //router.get("/tum-lezzetler", Route.BindRequest(Route.prototype.productsView));
        router.get("/lezzetler", Route.BindRequest(Route.prototype.redirectedReyon));
        router.get("/kasap-urunleri", Route.BindRequest(Route.prototype.reyonView));
    }
}
__decorate([
    common_1.Auth.Anonymous(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], Route.prototype, "productsView", null);
__decorate([
    common_1.Auth.Anonymous(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], Route.prototype, "reyonView", null);
__decorate([
    common_1.Auth.Anonymous(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], Route.prototype, "redirectedReyon", null);
exports.default = Route;

//# sourceMappingURL=product.list.js.map
