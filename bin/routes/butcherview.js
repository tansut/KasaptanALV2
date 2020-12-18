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
const butcher_1 = require("../db/models/butcher");
const common_1 = require("../lib/common");
const resource_1 = require("./resource");
const Jimp = require('jimp');
const productManager_1 = require("../lib/productManager");
const area_1 = require("../db/models/area");
const productcategory_1 = require("../db/models/productcategory");
var MarkdownIt = require('markdown-it');
const _ = require("lodash");
const config_1 = require("../config");
const review_1 = require("../db/models/review");
const sq = require("sequelize");
const dispatcher_1 = require("./api/dispatcher");
const product_1 = require("./api/product");
const area_2 = require("./api/area");
const ButcherLd_1 = require("../models/ButcherLd");
class Route extends router_1.ViewRouter {
    constructor() {
        super(...arguments);
        this.markdown = new MarkdownIt();
        this.reviews = [];
        this._ = _;
        this.subCategories = [];
        this.logisticsPriceSlice = [];
    }
    filterProductsByCategory(filter, chunk = 0) {
        let products = productManager_1.default.filterProductsByCategory(this.products, filter, { productType: 'generic' }, { chunk: chunk });
        let butcherProducts = this.butcher.products.filter(bp => {
            return (products.find(p => p.id == bp.productid) != null) && !bp['__displayed'];
        });
        butcherProducts.forEach(r => r['__displayed'] = true);
        return butcherProducts;
    }
    loadReviews(butcher) {
        return __awaiter(this, void 0, void 0, function* () {
            let res = yield review_1.default.sequelize.query(`

        SELECT r.* FROM Reviews r
        WHERE :butcherid = ref2
        ORDER BY r.ID DESC

         `, {
                replacements: { butcherid: butcher.id },
                type: sq.QueryTypes.SELECT,
                model: review_1.default,
                mapToModel: true,
                raw: false
            });
            this.reviews = res;
        });
    }
    butcherRoute() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.req.params.butcher) {
                return this.next();
            }
            let butcher = this.butcher = yield butcher_1.default.loadButcherWithProducts(this.req.params.butcher);
            if (!butcher) {
                return this.next();
            }
            yield this.loadReviews(butcher);
            if (!butcher.location && butcher.gpPlace && butcher.gpPlace['geometry'] && butcher.gpPlace['geometry']['location']) {
                let latlong = butcher.gpPlace['geometry']['location'];
                butcher.location = {
                    type: 'Point',
                    coordinates: [parseFloat(latlong.lat), parseFloat(latlong.lng)]
                };
                yield butcher.save();
            }
            let images = yield butcher.loadResources();
            // this.dispatchers = await Dispatcher.findAll({
            //     where: {
            //         butcherId: this.butcher.id,
            //         enabled: true
            //     },
            //     order: [["toarealevel", "DESC"], ["fee", "ASC"]],
            //     include: [
            //         {
            //             all: true
            //         }
            //     ]
            // })
            // for (let i = 0; i < this.dispatchers.length; i++) {
            //     this.dispatchers[i].address = await this.dispatchers[i].toarea.getPreferredAddress()
            // }
            this.categories = [];
            butcher.products = _.sortBy(butcher.products, ["displayOrder", "updatedOn"]).reverse();
            let productCategories = yield productcategory_1.default.findAll({
                include: [{
                        all: true
                    }]
            });
            this.products = butcher.products.map(p => {
                p.product.categories = productCategories.filter(pc => pc.productid == p.productid);
                return p.product;
            });
            this.req.__categories.forEach(c => {
                let products = productManager_1.default.filterProductsByCategory(this.products, { slug: c.slug }, {}, { chunk: 0 });
                if (products.length) {
                    this.categories.push(c);
                }
            });
            if (!this.req.params.category && this.categories.length) {
                this.category = this.categories[0];
            }
            else if (this.req.params.category)
                this.category = this.req.__categories.find(p => p.slug == this.req.params.category);
            if (!this.category) {
                this.category = this.req.__categories[0];
            }
            this.products = productManager_1.default.filterProductsByCategory(this.products, { slug: this.category.slug }, { productType: 'generic' }, { chunk: 0 });
            this.subCategories = productManager_1.default.generateSubcategories(this.category, this.products);
            let pageTitle = butcher.pageTitle || `${butcher.name}`;
            let pageDescription = butcher.pageDescription || `${butcher.name}, ${butcher.address} ${butcher.areaLevel1.name}/${butcher.areaLevel2.name} adresinde hizmet vermekte olup ${(butcher.phone || '').trim().slice(0, -5) + " ..."} numaralı telefon ile ulaşabilirsiniz.`;
            let pageThumbnail = this.req.helper.imgUrl('butcher-google-photos', butcher.slug);
            if (this.req.prefAddr) {
                let dpapi = new dispatcher_1.default(this.constructorParams);
                let dispatchers = yield dpapi.getDispatchers({
                    butcher: this.butcher,
                    adr: this.req.prefAddr,
                    useLevel1: false,
                });
                this.logisticsProvider = dispatchers.length ? dispatchers[0].provider : null;
                if (this.logisticsProvider) {
                    let l3 = yield area_1.default.findByPk(this.req.prefAddr.level3Id);
                    let areaInfo = yield new area_2.default(this.constructorParams).ensureDistance(butcher, l3);
                    let fromTo = {
                        start: this.butcher.location,
                        finish: l3.location,
                        fId: this.req.prefAddr.level3Id.toString(),
                        sId: this.butcher.id.toString()
                    };
                    this.logisticsPriceSlice = yield this.logisticsProvider.priceSlice(fromTo);
                    this.distance = areaInfo ? areaInfo.bestKm : yield this.logisticsProvider.distance(fromTo);
                }
            }
            this.butcherLd = this.butcher.approved ? new ButcherLd_1.ButcherLd(this.butcher) : null;
            this.res.render('pages/butcher', this.viewData({ pageThumbnail: pageThumbnail, pageTitle: pageTitle, pageDescription: pageDescription, butcher: butcher, images: images }));
        });
    }
    butcherProductFeedRoute() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.req.params.butcher) {
                return this.next();
            }
            let butcher = this.butcher = yield butcher_1.default.loadButcherWithProducts(this.req.params.butcher);
            if (!butcher) {
                return this.next();
            }
            this.res.header('Content-Type', 'application/xml');
            //res.header('Content-Encoding', 'gzip');               
            let api = new product_1.default({
                req: this.req,
                res: this.res,
                next: null
            });
            api.getProductsFeedOfButcher(butcher).then(products => {
                try {
                    let feed = api.getProductsFeedXML(products);
                    this.res.send(feed.end({ pretty: config_1.default.nodeenv == "development" }));
                }
                catch (e) {
                    console.error(e);
                    this.res.status(500).end();
                }
            }).catch(e => {
                console.error(e);
                this.res.status(500).end();
            });
        });
    }
    butcherPhotoRoute() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.req.params.butcher || !this.req.params.filename)
                return this.next();
            let butcher = yield butcher_1.default.findOne({
                where: { slug: this.req.params.butcher }
            });
            if (!butcher)
                return this.next();
            let photo, thumbnail = false, url = "";
            let res = new resource_1.default({
                req: this.req,
                res: this.res,
                next: this.next
            });
            let type = "butcher-google-photos";
            let defaultFile = "public/img/butcher-default-thumbnail.jpg";
            if (this.req.params.filename == "thumbnail") {
                thumbnail = true;
                photo = this.req.helper.getResourcesOfType(type + butcher.id).find(p => p.ref1 == butcher.id);
            }
            else
                photo = this.req.helper.getResourcesOfType(type + this.req.params.filename).find(p => p.contentUrl == this.req.params.filename);
            res.sendResource(photo, thumbnail, thumbnail ? defaultFile : null);
        });
    }
    static SetRoutes(router) {
        router.get("/:butcher", Route.BindRequest(Route.prototype.butcherRoute));
        router.get("/:butcher/feed", Route.BindRequest(Route.prototype.butcherProductFeedRoute));
        router.get("/:butcher/:category", Route.BindRequest(Route.prototype.butcherRoute));
        config_1.default.nodeenv == 'development' ? router.get("/:butcher/fotograf/:filename", Route.BindRequest(Route.prototype.butcherPhotoRoute)) : null;
    }
}
__decorate([
    common_1.Auth.Anonymous(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], Route.prototype, "butcherRoute", null);
__decorate([
    common_1.Auth.Anonymous(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], Route.prototype, "butcherProductFeedRoute", null);
__decorate([
    common_1.Auth.Anonymous(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], Route.prototype, "butcherPhotoRoute", null);
exports.default = Route;
