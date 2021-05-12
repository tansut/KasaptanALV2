import { Auth } from '../../lib/common';
import { ApiRouter, ViewRouter } from '../../lib/router';
import * as express from "express";
import { BrandView, ProductView, ProductViewForButcher, PurchaseOption, } from '../../models/productView';
import Product, { ProductSelectionWeigts, ProductType } from '../../db/models/product';
import Butcher from '../../db/models/butcher';
import ButcherProduct from '../../db/models/butcherproduct';
import Helper from '../../lib/helper';
var MarkdownIt = require('markdown-it')
import * as sq from 'sequelize';
import * as builder from "xmlbuilder"
import { Transaction } from "sequelize";
import db from "../../db/context";
import * as _ from 'lodash';
import Resource from '../../db/models/resource';
import ResourceCategory from '../../db/models/resourcecategory';
import Category from '../../db/models/category';
import { Op } from 'sequelize';
import { ProductLd, IProductLd, ProductLdOptions } from '../../models/ProductLd';
import DispatcherApi, { DispatcherQuery } from './dispatcher';
import Review from '../../db/models/review';
import { Shipment } from '../../models/shipment';
import * as path from "path"
import Dispatcher, { DispatcherSelectionWeigts } from '../../db/models/dispatcher';
import config from '../../config';
import { FromTo } from '../../lib/logistic/core';
import { PreferredAddress } from '../../db/models/user';
import { ShopCard } from '../../models/shopcard';
import { OrderButcherSelection } from '../../db/models/order';
import { PriceView } from '../../models/common';
import ProductManager from '../../lib/productManager';
import { isThisTypeNode } from 'typescript';
import { BusinessError, PermissionError, ValidationError } from '../../lib/http';
import ButcherPriceHistory from '../../db/models/butcherpricehistory';
import ProductRelation from '../../db/models/productrelation';
import { getEnabledCategories } from 'node:trace_events';
import Brand from '../../db/models/brand';
import BrandGroup from '../../db/models/brandgroup';
import productfeed from '../../middleware/productfeed';
const fs = require('fs');

export interface ProductFeedItem {
    id: string;
    title: string;
    description: string;
    link: string;
    images: string[];
    condition: string;
    availability: string;
    price: number;
    gtin: string;
    brand: string;
    mpn: string;
}

export interface ButcherSelection {
    best: Dispatcher,
    serving: Dispatcher[]
    // servingL2: Dispatcher[]
    // servingL3: Dispatcher[]
    takeOnly: Dispatcher[]
}

export interface StartPrice {
    view: PriceView;
    basedOn: 'butcher' | 'global';
    title: string;
}

export type ButcherProperty = 'distance' | 'rating' | 'kasapkart' | 'productPrice' | 'shipmentPrice' | 'shipTotal' | 'butcherSelection' | 'productSelection';



export default class Route extends ApiRouter {
    markdown = new MarkdownIt();

    async getButcherPropertyWeights(): Promise<{ [key in ButcherProperty]: number }> {
        let rawdata = await fs.readFileSync(path.join(__dirname, "../../../butcherweights.json"));
        return JSON.parse(rawdata);
    }


    async calculateButcherRate(butcher: Butcher, product: Product, dispatcher: Dispatcher, limits: { [key in ButcherProperty]: number[] }, customerFee: number, weights: { [key in ButcherProperty]: number }) {
        let bp = butcher.products.find(p => p.productid == product.id);
        let butcherWeight = DispatcherSelectionWeigts[dispatcher.selection];
        if (butcherWeight == 0 && butcher.selectionRadiusAsKm > 0) {
            butcherWeight = dispatcher.butcherArea.bestKm <= butcher.selectionRadiusAsKm ? 1 : butcherWeight;
        }
        let butcherweights: { [key in ButcherProperty]: number } = {
            'distance': dispatcher.butcherArea.bestKm,
            'kasapkart': butcher.customerPuanRate,
            'productPrice': bp.priceView.price,
            'rating': butcher.weightRatingAsPerc,
            'shipmentPrice': customerFee,
            'shipTotal': butcher.shipTotalCount,
            'butcherSelection': butcherWeight,
            'productSelection': ProductSelectionWeigts[bp.selection]
        }
        let puan = 0.00;

        config.nodeenv == "development" && console.log('*', butcher.name, '*')
        for (let k in butcherweights) {
            let lim = limits[k];
            let propPuan = Helper.mapValues(butcherweights[k], lim[0], lim[1]);
            propPuan = Number.isNaN(propPuan) ? 0 : propPuan * weights[k];
            config.nodeenv == "development" && console.log(k, propPuan.toFixed(2), '[', lim[0], lim[1], ']:', butcherweights[k]);
            puan += propPuan
        }
        config.nodeenv == "development" && console.log(butcher.name, ':', puan.toFixed(2));
        config.nodeenv == "development" && console.log('------------------')
        return puan;
    }

    async getFoodResources(products4?: Product[], limit?: number, catids?: number[], options = {}) {
        return this.getResources({
            list: true,
            type: ['product-videos', 'product-photos'],
            tag1: {
                [Op.like]: '%yemek%',
            }
        }, products4, limit, catids, options)
    }

    async loadReviews(productid: number, butcherid: number) {
        let res: Review[] = await Review.sequelize.query(`
        SELECT r.* FROM Reviews r, Orders o, OrderItems oi 
        WHERE r.published=true and r.type='order'  and r.ref1=o.id and oi.orderid = o.id and oi.productid=:pid
        and (:butcherid = 0 || :butcherid = ref2)
        ORDER BY r.ID DESC
        `
            ,
            {
                replacements: { butcherid: butcherid, pid: productid },
                type: sq.QueryTypes.SELECT,
                model: Review,
                mapToModel: true,
                raw: false
            }
        );
        return res;
    }

    async getTarifResources(products4?: Product[], limit?: number, catids?: number[], options = {}) {
        return this.getResources({
            list: true,
            type: ['product-videos', 'product-photos'],
            tag1: {
                [Op.like]: '%tarif%',
            }
        }, products4, limit, catids, options)
    }

    async getFoodAndTarifResources(products4?: Product[], limit?: number, catids?: number[], options = {}) {
        return this.getResources({
            type: ['product-videos', 'product-photos'],
            list: true,
            tag1: {
                [Op.or]: [{
                    [Op.like]: '%yemek%'

                }, { [Op.like]: '%tarif%' }]
            }
        }, products4, limit, catids, options)
    }

    async getResources(where, products4?: Product[], limit?: number, catids?: number[], options = <any>{}) {
        if (products4) {
            let ids = products4.map(p => p.id);
            where = {
                ...{
                    [Op.or]: {
                        ref1: ids,
                        ref2: ids,
                        ref3: ids,
                        ref4: ids,
                        ref5: ids,
                        ref6: ids,
                    }
                },
                ...where
            }
        }
        if (catids) where['$categories.category.id$'] = catids;
        let params = {
            where: where,
            raw: options.raw,
            include: [{
                model: ResourceCategory,
                as: 'categories',
                include: [{
                    model: Category
                },

                ]
            }],
            order: [[{ model: ResourceCategory, as: 'categories' }, "displayOrder", "desc"], ["displayOrder", "desc"], ["updatedOn", "desc"]]
        }
        if (limit) params['limit'] = limit;
        let allresources = await Resource.findAll(<any>params);

        let products = products4 || await Product.findAll({
            where: {
                id: allresources.map(p => p.ref1).concat(allresources.filter(p => p.ref2).map(p => p.ref2)).concat(allresources.filter(p => p.ref3).map(p => p.ref3)).concat(allresources.filter(p => p.ref4).map(p => p.ref4)).concat(allresources.filter(p => p.ref5).map(p => p.ref5)).concat(allresources.filter(p => p.ref6).map(p => p.ref6))
            }
        })

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
                res.otherProducts = res.otherProducts || []
                res.otherProducts.push(product2);
            }
            if (product3) {
                res.otherProducts = res.otherProducts || []
                res.otherProducts.push(product3);
            }
            if (product4) {
                res.otherProducts = res.otherProducts || []
                res.otherProducts.push(product4);
            }
            if (product5) {
                res.otherProducts = res.otherProducts || []
                res.otherProducts.push(product5);
            }
            if (product6) {
                res.otherProducts = res.otherProducts || []
                res.otherProducts.push(product6);
            }
        })

        return resources;
    }

    static async getResourcesOfCategories(catids: number[]) {
        return await Resource.findAll({
            include: [{
                model: ResourceCategory,
                as: 'categories',
                include: [{
                    model: Category
                }
                ]
            },
            ], where: {
                '$categories.category.id$': catids
            },
            order: [[{ model: ResourceCategory, as: 'categories' }, "displayOrder", "desc"], ["displayorder", "desc"]]
        });
    }


    async getTarifVideos(products4?: Product[], limit?: number, catids?: number[], options = {}) {
        return this.getResources({
            type: 'product-videos',
            tag1: {
                [Op.like]: '%tarif%',
            }
        }, products4, limit, catids, options)
    }



    async getInformationalVideos(limit?) {
        let resources = await Resource.findAll({
            where: {
                type: 'product-videos',
                tag1: 'bilgi'
            },
            limit: limit || 1000,
            order: [['updatedon', 'DESC']]
        });

        let products = await Product.findAll({
            where: {
                id: resources.map(p => p.ref1)
            }
        })

        resources.forEach(p => {
            p.product = products.find(r => r.id == p.ref1)
        })

        return resources;
    }

    async getPriceStatsForUnit(productids: number[], unit: string, butcherids: number[] = [], options = {}): Promise<Array<any>> {
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
        `

        let res = await Product.sequelize.query<any>(q, {
            raw: true,
            mapToModel: false,
            type: sq.QueryTypes.SELECT
        })

        return res;
    }


    async getPriceStats(productids: number[], butcherids: number[] = [], options = {}): Promise<Array<any>> {

        let units = ['kg', 'unit1', 'unit2', 'unit3'];
        let res: Array<any> = [];
        let pids = [...productids];
        for (let i = 0; i < units.length; i++) {
            let stats = await this.getPriceStatsForUnit(pids, units[i], butcherids, options = {});
            res = res.concat(stats);
            pids = pids.filter(p => !res.find(r => r.pid == p))
            if (pids.length == 0) break;
        }


        return res;
    }

    getProductsFeedXML(products: ProductFeedItem[]): builder.XMLElement {

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
            entry.ele("g:price", Helper.formattedCurrency(p.price, "TRY"));
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
            })



        })


        return feed;
    }


    async tryBestFromShopcard(shopcard: ShopCard, serving: Dispatcher[], others: Dispatcher[] = []) {
        let scButcher = (shopcard.items && shopcard.items.length) ? shopcard.items[0].product.butcher.id : null;
        if (scButcher) {
            let inServing = serving.find(p => p.butcherid == scButcher);
            let inOther = others.find(p => p.butcherid == scButcher);
            return inServing || inOther
        } else return null;
    }

    useL1(product: Product) {
        return (product.productType == ProductType.kurban)
    }

    async locateButchersForProduct(product: Product, adr: PreferredAddress, userBest: Butcher, shopcard: ShopCard): Promise<ButcherSelection> {
        let api = new DispatcherApi(this.constructorParams);

        let q: DispatcherQuery = {
            adr: adr,
            product: product,
            useLevel1: this.useL1(product),
            orderType: product.productType
        }

        let serving = await api.getDispatchers(q);
        let takeOnly = serving.filter(p => p.takeOnly == true);


        serving = serving.filter(p => !p.takeOnly);
        let sameGroup: string[] = []

        _.remove(serving, (item) => {
            if (item.butcher.parentButcher) {
                if (sameGroup.find(g => g == item.butcher.parentButcher)) {
                    return true;
                } else {
                    sameGroup.push(item.butcher.parentButcher);
                    return false;
                }
            } else return false;
        })

        let weighedServing = await this.findBestButcher(serving, product, adr);
        let mybest: Dispatcher = await this.tryBestFromShopcard(shopcard, weighedServing) || weighedServing[0];

        if (mybest) {
            mybest = (userBest ? (weighedServing.find(s => s.butcherid == userBest.id)) : null) || mybest;
        }
        return {
            best: mybest,
            serving: weighedServing,
            takeOnly: takeOnly
        }
    }

    async findBestButcher(serving: Dispatcher[], product: Product, adr: PreferredAddress): Promise<Dispatcher[]> {



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
        let weights = await this.getButcherPropertyWeights();

        let l1 = adr.based.getLevel(1);
        let l2 = adr.based.getLevel(2);
        let l3 = adr.based.getLevel(3);

        let orderSize = l3.butcherWeightOrder || l2.butcherWeightOrder || l1.butcherWeightOrder || 150.00;

        let customerFees: { [key: number]: number } = {}, minFee = Number.MAX_SAFE_INTEGER, maxFee = Number.MIN_SAFE_INTEGER;

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


        let limits: { [key in ButcherProperty]: number[] } = {
            'distance': [0, maxDistance],
            'kasapkart': [0.00, 0.15],
            'productPrice': [minPrice, maxPrice],
            'shipmentPrice': [minFee, maxFee],
            'rating': [80, 100],
            'shipTotal': [0, maxShipTotal],
            'butcherSelection': [-1, 1],
            'productSelection': [-1, 1]
        }



        weights = l1.butcherWeights ? { ...weights, ...l1.butcherWeights } : weights;
        weights = l2.butcherWeights ? { ...weights, ...l2.butcherWeights } : weights;
        weights = l3.butcherWeights ? { ...weights, ...l3.butcherWeights } : weights;

        weights = product.butcherWeights ? { ...weights, ...product.butcherWeights } : weights;

        for (let i = 0; i < serving.length; i++) {

            serving[i].butcher.calculatedRate = await this.calculateButcherRate(serving[i].butcher, product, serving[i], limits, typeof customerFees[serving[i].butcher.id] == 'undefined' ? maxFee : customerFees[serving[i].butcher.id], weights)
        }

        let weightSorted = _.orderBy(serving, 'butcher.calculatedRate', 'desc');

        return weightSorted;


    }

    async getProductsFeed(options: ProductLdOptions): Promise<ProductFeedItem[]> {
        let res: ProductFeedItem[] = [];
        let products = await Product.findAll({
            where: { status: "onsale" }
        });



        for (let i = 0; i < products.length; i++) {
            let p = products[i];
            if (p.status == "onsale" && (p.productType == ProductType.generic || p.productType == ProductType.tumkuzu)) {
                await p.loadResources();
                let ld = await this.getProductLd(p, options);
                if (ld.offers) {
                    let feed: ProductFeedItem = {
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
                    }
                    res.push(feed)
                }
            }
        }

        return res;
    }

    async getProductsFeedOfButcher(butcher: Butcher, options: ProductLdOptions): Promise<ProductFeedItem[]> {
        let res: ProductFeedItem[] = [];
        // let products = await Product.findAll({ 
        //      where: { status: "onsale" }
        // });

        let products = butcher.products;


        for (let i = 0; i < products.length; i++) {
            let p = products[i].product;
            if (p.status == "onsale" && (p.productType == ProductType.generic || p.productType == ProductType.tumkuzu)) {
                await p.loadResources();
                let ld = new ProductLd(p, options)

                let feed: ProductFeedItem = {
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
                }
                res.push(feed)

            }
        }

        return res;
    }



    async getProductLd(product: Product, options: ProductLdOptions): Promise<IProductLd> {
        let res = new ProductLd(product, options)
        let prices = await this.getPriceStats([product.id]);
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
                }

                if (usedUnit == 'kg') {
                    res.offers.unit_pricing_measure = "1 kg";
                    res.offers.unit_pricing_base_measure = "1 kg";
                }

            }
        }

        return res;
    }

    @Auth.Anonymous()
    async getProductLdById(id: number, options: ProductLdOptions) {
        let product = await Product.findOne({
            include: [{
                all: true
            }], where: { slug: this.req.params.product }
        });
        if (!product) return this.res.sendStatus(404);

        await product.loadResources();
        return this.getProductLd(product, options);
    }


    getProductUnits(product: Product) {
        let result = [];
        (product.unit1 && product.unit1 != "") ? result.push(product.unit1) : null;
        (product.unit2 && product.unit2 != "") ? result.push(product.unit2) : null;
        (product.unit3 && product.unit3 != "") ? result.push(product.unit3) : null;
        return result;
    }

    async _getProductViewByProduct(product: Product, butcherproduct: ButcherProduct) {
    }

    async getProductViewByProduct(product: Product, butcherproduct: ButcherProduct) {
    }

    getPurchaseOptions(product: Product, butcherProduct?: ButcherProduct, includeDisable: boolean = false) {
        let purchaseOptions: Array<PurchaseOption> = [];
        let kgPrice = butcherProduct ? butcherProduct.kgPrice : 0.00;

        let getUnitWeight = (p: Product, bp: ButcherProduct, col: string) => {
            let result = product[`${col}weight`];

            if (butcherProduct && butcherProduct[`${col}kgRatio`]) {
                let ratio = butcherProduct[`${col}kgRatio`];
                if (product.priceUnit == 'kg') {
                    if (ratio < 1) {
                        result = `ortalama ${ratio * 1000} gram`
                    } else result = `ortalama ${ratio} kg`
                } else if (product.priceUnit == 'lt') {
                    if (ratio < 1) {
                        result = `${ratio * 1000} ml`
                    } else result = `${ratio} litre`
                } else result = `${ratio} ${product.priceUnitTitle}`
            };

            return result;
        }

        product.availableUnitIds.forEach((p, i) => {
            let col = `${p}`;
            let add = !butcherProduct ? true : (!includeDisable ? (butcherProduct[`${col}enabled`]) : true);
            add = add && product[`${col}`];
            let discount = butcherProduct ? butcherProduct.discountType: 'none';
            let discountValue = butcherProduct ? butcherProduct.priceDiscount: 0.00;
            let regularUnitPrice = butcherProduct ?
            (
                Helper.asCurrency(butcherProduct[`${col}price`]) > 0 ?
                    Helper.asCurrency(butcherProduct[`${col}price`]) :
                    Helper.asCurrency((butcherProduct[`${col}kgRatio`] || product[`${col}kgRatio`]) * kgPrice)
            ) :0.00;
            let unitPrice = Helper.CalculateDiscount(discount, discountValue, regularUnitPrice);
            let unitWeight = getUnitWeight(product, butcherProduct, col) 

            
            add && purchaseOptions.push({
                id: p,
                discount: discount,
                discountValue: discountValue,
                regularUnitPrice: regularUnitPrice,
                enabled: butcherProduct ? butcherProduct[`${col}enabled`] : false,
                notePlaceholder: product[`${col}note`],
                desc: this.markdown.render(product[`${col}desc`] || ""),
                kgRatio: (butcherProduct && butcherProduct[`${col}kgRatio`]) ? butcherProduct[`${col}kgRatio`] : product[`${col}kgRatio`],
                customWeight: butcherProduct && butcherProduct[`${col}kgRatio`] ? true : false,
                unitWeight: unitWeight,
                unitPrice: unitPrice,
                customPrice: butcherProduct ? (Helper.asCurrency(butcherProduct[`${col}price`]) > 0) : false,
                unit: product[`${col}`],
                unitTitle: product[`${col}title`],
                displayOrder: product[`${col}Order`],
                min: product[`${col}min`],
                max: product[`${col}max`],
                default: product[`${col}def`],
                perPerson: product[`${col}perPerson`],
                step: product[`${col}step`],
                butcherUnitSelection: product[`${col}ButcherUnitSelection`],
                butcherUnitEdit: product[`${col}ButcherUnitEdit`],
                weigthNote: product[`${col}WeigthNote`]
            })
        })
        return _.sortBy(purchaseOptions, ["displayOrder"]).reverse()
    }




    async getProductViewforButcher(product: Product, butcher?: Butcher, butcherProduct?: ButcherProduct): Promise<ProductViewForButcher> {
        let view = await this.getProductView(product, butcher, butcherProduct, false, true);
        let result = <ProductViewForButcher>view;
        result.butcherProductNote = this.markdown.render(product.butcherProductNote || '');
        result.priceUnit = product.priceUnit;
        result.enabled = false;
        result.offerableBy = product.offerableBy;
        if (butcher && butcher.products) {
            let butcherProduct = butcher.products.find(c => (c.productid == product.id));
            result.fromButcherNote = butcherProduct ? butcherProduct.fromButcherDesc : '';
            result.enabled = butcherProduct ? butcherProduct.enabled : false;

        }
        return result;
    }


    async getProductView(product: Product, butcher?: Butcher, butcherProduct?: ButcherProduct, loadResources: boolean = false, includeDisable: boolean = false) {
        if (!butcherProduct && butcher && !butcher.products) {
            let where = {
                productid: product.id,
                butcherid: butcher.id,
            }
            if (!includeDisable) {
                where['enabled'] = true;
            }
            butcherProduct = await ButcherProduct.findOne({
                where: where
            })
        }
        else if (butcher && butcher.products) {
            butcherProduct = butcher.products.find(c => (c.productid == product.id) && (includeDisable ? true : c.enabled));
        }

        let brandGroup: BrandGroup = product.brandGroupid ? (product.brandGroup || await BrandGroup.findByPk(product.brandGroupid)): null;
        let brand: BrandView = null;
        
        if (butcherProduct && butcherProduct.brandid) {
            if (butcherProduct.brand) {
                brand = {
                    id: butcherProduct.brand.id,
                    name: butcherProduct.brand.name
                }
            } else {
                let b = await Brand.findByPk(butcherProduct.brandid);
                brand = {
                    id: b.id,
                    name: b.name
                }
            }
        }
        let view: ProductView;

        let discount = butcherProduct ? butcherProduct.discountType: 'none';
        let discountValue = butcherProduct ? butcherProduct.priceDiscount: 0.00;
        let regularPrice = butcherProduct ? butcherProduct.kgPrice :0.00;

        let  kgPrice = Helper.CalculateDiscount(discount, discountValue, regularPrice);
        view = {
            id: product.id,
            discount: discount,
            discountValue: discountValue,
            regularKgPrice: regularPrice,
            brandGroup: brandGroup,
            brand: brand,
            source: butcherProduct ? 'butcher' : 'product',
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
                regularKgPrice: regularPrice,
                calculatedRate: butcher.calculatedRate,
                locationText: butcher.locationText,
            } : null,
            butcherNote: (butcherProduct && butcherProduct.mddesc) ? butcherProduct.mddesc : '',
            butcherLongNote: (butcherProduct && butcherProduct.longdesc) ? butcherProduct.longdesc : '',
            slug: product.slug,
            name: product.name,
            kgPrice: kgPrice,
            kgTitle: product.priceUnitTitle,
            productType: product.productType,
            shortDesc: product.shortdesc,
            notePlaceholder: product.notePlaceholder,
            priceView: null,
            shipmentDayHours: Shipment.getShipmentDays(),
            purchaseOptions: [],
            alternateButchers: [],
            nutritionView: null
        }

        if (loadResources) {
            view.resources = [];
            product.resources.forEach(r => view.resources.push(r.asView()))
        }

        view.nutritionView = product.nutritionView;


        view.purchaseOptions = this.getPurchaseOptions(product, butcherProduct, includeDisable);


        if (view.purchaseOptions.length) {
            view.priceView = {
                price: view.purchaseOptions[0].unitPrice,
                unitTitle: view.purchaseOptions[0].unitTitle,
                unit: view.purchaseOptions[0].unit,
                regular: view.purchaseOptions[0].regularUnitPrice
            }
        }


        return view;
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

    getProductView2Edit(product: Product, view: ProductViewForButcher, category?: Category) {
        let price = (view.priceUnit == 'kg' || view.priceUnit == 'lt') ? Helper.asCurrency(view.regularKgPrice) : 0.00;

        let getpOptions = () => {
            let orj: any = view.purchaseOptions.filter(p => ((p.butcherUnitSelection != 'none-unselected') && (p.butcherUnitSelection != 'none-selected')));
            let priceUnit = view.purchaseOptions.find(po => po.unit == product.priceUnit);
            let hasKgDependency = view.purchaseOptions.find(po => po.kgRatio > 0);
            {
            orj.splice(0, 0, {
                unit: product.getPriceUnit(),
                unitTitle: product.priceUnitTitle,
                id: '',
                enabled: true,
                kgRatio: 1,
                unitPrice: view.kgPrice,
                regularUnitPrice: view.regularKgPrice,
                customWeight: false,
                customPrice: true,
                butcherUnitSelection: 'forced',
                butcherUnitEdit: 'price',
                })
            }



            return orj;
        }






        if (price <= 0) {
            let op = view.purchaseOptions.find(po => po.unit == product[`${view.priceUnit}`]);
            price = op ? op.unitPrice : price
        }

        let getEnabled = (po: PurchaseOption) => {
            if (po.butcherUnitSelection == 'forced') return true;
            if (view.source == "butcher") return po.enabled;
            if (po.butcherUnitSelection == 'selected') return true;
            if (po.butcherUnitSelection == 'unselected') return false;
        }
        return {
            category: category ? {
                id: category.id,
                title: category.name
            } : undefined,
            id: view.id,
            name: view.name,
            kgTitle: view.kgTitle,
            offerableBy: view.offerableBy,
            units: getpOptions().map(po => {
                return {
                    id: po.id,
                    unit: po.unit,
                    title: po.unitTitle,
                    kgRatio: po.kgRatio,
                    enabled: getEnabled(po),
                    price: po.regularUnitPrice || 0.00,
                    customPrice: po.customPrice,
                    customWeight: po.customWeight,
                    butcherUnitSelection: po.butcherUnitSelection,
                    butcherUnitEdit: (po.id && (po.unit == 'kg' || po.unit == 'lt')) ? 'none': po.butcherUnitEdit,
                    butcherNote: this.markdown.render(product[`unit${po.id}ButcherNote`] || '')
                }
            }),
            enabled: view.enabled,
            price: price,
            
            butcherProductNote: view.butcherProductNote,
            note: view.fromButcherNote,
            discountType: view.discount,
            priceDiscount: view.discountValue,
            slug: view.slug,
            thumbnail: this.req.helper.imgUrl("product-photos", view.slug)
        };
    }

    @Auth.Anonymous()
    async viewProductsForButchers() {
        if (!this.req.params.butcher) {
            return this.next();
        }
        let butcher = await Butcher.loadButcherWithProducts(this.req.params.butcher, true);
        let relations = await ProductRelation.findAll();

        if (!butcher) {
            return this.next();
        }

        let api = this
        let categories = this.req.__categories.filter(p => p.slug != 'populer-etler');
        let viewProducts: any[] = [];



        for (let i = 0; i < categories.length; i++) {
            let prods = await ProductManager.getProductsOfCategories([categories[i].id]);
            for (let p = 0; p < prods.length; p++) {
                if (!viewProducts.find(vp => vp.id == prods[p].id)) {
                    let view = await this.getProductViewforButcher(prods[p], butcher);
                    let edit = this.getProductView2Edit(prods[p], view, categories[i]);
                    viewProducts.push(edit);
                    let related = relations.filter(r => ((r.productid1 == view.id || r.productid2 == view.id) && r.relation == 'price'));
                    for (let r = 0; r < related.length; r++) {
                        let rp = prods.find(p => p.id == (related[r].productid2 == view.id ? related[r].productid1 : related[r].productid2));
                        if (rp && !viewProducts.find(vp => vp.id == rp.id)) {
                            let view = await api.getProductViewforButcher(rp, butcher);
                            edit = this.getProductView2Edit(rp, view, categories[i]);
                            viewProducts.push(edit);
                        }
                    }
                }
            }
        }
        this.res.send(viewProducts);
    }


    @Auth.Anonymous()
    async saveCampaign() {
        let butcher = await this.getButcher();

        if (!butcher) {
            return new PermissionError()
        }

        let productid = parseInt(this.req.body.id);

        let product = await Product.findOne({
            where: {
                id: productid
            }
        })

        let butcherProduct: ButcherProduct = await ButcherProduct.findOne({
            where: {
                butcherid: butcher.id,
                productid: productid
            }
        });

        if (!butcherProduct) throw new ValidationError('Geçersiz ürün');

        butcherProduct.discountType = this.req.body.discountType;
        butcherProduct.priceDiscount = Helper.parseFloat(this.req.body.priceDiscount, 0);

        await butcherProduct.save();

        butcher = await Butcher.loadButcherWithProducts(this.req.params.butcher, true);
        let view = await this.getProductViewforButcher(product, butcher);
        let edit = this.getProductView2Edit(product, view)

        this.res.send(edit);        

    }

    async getButcher() {
        if (!this.req.params.butcher) {
            return this.next();
        }

        let butcher = await Butcher.loadButcherWithProducts(this.req.params.butcher, true);

        if (!butcher) {
            return null;
        }

        if (butcher.approved) {
            if (!this.req.user || !Helper.hasRightOnButcher(this.req.user, butcher.id)) {
                return null
            }
        };

        return butcher;
    }

    
    async saveProductsForButchers() {


        let butcher = await this.getButcher();

        if (!butcher) {
            return new PermissionError()
        }


        let productid = parseInt(this.req.body.id);
        let product = await Product.findOne({
            where: {
                id: productid
            }
        })
        let newItem: ButcherProduct = await ButcherProduct.findOne({
            where: {
                butcherid: butcher.id,
                productid: productid
            }
        });

        if (newItem == null)
            newItem = new ButcherProduct();



        newItem.enabled = this.req.body.enabled;
        newItem.butcherid = butcher.id;
        newItem.productid = productid;
        newItem.fromButcherDesc = this.req.body.note;

        newItem.unit1enabled = false;
        newItem.unit2enabled = false;
        newItem.unit3enabled = false;
        newItem.unit4enabled = false;
        newItem.unit5enabled = false;

        newItem.unit1weight = null;
        newItem.unit2weight = null;
        newItem.unit3weight = null;

        newItem.unit1price = 0;
        newItem.unit2price = 0;
        newItem.unit3price = 0;
        newItem.unit4price = 0;
        newItem.unit5price = 0; 

        newItem.unit1kgRatio = 0;
        newItem.unit2kgRatio = 0;
        newItem.unit3kgRatio = 0;

        newItem.kgPrice = 0;
        newItem.managerApproved = false;

        let unitPrice = this.req.body.units.find(u=>!u.id);
        if (unitPrice) {
            let other = this.req.body.units.find(u=>u.id && u.unit == unitPrice.unit);
            if (other) {
                other.price = Helper.parseFloat(unitPrice.price, 0);
                other.isPriceUnit = true;
                _.remove(this.req.body.units, u=>u == unitPrice);
            }
        }

        this.req.body.units.forEach(u => {
            let unitid = product.getUnitBy(u.unit);

            if (u.kgRatio && u.unit != unitPrice.unit && u.customWeight && (product[`${u.id}ButcherUnitEdit`] == 'weight' || product[`${u.id}ButcherUnitEdit`] == 'all')) {
                let butcherKgRatio = u.kgRatio;
                let productKgRatio = product[`${unitid}kgRatio`];
                if (butcherKgRatio != productKgRatio) {
                    newItem[`${unitid}kgRatio`] = butcherKgRatio;
                } else newItem[`${unitid}weight`] = null;
            }

            if (u.isPriceUnit || !u.id) {
                newItem.kgPrice = Helper.parseFloat(u.price, 0);
            }

            if (unitid) {
                if (u.price && !u.isPriceUnit && u.customPrice && 
                    (product[`${u.id}ButcherUnitEdit`] == 'price' || product[`${u.id}ButcherUnitEdit`] == 'all')) {
                    newItem[`${unitid}price`] = Helper.parseFloat(u.price);
                }
                if (u.isPriceUnit && !u.price) u.enabled = false;
                newItem[`${unitid}enabled`] = u.enabled;
            }
        });

        // product.availableUnitIds.forEach(u => {
        //     if (newItem.isNewRecord && product[`${u}ButcherUnitSelection`] == 'none-selected')
        //         newItem[`${u}enabled`] = true;
        //     else if (newItem.isNewRecord && product[`${u}ButcherUnitSelection`] == 'none-unselected')
        //         newItem[`${u}enabled`] = false;
        //     else if (product[`${u}ButcherUnitSelection`] == 'forced')
        //         newItem[`${u}enabled`] = true;
        // })

        if (!newItem.canBeEnabled()) newItem.enabled = false;
        if (newItem.enabled && product.offerableBy == 'manager' && !this.req.user.hasRole('admin')) {
            newItem.enabled = false;
        }


        await db.getContext().transaction((t: Transaction) => {
            return newItem.save({
                transaction: t
            }).then(() => butcher.approved ? ButcherPriceHistory.manageHistory(newItem, t) : null)
        })
        butcher = await Butcher.loadButcherWithProducts(this.req.params.butcher, true);
        let view = await this.getProductViewforButcher(product, butcher);
        let edit = this.getProductView2Edit(product, view)

        this.res.send(edit);
    }

   @Auth.Anonymous() 
    async getProductQuickInfo() {
        if (!this.req.query.id) return this.next;
        let p = await Product.findOne({
            where: {id: this.req.query.id}
        });
        if (!p) return this.next;
        let butcher: Butcher = null;
        if (this.req.query.butcher) {
            butcher = await Butcher.loadButcherWithProducts(this.req.query.butcher as string, false);
        }
        let view = await this.getProductView(p, butcher, null, false, false);
        view['thumbnail'] = this.req.helper.imgUrl("product-photos", view.slug)
        let result = butcher ? (view.source != 'butcher' ? null: view): view;
        if (result) {
            let r = {
                name: view.name,
                id: view.id,
                slug: view.slug,
                thumbnail: view['thumbnail'],
                butcher: view.butcher ? {
                    puanData: view.butcher.puanData,
                    slug: view.butcher.slug
                }: null,
                purchaseOptions: view.purchaseOptions.map(po=> {
                    return {
                        default: po.default,
                        min: po.min,
                        max: po.max,
                        unit: po.unit,
                        unitTitle: po.unitTitle,
                        step: po.step,
                        unitWeight: po.unitWeight,
                        notePlaceholder: po.notePlaceholder,
                        unitPrice: po.unitPrice
                    }
                })
            }
            this.res.send(r)
        } else this.res.send(null)
    }

    static SetRoutes(router: express.Router) {
        // router.get("/product/:slug", Route.BindRequest(this.prototype.searchRoute));
        // router.get("/product/:slug/:butcher", Route.BindRequest(this.prototype.searchRoute));
        router.get("/product/:butcher/prePrices", Route.BindRequest(this.prototype.viewProductsForButchers));
        router.post("/product/:butcher/prePrices", Route.BindRequest(this.prototype.saveProductsForButchers));
        router.post("/product/:butcher/campaign", Route.BindRequest(this.prototype.saveCampaign));
        router.get("/product/quickinfo", Route.BindRequest(this.prototype.getProductQuickInfo));

        
        
    }
}


