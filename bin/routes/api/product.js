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
const butcher_1 = require("../../db/models/butcher");
const butcherproduct_1 = require("../../db/models/butcherproduct");
const helper_1 = require("../../lib/helper");
var MarkdownIt = require('markdown-it');
const sq = require("sequelize");
const builder = require("xmlbuilder");
const context_1 = require("../../db/context");
const _ = require("lodash");
const resource_1 = require("../../db/models/resource");
const resourcecategory_1 = require("../../db/models/resourcecategory");
const category_1 = require("../../db/models/category");
const sequelize_1 = require("sequelize");
const ProductLd_1 = require("../../models/ProductLd");
const dispatcher_1 = require("./dispatcher");
const review_1 = require("../../db/models/review");
const shipment_1 = require("../../models/shipment");
const path = require("path");
const dispatcher_2 = require("../../db/models/dispatcher");
const config_1 = require("../../config");
const productManager_1 = require("../../lib/productManager");
const http_1 = require("../../lib/http");
const butcherpricehistory_1 = require("../../db/models/butcherpricehistory");
const fs = require('fs');
let ButcherPropertyWeigts = {
    'distance': -0.80,
    'kasapkart': 0.60,
    'productPrice': 0.00,
    'shipmentPrice': 0.00,
    'rating': 0.40,
    'shipTotal': 0.00,
    'butcherSelection': 1.00,
    'productSelection': 1.00
};
class Route extends router_1.ApiRouter {
    constructor() {
        super(...arguments);
        this.markdown = new MarkdownIt();
    }
    getButcherPropertyWeights() {
        return __awaiter(this, void 0, void 0, function* () {
            let rawdata = yield fs.readFileSync(path.join(__dirname, "../../../butcherweights.json"));
            return JSON.parse(rawdata);
        });
    }
    calculateButcherRate(butcher, product, dispatcher, limits, customerFee, weights) {
        return __awaiter(this, void 0, void 0, function* () {
            let bp = butcher.products.find(p => p.productid == product.id);
            let butcherWeight = dispatcher_2.DispatcherSelectionWeigts[dispatcher.selection];
            if (butcherWeight == 0 && butcher.selectionRadiusAsKm > 0) {
                butcherWeight = dispatcher.butcherArea.bestKm <= butcher.selectionRadiusAsKm ? 1 : butcherWeight;
            }
            let butcherweights = {
                'distance': dispatcher.butcherArea.bestKm,
                'kasapkart': butcher.customerPuanRate,
                'productPrice': bp.priceView.price,
                'rating': butcher.weightRatingAsPerc,
                'shipmentPrice': customerFee,
                'shipTotal': butcher.shipTotalCount,
                'butcherSelection': butcherWeight,
                'productSelection': product_1.ProductSelectionWeigts[bp.selection]
            };
            let puan = 0.00;
            config_1.default.nodeenv == "development" && console.log('*', butcher.name, '*');
            for (let k in butcherweights) {
                let lim = limits[k];
                let propPuan = helper_1.default.mapValues(butcherweights[k], lim[0], lim[1]);
                propPuan = Number.isNaN(propPuan) ? 0 : propPuan * weights[k];
                config_1.default.nodeenv == "development" && console.log(k, propPuan.toFixed(2), '[', lim[0], lim[1], ']:', butcherweights[k]);
                puan += propPuan;
            }
            config_1.default.nodeenv == "development" && console.log(butcher.name, ':', puan.toFixed(2));
            config_1.default.nodeenv == "development" && console.log('------------------');
            return puan;
        });
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
    getPriceStatsForUnit(productids, unit, butcherids = [], options = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            let sql = `(${productids.join(',')})`;
            let butchers = `(${butcherids.join(',')})`;
            let q = `select ButcherProducts.productid as pid,  count(*) as count, 
        min(${unit}Price) as ${unit}min, avg(${unit}Price) as ${unit}avg, max(${unit}Price) as ${unit}max
        from ButcherProducts, Butchers 
        where 
        ${butcherids.length > 0 ? 'Butchers.id in ' + butchers + ' and ' : ''}
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
    getPriceStats(productids, butcherids = [], options = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            let units = ['kg', 'unit1', 'unit2', 'unit3'];
            let res = [];
            let pids = [...productids];
            for (let i = 0; i < units.length; i++) {
                let stats = yield this.getPriceStatsForUnit(pids, units[i], butcherids, options = {});
                res = res.concat(stats);
                pids = pids.filter(p => !res.find(r => r.pid == p));
                if (pids.length == 0)
                    break;
            }
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
    tryBestFromShopcard(shopcard, serving, others = []) {
        return __awaiter(this, void 0, void 0, function* () {
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
    useL1(product) {
        return (product.productType == product_1.ProductType.kurban);
    }
    locateButchersForProduct(product, adr, userBest, shopcard) {
        return __awaiter(this, void 0, void 0, function* () {
            let api = new dispatcher_1.default(this.constructorParams);
            let q = {
                adr: adr,
                product: product,
                useLevel1: this.useL1(product),
                orderType: product.productType
            };
            let serving = yield api.getDispatchers(q);
            let takeOnly = serving.filter(p => p.takeOnly == true);
            serving = serving.filter(p => !p.takeOnly);
            let sameGroup = [];
            _.remove(serving, (item) => {
                if (item.butcher.parentButcher) {
                    if (sameGroup.find(g => g == item.butcher.parentButcher)) {
                        return true;
                    }
                    else {
                        sameGroup.push(item.butcher.parentButcher);
                        return false;
                    }
                }
                else
                    return false;
            });
            let weighedServing = yield this.findBestButcher(serving, product, adr);
            let mybest = (yield this.tryBestFromShopcard(shopcard, weighedServing)) || weighedServing[0];
            if (mybest) {
                mybest = (userBest ? (weighedServing.find(s => s.butcherid == userBest.id)) : null) || mybest;
            }
            return {
                best: mybest,
                serving: weighedServing,
                takeOnly: takeOnly
            };
        });
    }
    findBestButcher(serving, product, adr) {
        return __awaiter(this, void 0, void 0, function* () {
            //let minDistance = Math.min.apply(Math, serving.map(s=>s.butcherArea.bestKm));
            let maxDistance = Math.max.apply(Math, serving.map(s => s.butcherArea.bestKm));
            //let minPuan = Math.min.apply(Math, serving.map(s=>s.butcher.customerPuanRate));
            //let maxPuan = Math.max.apply(Math, serving.map(s=>s.butcher.customerPuanRate));
            //let minRate = Math.min.apply(Math, serving.map(s=>s.butcher.totalRatingAsPerc));
            //let maxRate = Math.max.apply(Math, serving.map(s=>s.butcher.totalRatingAsPerc));
            let minShipTotal = Math.min.apply(Math, serving.map(s => s.butcher.shipTotalCount));
            let maxShipTotal = Math.max.apply(Math, serving.map(s => s.butcher.shipTotalCount));
            let minPrice = Math.min.apply(Math, serving.map(s => {
                let bp = s.butcher.products.find(p => p.productid == product.id);
                bp.product = product;
                return bp.priceView.price;
            }));
            let maxPrice = Math.max.apply(Math, serving.map(s => {
                let bp = s.butcher.products.find(p => p.productid == product.id);
                bp.product = product;
                return bp.priceView.price;
            }));
            let weights = yield this.getButcherPropertyWeights();
            let l1 = adr.based.getLevel(1);
            let l2 = adr.based.getLevel(2);
            let l3 = adr.based.getLevel(3);
            let orderSize = l3.butcherWeightOrder || l2.butcherWeightOrder || l1.butcherWeightOrder || 150.00;
            let customerFees = {}, minFee = Number.MAX_SAFE_INTEGER, maxFee = Number.MIN_SAFE_INTEGER;
            // for(let i = 0; i < serving.length;i ++) {
            //     let fromTo: FromTo = {
            //         start: serving[i].butcher.location,
            //         sId: serving[i].id.toString(),
            //         finish: adr.based.location,
            //         fId: adr.based.id.toString()
            //     }
            //     let offerRequest = serving[i].provider.offerRequestFromTo(fromTo);
            //     offerRequest.orderTotal = orderSize;
            //     let offer = await serving[i].provider.requestOffer(offerRequest);
            //     if (offer) {
            //         serving[i].provider.calculateCustomerFee(offer);
            //         customerFees[serving[i].butcher.id] = offer.customerFee;
            //         minFee = Math.min(minFee, offer.customerFee);
            //         maxFee = Math.max(maxFee, offer.customerFee);
            //     }
            // }
            // let offerRequest = this.offerRequestFromTo(ft);
            // let offer = await this.requestOffer(offerRequest);
            // for (let i = 1; i < 10; i++)
            //     prices.push(Helper.asCurrency(i * slice))
            // for (let i = 0; i < prices.length; i++) {
            //     offer.orderTotal = Helper.asCurrency((2 * prices[i] + slice) / 2);
            //     this.calculateCustomerFee(offer);
            let limits = {
                'distance': [0, maxDistance],
                'kasapkart': [0.00, 0.15],
                'productPrice': [minPrice, maxPrice],
                'shipmentPrice': [minFee, maxFee],
                'rating': [80, 100],
                'shipTotal': [0, maxShipTotal],
                'butcherSelection': [-1, 1],
                'productSelection': [-1, 1]
            };
            weights = l1.butcherWeights ? Object.assign(Object.assign({}, weights), l1.butcherWeights) : weights;
            weights = l2.butcherWeights ? Object.assign(Object.assign({}, weights), l2.butcherWeights) : weights;
            weights = l3.butcherWeights ? Object.assign(Object.assign({}, weights), l3.butcherWeights) : weights;
            weights = product.butcherWeights ? Object.assign(Object.assign({}, weights), product.butcherWeights) : weights;
            for (let i = 0; i < serving.length; i++) {
                serving[i].butcher.calculatedRate = yield this.calculateButcherRate(serving[i].butcher, product, serving[i], limits, typeof customerFees[serving[i].butcher.id] == 'undefined' ? maxFee : customerFees[serving[i].butcher.id], weights);
            }
            let weightSorted = _.orderBy(serving, 'butcher.calculatedRate', 'desc');
            return weightSorted;
        });
    }
    getProductsFeed(options) {
        return __awaiter(this, void 0, void 0, function* () {
            let res = [];
            let products = yield product_1.default.findAll({
                where: { status: "onsale" }
            });
            for (let i = 0; i < products.length; i++) {
                let p = products[i];
                if (p.status == "onsale" && (p.productType == product_1.ProductType.generic || p.productType == product_1.ProductType.tumkuzu)) {
                    yield p.loadResources();
                    let ld = yield this.getProductLd(p, options);
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
    getProductsFeedOfButcher(butcher, options) {
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
                    let ld = new ProductLd_1.ProductLd(p, options);
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
    getProductLd(product, options) {
        return __awaiter(this, void 0, void 0, function* () {
            let res = new ProductLd_1.ProductLd(product, options);
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
    getProductLdById(id, options) {
        return __awaiter(this, void 0, void 0, function* () {
            let product = yield product_1.default.findOne({
                include: [{
                        all: true
                    }], where: { slug: this.req.params.product }
            });
            if (!product)
                return this.res.sendStatus(404);
            yield product.loadResources();
            return this.getProductLd(product, options);
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
    getProductViewforButcher(product, butcher, butcherProduct) {
        return __awaiter(this, void 0, void 0, function* () {
            let view = yield this.getProductView(product, butcher, butcherProduct, false, true);
            let result = view;
            result.butcherProductNote = product.butcherProductNote;
            result.priceUnit = product.priceUnit;
            result.enabled = false;
            if (butcher && butcher.products) {
                let butcherProduct = butcher.products.find(c => (c.productid == product.id));
                result.fromButcherNote = butcherProduct ? butcherProduct.fromButcherDesc : '';
                result.enabled = butcherProduct ? butcherProduct.enabled : false;
            }
            return result;
        });
    }
    getProductView(product, butcher, butcherProduct, loadResources = false, includeDisable = false) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!butcherProduct && butcher && !butcher.products) {
                let where = {
                    productid: product.id,
                    butcherid: butcher.id,
                };
                if (!includeDisable) {
                    where['enabled'] = true;
                }
                butcherProduct = yield butcherproduct_1.default.findOne({
                    where: where
                });
            }
            else if (butcher && butcher.products) {
                butcherProduct = butcher.products.find(c => (c.productid == product.id) && (includeDisable ? true : c.enabled));
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
                    shipday0: butcher.shipday0,
                    shipday1: butcher.shipday1,
                    shipday2: butcher.shipday2,
                    shipday3: butcher.shipday3,
                    shipday4: butcher.shipday4,
                    shipday5: butcher.shipday5,
                    shipday6: butcher.shipday6,
                    enableCreditCard: butcher.enableCreditCard,
                    userRatingAsPerc: butcher.userRatingAsPerc,
                    shipRatingAsPerc: butcher.shipRatingAsPerc,
                    shipSuccessText: butcher.shipSuccessText,
                    description: butcher.description,
                    slug: butcher.slug,
                    badges: butcher.getBadgeList(),
                    name: butcher.name,
                    id: butcher.id,
                    puanData: butcher.getPuanData(product.productType),
                    earnedPuan: 0.00,
                    productNote: '',
                    kgPrice: kgPrice,
                    calculatedRate: butcher.calculatedRate,
                    locationText: butcher.locationText,
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
                shipmentDayHours: shipment_1.Shipment.getShipmentDays(),
                // viewUnitPrice: defaultUnitPrice,
                // viewUnit: defaultUnitText,
                // viewUnitDesc: product[`${defaultUnitCol}desc`] || (defaultUnit == 'kg' ? 'kg' : ''),
                // defaultUnit: product.defaultUnit,
                // viewUnitAmount: product.defaultAmount,
                purchaseOptions: [],
                alternateButchers: [],
                nutritionView: null
            };
            if (loadResources) {
                view.resources = [];
                product.resources.forEach(r => view.resources.push(r.asView()));
            }
            view.nutritionView = product.nutritionView;
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
    viewProductsForButchers() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.req.params.butcher) {
                return this.next();
            }
            let butcher = yield butcher_1.default.loadButcherWithProducts(this.req.params.butcher, true);
            if (!butcher) {
                return this.next();
            }
            let api = this;
            let categories = this.req.__categories.filter(p => p.slug != 'populer-etler');
            let viewProducts = [];
            for (let i = 0; i < categories.length; i++) {
                let prods = yield productManager_1.default.getProductsOfCategories([categories[i].id]);
                for (let p = 0; p < prods.length; p++) {
                    let view = yield api.getProductViewforButcher(prods[p], butcher);
                    if (!viewProducts.find(vp => vp.id == view.id)) {
                        let price = helper_1.default.asCurrency(view.kgPrice);
                        if (price <= 0) {
                            let op = view.purchaseOptions.find(po => po.unit == view.priceUnit);
                            price = op ? op.unitPrice : price;
                        }
                        viewProducts.push({
                            id: view.id,
                            name: view.name,
                            unit: view.priceUnit == 'kg' ? 'kg' : prods[p][`${view.priceUnit}`],
                            enabled: view.enabled,
                            price: price,
                            butcherProductNote: view.butcherProductNote,
                            note: view.fromButcherNote,
                            slug: view.slug,
                            thumbnail: this.req.helper.imgUrl("product-photos", view.slug)
                        });
                    }
                }
            }
            this.res.send(viewProducts);
        });
    }
    saveProductsForButchers() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.req.params.butcher) {
                return this.next();
            }
            let butcher = yield butcher_1.default.findOne({
                where: {
                    slug: this.req.params.butcher
                }
            });
            if (!butcher) {
                return this.next();
            }
            if (butcher.approved) {
                if (!this.req.user || !helper_1.default.hasRightOnButcher(this.req.user, butcher.id)) {
                    return new http_1.PermissionError();
                }
            }
            ;
            let productid = parseInt(this.req.body.id);
            let product = yield product_1.default.findOne({ where: {
                    id: productid
                } });
            let newItem = yield butcherproduct_1.default.findOne({
                where: {
                    butcherid: butcher.id,
                    productid: productid
                }
            });
            if (newItem == null)
                newItem = new butcherproduct_1.default();
            newItem.enabled = (this.req.body.price <= 0 ? false : this.req.body.enabled);
            newItem.butcherid = butcher.id;
            newItem.productid = productid;
            newItem.fromButcherDesc = this.req.body.note;
            if (this.req.body.unit == 'kg') {
                newItem.kgPrice = this.req.body.price;
            }
            else {
                let unitid = product.getUnitBy(this.req.body.unit);
                if (!unitid)
                    throw new http_1.ValidationError('Geçersiz birim');
                newItem[`${unitid}price`] = this.req.body.price;
                newItem[`${unitid}enabled`] = true;
            }
            // newItem.unit1price = this.req.body.unit1price ? parseFloat(this.req.body.unit1price) : 0;
            // newItem.unit2price = this.req.body.unit2price ? parseFloat(this.req.body.unit2price) : 0;
            // newItem.unit3price = this.req.body.unit3price ? parseFloat(this.req.body.unit3price) : 0;
            // newItem.kgPrice = this.req.body.productkgPrice ? parseFloat(this.req.body.productkgPrice) : 0;
            //newItem.mddesc = this.req.body.productmddesc;
            //newItem.longdesc = this.req.body.productlongdesc;
            // newItem.unit1enabled = this.req.body.unit1enabled == "on";
            // newItem.unit2enabled = this.req.body.unit2enabled == "on";
            // newItem.unit3enabled = this.req.body.unit3enabled == "on";
            yield context_1.default.getContext().transaction((t) => {
                return newItem.save({
                    transaction: t
                }).then(() => butcher.approved ? butcherpricehistory_1.default.manageHistory(newItem, t) : null);
            });
            this.res.send(this.req.body);
        });
    }
    static SetRoutes(router) {
        // router.get("/product/:slug", Route.BindRequest(this.prototype.searchRoute));
        // router.get("/product/:slug/:butcher", Route.BindRequest(this.prototype.searchRoute));
        router.get("/product/:butcher/prePrices", Route.BindRequest(this.prototype.viewProductsForButchers));
        router.post("/product/:butcher/prePrices", Route.BindRequest(this.prototype.saveProductsForButchers));
    }
}
__decorate([
    common_1.Auth.Anonymous(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], Route.prototype, "getProductLdById", null);
__decorate([
    common_1.Auth.Anonymous(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], Route.prototype, "viewProductsForButchers", null);
__decorate([
    common_1.Auth.Anonymous(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], Route.prototype, "saveProductsForButchers", null);
exports.default = Route;
