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
const common_1 = require("../../lib/common");
const router_1 = require("../../lib/router");
const product_1 = require("../../db/models/product");
const butcherproduct_1 = require("../../db/models/butcherproduct");
const helper_1 = require("../../lib/helper");
var MarkdownIt = require('markdown-it');
const sq = require("sequelize");
const builder = require("xmlbuilder");
const _ = require("lodash");
const resource_1 = require("../../db/models/resource");
const resourcecategory_1 = require("../../db/models/resourcecategory");
const category_1 = require("../../db/models/category");
const sequelize_1 = require("sequelize");
const ProductLd_1 = require("../../models/ProductLd");
const review_1 = require("../../db/models/review");
class Route extends router_1.ApiRouter {
    constructor() {
        super(...arguments);
        this.markdown = new MarkdownIt();
    }
    getFoodResources(products4, limit, catids, options = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.getResources({
                list: true,
                type: ['product-videos', 'product-photos'],
                tag1: {
                    [sequelize_1.Op.like]: '%yemek%',
                }
            }, products4, limit, catids, options);
        });
    }
    loadReviews(productid, butcherid) {
        return __awaiter(this, void 0, void 0, function* () {
            let res = yield review_1.default.sequelize.query(`
        SELECT r.* FROM Reviews r, Orders o, OrderItems oi 
        WHERE r.type='order'  and r.ref1=o.id and oi.orderid = o.id and oi.productid=:pid
        and (:butcherid = 0 || :butcherid = ref2)
        ORDER BY r.ID DESC
        `, {
                replacements: { butcherid: butcherid, pid: productid },
                type: sq.QueryTypes.SELECT,
                model: review_1.default,
                mapToModel: true,
                raw: false
            });
            return res;
        });
    }
    getTarifResources(products4, limit, catids, options = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.getResources({
                list: true,
                type: ['product-videos', 'product-photos'],
                tag1: {
                    [sequelize_1.Op.like]: '%tarif%',
                }
            }, products4, limit, catids, options);
        });
    }
    getFoodAndTarifResources(products4, limit, catids, options = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.getResources({
                type: ['product-videos', 'product-photos'],
                list: true,
                tag1: {
                    [sequelize_1.Op.or]: [{
                            [sequelize_1.Op.like]: '%yemek%'
                        }, { [sequelize_1.Op.like]: '%tarif%' }]
                }
            }, products4, limit, catids, options);
        });
    }
    getResources(where, products4, limit, catids, options = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            if (products4) {
                let ids = products4.map(p => p.id);
                where = Object.assign({
                    [sequelize_1.Op.or]: {
                        ref1: ids,
                        ref2: ids,
                        ref3: ids,
                        ref4: ids,
                        ref5: ids,
                        ref6: ids,
                    }
                }, where);
            }
            if (catids)
                where['$categories.category.id$'] = catids;
            let params = {
                where: where,
                raw: options.raw,
                include: [{
                        model: resourcecategory_1.default,
                        as: 'categories',
                        include: [{
                                model: category_1.default
                            },
                        ]
                    }],
                order: [[{ model: resourcecategory_1.default, as: 'categories' }, "displayOrder", "desc"], ["displayOrder", "desc"], ["updatedOn", "desc"]]
            };
            if (limit)
                params['limit'] = limit;
            let allresources = yield resource_1.default.findAll(params);
            let products = products4 || (yield product_1.default.findAll({
                where: {
                    id: allresources.map(p => p.ref1).concat(allresources.filter(p => p.ref2).map(p => p.ref2)).concat(allresources.filter(p => p.ref3).map(p => p.ref3)).concat(allresources.filter(p => p.ref4).map(p => p.ref4)).concat(allresources.filter(p => p.ref5).map(p => p.ref5)).concat(allresources.filter(p => p.ref6).map(p => p.ref6))
                }
            }));
            let resources = [];
            allresources.forEach(res => {
                let product1 = products.find(prod => prod.id == res.ref1);
                let product2 = res.ref2 ? products.find(prod => prod.id == res.ref2) : null;
                let product3 = res.ref3 ? products.find(prod => prod.id == res.ref3) : null;
                let product4 = res.ref4 ? products.find(prod => prod.id == res.ref4) : null;
                let product5 = res.ref5 ? products.find(prod => prod.id == res.ref5) : null;
                let product6 = res.ref6 ? products.find(prod => prod.id == res.ref6) : null;
                if (product1) {
                    res.product = product1;
                    resources.push(res);
                }
                if (product2) {
                    res.otherProducts = res.otherProducts || [];
                    res.otherProducts.push(product2);
                }
                if (product3) {
                    res.otherProducts = res.otherProducts || [];
                    res.otherProducts.push(product3);
                }
                if (product4) {
                    res.otherProducts = res.otherProducts || [];
                    res.otherProducts.push(product4);
                }
                if (product5) {
                    res.otherProducts = res.otherProducts || [];
                    res.otherProducts.push(product5);
                }
                if (product6) {
                    res.otherProducts = res.otherProducts || [];
                    res.otherProducts.push(product6);
                }
            });
            return resources;
        });
    }
    static getResourcesOfCategories(catids) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield resource_1.default.findAll({
                include: [{
                        model: resourcecategory_1.default,
                        as: 'categories',
                        include: [{
                                model: category_1.default
                            }
                        ]
                    },
                ], where: {
                    '$categories.category.id$': catids
                },
                order: [[{ model: resourcecategory_1.default, as: 'categories' }, "displayOrder", "desc"], ["displayorder", "desc"]]
            });
        });
    }
    getTarifVideos(products4, limit, catids, options = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.getResources({
                type: 'product-videos',
                tag1: {
                    [sequelize_1.Op.like]: '%tarif%',
                }
            }, products4, limit, catids, options);
        });
    }
    getInformationalVideos(limit) {
        return __awaiter(this, void 0, void 0, function* () {
            let resources = yield resource_1.default.findAll({
                where: {
                    type: 'product-videos',
                    tag1: 'bilgi'
                },
                limit: limit || 1000,
                order: [['updatedon', 'DESC']]
            });
            let products = yield product_1.default.findAll({
                where: {
                    id: resources.map(p => p.ref1)
                }
            });
            resources.forEach(p => {
                p.product = products.find(r => r.id == p.ref1);
            });
            return resources;
        });
    }
    getPriceStatsForUnit(productids, unit) {
        return __awaiter(this, void 0, void 0, function* () {
            let sql = `(${productids.join(',')})`;
            let q = `select ButcherProducts.productid as pid,  count(*) as count, 
        min(${unit}Price) as ${unit}min, avg(${unit}Price) as ${unit}avg, max(${unit}Price) as ${unit}max
        from ButcherProducts, Butchers 
        where 
        ButcherProducts.productid in ${sql} and 
        ButcherProducts.${unit}Price > 0 and
        ButcherProducts.enabled=true and 
        ButcherProducts.butcherid = Butchers.id 
        and Butchers.approved=true and Butchers.status='open'
        group by ButcherProducts.productid
        `;
            let res = yield product_1.default.sequelize.query(q, {
                raw: true,
                mapToModel: false,
                type: sq.QueryTypes.SELECT
            });
            return res;
        });
    }
    getPriceStats(productids) {
        return __awaiter(this, void 0, void 0, function* () {
            let units = ['kg', 'unit1', 'unit2', 'unit3'];
            let res = [];
            for (let i = 0; i < units.length; i++) {
                res = yield this.getPriceStatsForUnit(productids, units[i]);
                if (res.length > 0 && res[0][`${units[i]}min`] > 0)
                    break;
            }
            // let sql = `(${productids.join(',')})`
            // let q = `select ButcherProducts.productid as pid,  count(*) as count, 
            // min(kgPrice) as kgmin, avg(kgPrice) as kgavg, max(kgPrice) as kgmax, 
            // min(unit1price) as unit1min, avg(unit1price) as unit1avg, max(unit1price) as unit1max,
            // min(unit2price)  as unit2min, avg(unit2price)  as unit2avg, max(unit2price) as unit2max,
            // min(unit3price)  as unit3min, avg(unit3price)  as unit3avg, max(unit3price) as unit3max
            // from ButcherProducts, Butchers 
            // where 
            // ButcherProducts.productid in ${sql} and 
            // (ButcherProducts.kgPrice > 0 or ButcherProducts.unit1price > 0 or ButcherProducts.unit2price or ButcherProducts.unit3price > 0) and
            // ButcherProducts.enabled=true and 
            // ButcherProducts.butcherid = Butchers.id 
            // and Butchers.approved=true
            // group by ButcherProducts.productid
            // `
            // let res = await Product.sequelize.query<any>(q, {
            //     raw: true  ,
            //     mapToModel: false,
            //     type: sq.QueryTypes.SELECT       
            // } )        
            return res;
        });
    }
    getProductsFeedXML(products) {
        var feed = builder.create('feed').att("xmlns", "http://www.w3.org/2005/Atom").att("xmlns:g", "http://base.google.com/ns/1.0");
        feed.ele("title", "KasaptanAl.com");
        feed.ele("link", 'https://www.kasaptanal.com').att("rel", "self");
        feed.ele("updated", new Date().toISOString());
        products.forEach(p => {
            let entry = feed.ele("entry");
            entry.ele("g:id", p.id);
            entry.ele("g:title", p.title);
            entry.ele("g:description", p.description);
            entry.ele("g:link", p.link);
            entry.ele("g:condition", p.condition);
            entry.ele("g:availability", p.availability);
            entry.ele("g:price", helper_1.default.formattedCurrency(p.price, "TRY"));
            entry.ele("g:identifier_exists", "no");
            entry.ele("g:fb_product_category", "10");
            entry.ele("g:google_product_category", "4628");
            let ship = entry.ele("g:shipping");
            ship.ele("g:country", "TR");
            ship.ele("g:service", "Same Day");
            ship.ele("g:price", "0TRY");
            //entry.ele("g:gtin", p.gtin);
            entry.ele("g:brand", "");
            entry.ele("g:mpn", p.mpn);
            p.images.forEach((im, i) => {
                (i < 5) && entry.ele(i == 0 ? "g:image_link" : "g:additional_image_link", `${im}`);
            });
        });
        return feed;
    }
    getProductsFeed() {
        return __awaiter(this, void 0, void 0, function* () {
            let res = [];
            let products = yield product_1.default.findAll({
                where: { status: "onsale" }
            });
            for (let i = 0; i < products.length; i++) {
                let p = products[i];
                if (p.status == "onsale" && (p.productType == product_1.ProductType.generic || p.productType == product_1.ProductType.tumkuzu)) {
                    yield p.loadResources();
                    let ld = yield this.getProductLd(p);
                    if (ld.offers) {
                        let feed = {
                            id: p.id.toString(),
                            availability: "in stock",
                            brand: ld.brand.name,
                            condition: "new",
                            description: ld.description,
                            images: ld.image,
                            price: ld.offers.lowPrice,
                            link: "https://www.kasaptanal.com/" + p.slug,
                            title: ld.name,
                            mpn: p.id.toString(),
                            gtin: "KA" + p.id.toString()
                        };
                        res.push(feed);
                    }
                }
            }
            return res;
        });
    }
    getProductsFeedOfButcher(butcher) {
        return __awaiter(this, void 0, void 0, function* () {
            let res = [];
            // let products = await Product.findAll({ 
            //      where: { status: "onsale" }
            // });
            let products = butcher.products;
            for (let i = 0; i < products.length; i++) {
                let p = products[i].product;
                if (p.status == "onsale" && (p.productType == product_1.ProductType.generic || p.productType == product_1.ProductType.tumkuzu)) {
                    yield p.loadResources();
                    let ld = new ProductLd_1.ProductLd(p);
                    let feed = {
                        id: p.id.toString(),
                        availability: "in stock",
                        brand: butcher.name,
                        condition: "new",
                        description: ld.description,
                        images: ld.image,
                        price: products[i].priceView.price,
                        link: "https://www.kasaptanal.com/" + p.slug + '?butcher=' + butcher.slug,
                        title: ld.name,
                        mpn: p.id.toString(),
                        gtin: butcher.slug + p.id.toString()
                    };
                    res.push(feed);
                }
            }
            return res;
        });
    }
    getProductLd(product) {
        return __awaiter(this, void 0, void 0, function* () {
            let res = new ProductLd_1.ProductLd(product);
            let prices = yield this.getPriceStats([product.id]);
            let units = ['kg', 'unit1', 'unit2', 'unit3'];
            let usedUnit = null;
            if (prices && prices.length) {
                let price = prices[0];
                for (let i = 0; i < units.length; i++) {
                    let avgPrice = price[`${units[i]}avg`];
                    if (avgPrice > 0) {
                        usedUnit = units[i];
                        break;
                    }
                }
                if (usedUnit) {
                    let high = Number(price[`${usedUnit}max`].toFixed(2));
                    let low = Number(price[`${usedUnit}min`].toFixed(2));
                    let avg = Number(price[`${usedUnit}avg`].toFixed(2));
                    // if (low == 0.00) {
                    //     low = high
                    // }
                    res.offers = {
                        '@type': "AggregateOffer",
                        offerCount: price['count'],
                        highPrice: high,
                        lowPrice: low,
                        unit: usedUnit == "kg" ? "KG" : product[`${usedUnit}title`],
                        priceCurrency: "TRY",
                        availability: "InStock"
                    };
                    if (usedUnit == 'kg') {
                        res.offers.unit_pricing_measure = "1 kg";
                        res.offers.unit_pricing_base_measure = "1 kg";
                    }
                }
            }
            return res;
        });
    }
    getProductLdById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            let product = yield product_1.default.findOne({
                include: [{
                        all: true
                    }], where: { slug: this.req.params.product }
            });
            if (!product)
                return this.res.sendStatus(404);
            yield product.loadResources();
            return this.getProductLd(product);
        });
    }
    getProductUnits(product) {
        let result = [];
        (product.unit1 && product.unit1 != "") ? result.push(product.unit1) : null;
        (product.unit2 && product.unit2 != "") ? result.push(product.unit2) : null;
        (product.unit3 && product.unit3 != "") ? result.push(product.unit3) : null;
        return result;
    }
    _getProductViewByProduct(product, butcherproduct) {
        return __awaiter(this, void 0, void 0, function* () {
        });
    }
    getProductViewByProduct(product, butcherproduct) {
        return __awaiter(this, void 0, void 0, function* () {
        });
    }
    getPurchaseOptions(product, butcherProduct) {
        let purchaseOptions = [];
        let kgPrice = butcherProduct ? butcherProduct.kgPrice : 0.00;
        this.getProductUnits(product).forEach((p, i) => {
            let col = `unit${i + 1}`;
            let add = !butcherProduct ? true : (butcherProduct[`${col}enabled`]);
            add && purchaseOptions.push({
                id: i + 1,
                notePlaceholder: product[`${col}note`],
                desc: this.markdown.render(product[`${col}desc`] || ""),
                kgRatio: product[`${col}kgRatio`],
                unitWeight: (butcherProduct && butcherProduct[`${col}weight`]) || product[`${col}weight`],
                unitPrice: butcherProduct ?
                    (helper_1.default.asCurrency(butcherProduct[`${col}price`]) > 0 ?
                        helper_1.default.asCurrency(butcherProduct[`${col}price`]) :
                        helper_1.default.asCurrency((butcherProduct[`${col}kgRatio`] || product[`${col}kgRatio`]) * kgPrice)) :
                    0.00,
                unit: p,
                unitTitle: product[`${col}title`],
                displayOrder: product[`${col}Order`],
                min: product[`${col}min`],
                max: product[`${col}max`],
                default: product[`${col}def`],
                perPerson: product[`${col}perPerson`],
                step: product[`${col}step`],
                weigthNote: product[`${col}WeigthNote`]
            });
        });
        return _.sortBy(purchaseOptions, ["displayOrder"]).reverse();
    }
    getProductView(product, butcher, butcherProduct, loadResources = false) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!butcherProduct && butcher && !butcher.products) {
                butcherProduct = yield butcherproduct_1.default.findOne({
                    where: {
                        productid: product.id,
                        butcherid: butcher.id,
                        enabled: true
                    }
                });
            }
            else if (butcher && butcher.products) {
                butcherProduct = butcher.products.find(c => (c.productid == product.id) && c.enabled);
            }
            let kgPrice = butcherProduct ? butcherProduct.kgPrice : 0;
            // let defaultUnitCol = `unit${product.defaultUnit}`
            // let defaultUnitPrice = 0.0;
            // let defaultUnitText = "";
            //let kgRatio = 0.00;
            //let defaultUnit = "";
            //if (product.defaultUnit == 0) {
            //    kgRatio = 1.00;
            //    defaultUnit = 'kg'
            //} else {
            //kgRatio = product[`${defaultUnitCol}kgRatio`]
            //defaultUnit = product[`${defaultUnitCol}`]
            //}
            // defaultUnitPrice = Helper.asCurrency(Helper.asCurrency(kgRatio * kgPrice) * product.defaultAmount);
            // defaultUnitText = defaultUnit == 'kg' ? (product.defaultAmount < 1 ? `${product.defaultAmount * 1000}gr` : "kg") : product[`${defaultUnitCol}`]
            let view;
            view = {
                id: product.id,
                butcher: butcherProduct ? {
                    enableCreditCard: butcher.enableCreditCard,
                    userRatingAsPerc: butcher.userRatingAsPerc,
                    shipRatingAsPerc: butcher.shipRatingAsPerc,
                    description: butcher.description,
                    slug: butcher.slug,
                    badges: butcher.getBadgeList(),
                    name: butcher.name,
                    id: butcher.id,
                    puanData: butcher.getPuanData(product.productType),
                    earnedPuan: 0.00,
                    productNote: '',
                    kgPrice: kgPrice,
                    locationText: butcher.locationText
                } : null,
                butcherNote: (butcherProduct && butcherProduct.mddesc) ? butcherProduct.mddesc : '',
                butcherLongNote: (butcherProduct && butcherProduct.longdesc) ? butcherProduct.longdesc : '',
                slug: product.slug,
                name: product.name,
                kgPrice: kgPrice,
                productType: product.productType,
                shortDesc: product.shortdesc,
                notePlaceholder: product.notePlaceholder,
                priceView: null,
                // viewUnitPrice: defaultUnitPrice,
                // viewUnit: defaultUnitText,
                // viewUnitDesc: product[`${defaultUnitCol}desc`] || (defaultUnit == 'kg' ? 'kg' : ''),
                // defaultUnit: product.defaultUnit,
                // viewUnitAmount: product.defaultAmount,
                purchaseOptions: [],
                alternateButchers: []
            };
            if (loadResources) {
                view.resources = [];
                product.resources.forEach(r => view.resources.push(r.asView()));
            }
            view.purchaseOptions = this.getPurchaseOptions(product, butcherProduct);
            if (view.purchaseOptions.length) {
                view.priceView = {
                    price: view.purchaseOptions[0].unitPrice,
                    unitTitle: view.purchaseOptions[0].unitTitle,
                    unit: view.purchaseOptions[0].unit
                };
            }
            return view;
        });
    }
    // @Auth.Anonymous()
    // async searchRoute() {
    //     let product = await Product.findOne({
    //         where: {
    //             slug: this.req.params.slug
    //         }
    //     })
    //     let butcher: Butcher = this.req.params.butcher ? await Butcher.findOne(
    //         {
    //             include: [{
    //                 all: true
    //             }],
    //             where: {
    //                 slug: this.req.params.butcher
    //             }
    //         }
    //     ) : null;
    //     let view = this.getProductView(product, butcher)
    //     this.res.send(view)
    // }
    static SetRoutes(router) {
        // router.get("/product/:slug", Route.BindRequest(this.prototype.searchRoute));
        // router.get("/product/:slug/:butcher", Route.BindRequest(this.prototype.searchRoute));
    }
}
__decorate([
    common_1.Auth.Anonymous(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], Route.prototype, "getProductLdById", null);
exports.default = Route;
