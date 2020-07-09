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
const helper_1 = require("../lib/helper");
const resource_1 = require("../db/models/resource");
const resource_2 = require("./resource");
const Jimp = require('jimp');
const category_1 = require("../db/models/category");
const butcher_1 = require("../db/models/butcher");
const product_2 = require("./api/product");
const dispatcher_1 = require("./api/dispatcher");
const area_1 = require("../db/models/area");
const butcherproduct_1 = require("../db/models/butcherproduct");
const dispatcher_2 = require("../db/models/dispatcher");
var MarkdownIt = require('markdown-it');
const _ = require("lodash");
const shopcard_1 = require("../models/shopcard");
const config_1 = require("../config");
const sequelize_1 = require("sequelize");
const productcategory_1 = require("../db/models/productcategory");
const commissionHelper_1 = require("../lib/commissionHelper");
class Route extends router_1.ViewRouter {
    constructor() {
        super(...arguments);
        this.butcherProducts = [];
        this.markdown = new MarkdownIt();
        this.foods = [];
        this.butcherResources = [];
        this.reviews = [];
        this.shopCardIndex = -1;
        this.shopCardItem = null;
        this.dispatchingAvailable = true;
        this.productTypeManager = null;
    }
    get ProductTypeManager() {
        let params = {
            product: this.product
        };
        if (this.shopCardItem && this.shopCardItem.productTypeData) {
            params = Object.assign(Object.assign({}, params), this.shopCardItem.productTypeData);
        }
        let result = this.productTypeManager || (this.productTypeManager = common_1.ProductTypeFactory.create(this.product.productType, params));
        return result;
    }
    tryBestFromShopcard(serving, others = []) {
        return __awaiter(this, void 0, void 0, function* () {
            let shopcard = yield shopcard_1.ShopCard.createFromRequest(this.req);
            let scButcher = (shopcard.items && shopcard.items.length) ? shopcard.items[0].product.butcher.id : null;
            if (scButcher) {
                let inServing = serving.find(p => p.butcherid == scButcher);
                let inOther = others.find(p => p.butcherid == scButcher);
                return inServing || inOther;
            }
            else
                return null;
        });
    }
    tryBestFromOrders(serving) {
        return __awaiter(this, void 0, void 0, function* () {
            let fullServing = serving.filter(s => s.selection == dispatcher_2.DispatcherSelection.full);
            if (fullServing.length == 0)
                fullServing = serving;
            fullServing.forEach(s => s.lastorderitemid = s.lastorderitemid || 0);
            let orderedByDate = _.orderBy(fullServing, 'lastorderitemid', 'asc');
            let orderedByKasapCard = _.orderBy(orderedByDate, 'butcher.enablePuan', 'desc');
            return orderedByKasapCard.length ? orderedByKasapCard[0] : null;
        });
    }
    tryBestAsRandom(serving) {
        let fullServing = serving.filter(s => s.selection == dispatcher_2.DispatcherSelection.full);
        if (fullServing.length == 0)
            fullServing = serving;
        let res = (fullServing.length > 0 ? fullServing[0] : null);
        return res;
    }
    useL1(product) {
        return (product.productType == product_1.ProductType.adak || product.productType == product_1.ProductType.kurban);
    }
    bestButchersForProduct(product, adr, userBest) {
        return __awaiter(this, void 0, void 0, function* () {
            let api = new dispatcher_1.default(this.constructorParams);
            let serving = yield api.getButchersSelingAndDispatches(adr, product, this.useL1(product));
            let takeOnly = serving.filter(p => p.takeOnly == true);
            let servingL3 = serving.filter(p => p.toarealevel == 3 && !p.takeOnly);
            let servingL2 = serving.filter(p => p.toarealevel == 2 && !p.takeOnly && (servingL3.find(m => m.butcher.id == p.butcher.id) == null));
            let servingL1 = serving.filter(p => p.toarealevel == 1 && !p.takeOnly && (servingL2.find(m => m.butcher.id == p.butcher.id) == null) && (servingL3.find(m => m.butcher.id == p.butcher.id) == null));
            takeOnly = helper_1.default.shuffle(takeOnly);
            servingL3 = helper_1.default.shuffle(servingL3);
            servingL2 = helper_1.default.shuffle(servingL2);
            servingL1 = helper_1.default.shuffle(servingL1);
            let mybest = (yield this.tryBestFromShopcard(serving)) ||
                (yield this.tryBestFromOrders(servingL3)) ||
                (yield this.tryBestFromOrders(servingL2)) ||
                (yield this.tryBestFromOrders(servingL1)) ||
                this.tryBestAsRandom(serving);
            if (mybest) {
                mybest = (userBest ? (serving.find(s => s.butcherid == userBest.id)) : null) || mybest;
            }
            return {
                best: mybest,
                servingL1: servingL1,
                servingL2: servingL2,
                servingL3: servingL3,
                takeOnly: takeOnly
            };
        });
    }
    productRoute() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.req.params.product) {
                return this.next();
            }
            let product = yield product_1.default.findOne({
                include: [{
                        model: productcategory_1.default,
                        include: [category_1.default]
                    }
                ], where: { slug: this.req.params.product }
            });
            if (!product)
                return this.next();
            this.product = product;
            let api = new product_2.default(this.constructorParams);
            yield product.loadResources();
            this.reviews = yield api.loadReviews(product.id);
            let shopcard = yield shopcard_1.ShopCard.createFromRequest(this.req);
            this.shopCardIndex = this.req.query.shopcarditem ? parseInt(this.req.query.shopcarditem) : -1;
            this.shopCardItem = (this.shopCardIndex >= 0 && shopcard.items) ? shopcard.items[this.shopCardIndex] : null;
            let butcher = this.shopCardItem ? yield butcher_1.default.getBySlug(this.shopCardItem.product.butcher.slug) : (this.req.query.butcher ? yield butcher_1.default.getBySlug(this.req.query.butcher) : null);
            this.foods = yield api.getTarifVideos([product]);
            if (this.req.query.semt) {
                let l3 = yield area_1.default.getBySlug(this.req.query.semt);
                if (l3 && l3.level == 3) {
                    yield this.req.helper.setPreferredAddress({
                        level3Id: l3.id
                    }, true);
                }
            }
            let selectedButchers;
            if (!this.req.prefAddr) {
                selectedButchers = {
                    best: null,
                    servingL1: [],
                    servingL2: [],
                    servingL3: [],
                    takeOnly: []
                };
            }
            else
                selectedButchers = yield this.bestButchersForProduct(product, this.req.prefAddr, butcher);
            let serving = selectedButchers.servingL3.concat(selectedButchers.servingL2).concat(selectedButchers.servingL1).concat(selectedButchers.takeOnly);
            if (selectedButchers.best && this.req.query.butcher && (selectedButchers.best.butcher.slug != this.req.query.butcher)) {
                serving = [];
                selectedButchers.best = null;
            }
            let view = yield api.getProductView(product, selectedButchers.best ? selectedButchers.best.butcher : null, null, true);
            serving.forEach(s => {
                let butcher = s instanceof dispatcher_2.default ? s.butcher : s;
                let dispatcher = s instanceof dispatcher_2.default ? s : null;
                if (view.butcher && (butcher.id != view.butcher.id)) {
                    let bp = butcher.products.find(bp => bp.productid == product.id);
                    view.alternateButchers.push({
                        butcher: {
                            id: butcher.id,
                            enableCreditCard: butcher.enableCreditCard,
                            slug: butcher.slug,
                            badges: butcher.getBadgeList(),
                            userRatingAsPerc: butcher.userRatingAsPerc,
                            shipRatingAsPerc: butcher.shipRatingAsPerc,
                            name: butcher.name,
                            puanData: butcher.getPuanData(this.product.productType),
                            earnedPuan: 0.00,
                            kgPrice: bp ? bp.kgPrice : 0,
                            productNote: bp ? (bp.mddesc ? this.markdown.render(bp.mddesc) : "") : "",
                            thumbnail: this.req.helper.imgUrl("butcher-google-photos", butcher.slug)
                        },
                        dispatcher: dispatcher ? {
                            id: dispatcher.id,
                            fee: dispatcher.fee,
                            min: dispatcher.min,
                            totalForFree: dispatcher.totalForFree,
                            type: dispatcher.type,
                            priceInfo: dispatcher.priceInfo,
                            userNote: dispatcher.userNote,
                            takeOnly: dispatcher.takeOnly
                        } : null,
                        purchaseOptions: api.getPurchaseOptions(product, bp).map(po => {
                            return {
                                unit: po.unit,
                                unitTitle: po.unitTitle,
                                unitPrice: po.unitPrice
                            };
                        })
                    });
                }
                else if (view.butcher && view.butcher.id == s.butcher.id) {
                    view.dispatcher = dispatcher ? {
                        id: dispatcher.id,
                        fee: dispatcher.fee,
                        min: dispatcher.min,
                        totalForFree: dispatcher.totalForFree,
                        type: dispatcher.type,
                        priceInfo: dispatcher.priceInfo,
                        userNote: dispatcher.userNote,
                        takeOnly: dispatcher.takeOnly
                    } : null;
                }
            });
            if (view.butcher) {
                let calculator = new commissionHelper_1.PuanCalculator();
                view.butcher.earnedPuan = this.req.user ? yield calculator.getEarnedButcherPuan(this.req.user.id, view.butcher.id) : 0.00;
                this.butcherProducts = yield butcherproduct_1.default.findAll({
                    where: {
                        butcherid: view.butcher.id,
                        vitrin: true,
                        [sequelize_1.Op.or]: [
                            {
                                kgPrice: {
                                    [sequelize_1.Op.gt]: 0
                                }
                            },
                            {
                                unit1price: {
                                    gt: 0.0
                                }
                            },
                            {
                                unit2price: {
                                    [sequelize_1.Op.gt]: 0.0
                                }
                            },
                            {
                                unit3price: {
                                    [sequelize_1.Op.gt]: 0.0
                                }
                            }
                        ]
                    },
                    include: [
                        {
                            model: product_1.default
                        }
                    ]
                });
            }
            if (view.butcher) {
                this.butcherResources = yield resource_1.default.findAll({
                    where: {
                        type: ["butcher-google-photos", "butcher-videos"],
                        ref1: view.butcher.id,
                        list: true
                    },
                    order: [["displayOrder", "DESC"], ["updatedOn", "DESC"]]
                });
            }
            this.productLd = product.reviewCount > 0 ? yield api.getProductLd(product) : null;
            this.dispatchingAvailable = this.req.prefAddr && (view.butcher != null || (yield new dispatcher_1.default(this.constructorParams).dispatchingAvailable(this.req.prefAddr, this.useL1(this.product))));
            this.res.render('pages/product', this.viewData({
                butcherProducts: this.butcherProducts.map(p => p.product), butchers: selectedButchers,
                pageTitle: product.name + ' Siparişi ve Fiyatları',
                // pageDescription: product.pageDescription + ' ', 
                pageThumbnail: this.req.helper.imgUrl('product-photos', product.slug),
                pageDescription: product.generatedDesc,
                product: product, view: view,
                __supportMessage: `${`Merhaba, kasaptanal.com üzerinden size ulaşıyorum. ${product.name} ile ilgili whatsapp üzerinden yardımcı olabilir misiniz?`}`
            }));
        });
    }
    productPhotoRoute() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.req.params.product || !this.req.params.filename)
                return this.next();
            let product = this.req.__products[this.req.params.product];
            if (!product)
                return this.next();
            let photo, thumbnail = false, url = "";
            let res = new resource_2.default(this.constructorParams);
            let type = "product-photos";
            let defaultFile = "public/img/product-default-thumbnail.jpg";
            if (this.req.params.filename == "thumbnail") {
                thumbnail = true;
                photo = this.req.helper.getResourcesOfType(type + product.id).find(p => p.ref1 == product.id);
            }
            else
                photo = this.req.helper.getResourcesOfType(type + this.req.params.filename).find(p => p.contentUrl == this.req.params.filename);
            res.sendResource(photo, thumbnail, thumbnail ? defaultFile : null);
        });
    }
    static SetRoutes(router) {
        router.get("/:product", Route.BindRequest(Route.prototype.productRoute));
        // router.get("/:product/yemek-tarifi/:tarif", Route.BindRequest(Route.prototype.productRoute));
        // router.get("/:product/ile-yapin/:tarif", Route.BindRequest(Route.prototype.productRoute));
        //router.get("/:product", Route.BindRequest(Route.prototype.productRoute));
        config_1.default.nodeenv == 'development' ? router.get("/:product/resimler/:filename", Route.BindRequest(Route.prototype.productPhotoRoute)) : null;
    }
}
__decorate([
    common_1.Auth.Anonymous(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], Route.prototype, "productRoute", null);
__decorate([
    common_1.Auth.Anonymous(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], Route.prototype, "productPhotoRoute", null);
exports.default = Route;
