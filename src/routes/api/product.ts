import { Auth } from '../../lib/common';
import { ApiRouter } from '../../lib/router';
import * as express from "express";
import { ProductView } from '../../models/productView';
import Product, { ProductSelectionWeigts, ProductType } from '../../db/models/product';
import Butcher from '../../db/models/butcher';
import ButcherProduct from '../../db/models/butcherproduct';
import Helper from '../../lib/helper';
var MarkdownIt = require('markdown-it')
import * as sq from 'sequelize';
import * as builder from "xmlbuilder"

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
const fs = require('fs');

export interface ProductFeedItem {
    id: string;
    title: string;
    description: string;
    link: string;
    images: string [];
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

export type ButcherProperty = 'distance' |  'rating' | 'kasapkart' | 'productPrice' | 'shipmentPrice' | 'shipTotal' | 'butcherSelection' | 'productSelection';

let ButcherPropertyWeigts: {[key in ButcherProperty]: number} = {
    'distance': -0.80,
    'kasapkart': 0.60,
    'productPrice': 0.00,
    'shipmentPrice': 0.00,
    'rating': 0.40,
    'shipTotal': 0.00,
    'butcherSelection': 1.00,
    'productSelection': 1.00
}

export default class Route extends ApiRouter {
    markdown = new MarkdownIt();

    async getButcherPropertyWeights(): Promise<{[key in ButcherProperty]: number}> {
        let rawdata = await fs.readFileSync(path.join(__dirname, "../../../butcherweights.json"));
        return JSON.parse(rawdata);
    }


    async calculateButcherRate(butcher: Butcher, product: Product, dispatcher: Dispatcher, limits: {[key in ButcherProperty]: number []}, customerFee: number, weights: {[key in ButcherProperty]: number}) {
        let bp = butcher.products.find(p=>p.productid == product.id);
        let butcherWeight = DispatcherSelectionWeigts[dispatcher.selection];
        if (butcherWeight == 0 && butcher.selectionRadiusAsKm > 0) {
            butcherWeight = dispatcher.butcherArea.bestKm <= butcher.selectionRadiusAsKm ? 1: butcherWeight;
        }
        let butcherweights: {[key in ButcherProperty]: number} = {
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
        for(let k in butcherweights) {
            let lim = limits[k];
            let propPuan = Helper.mapValues(butcherweights[k], lim[0], lim[1]);
            propPuan =Number.isNaN(propPuan) ? 0: propPuan*weights[k];
            config.nodeenv == "development" && console.log(k, propPuan.toFixed(2), '[', lim[0], lim[1], ']:', butcherweights[k]);
            puan+=propPuan
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
        WHERE r.type='order'  and r.ref1=o.id and oi.orderid = o.id and oi.productid=:pid
        and (:butcherid = 0 || :butcherid = ref2)
        ORDER BY r.ID DESC
        `
        ,
        {
            replacements: { butcherid: butcherid,  pid: productid },
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

    async getPriceStatsForUnit(productids: number [], unit: string, butcherids: number [] = [], options = {}): Promise<Array<any>> {
        let sql = `(${productids.join(',')})`;
        let butchers = `(${butcherids.join(',')})`;
        let q = `select ButcherProducts.productid as pid,  count(*) as count, 
        min(${unit}Price) as ${unit}min, avg(${unit}Price) as ${unit}avg, max(${unit}Price) as ${unit}max
        from ButcherProducts, Butchers 
        where 
        ${butcherids.length > 0 ? 'Butchers.id in ' + butchers + ' and ':''}
        ButcherProducts.productid in ${sql} and 
        ButcherProducts.${unit}Price > 0 and
        ButcherProducts.enabled=true and 
        ButcherProducts.butcherid = Butchers.id 
        and Butchers.approved=true and Butchers.status='open'
        group by ButcherProducts.productid
        `

        let res = await Product.sequelize.query<any>(q, {
            raw: true  ,
            mapToModel: false,
            type: sq.QueryTypes.SELECT       
        } )        

        return res;
    }    


    async getPriceStats(productids: number [], butcherids: number[]=[], options = {}): Promise<Array<any>> {

        let units = ['kg', 'unit1', 'unit2', 'unit3'];
        let res: Array<any> = [];
        let pids = [...productids];
        for(let i = 0; i < units.length; i++) {
            let stats = await this.getPriceStatsForUnit(pids,  units[i], butcherids, options = {});
            res = res.concat(stats);
            pids = pids.filter(p=>!res.find(r=>r.pid == p))
            if (pids.length == 0) break;
        }

       
        return res;
    }

     getProductsFeedXML(products: ProductFeedItem []): builder.XMLElement {

        var feed = builder.create('feed').att("xmlns", "http://www.w3.org/2005/Atom").att("xmlns:g","http://base.google.com/ns/1.0"); 
                feed.ele("title", "KasaptanAl.com") ;   
                feed.ele("link", 'https://www.kasaptanal.com').att("rel", "self") ;   
                feed.ele("updated", new Date().toISOString()) ;   
                
                products.forEach( p => {
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
                       (i < 5) && entry.ele(i == 0? "g:image_link":"g:additional_image_link", `${im}`);
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
        let maxDistance = Math.max.apply(Math, serving.map(s=>s.butcherArea.bestKm));

        //let minPuan = Math.min.apply(Math, serving.map(s=>s.butcher.customerPuanRate));
        //let maxPuan = Math.max.apply(Math, serving.map(s=>s.butcher.customerPuanRate));

        //let minRate = Math.min.apply(Math, serving.map(s=>s.butcher.totalRatingAsPerc));
        //let maxRate = Math.max.apply(Math, serving.map(s=>s.butcher.totalRatingAsPerc));

        let minShipTotal = Math.min.apply(Math, serving.map(s=>s.butcher.shipTotalCount));
        let maxShipTotal = Math.max.apply(Math, serving.map(s=>s.butcher.shipTotalCount));

        let minPrice = Math.min.apply(Math, serving.map(s=> {
            let bp = s.butcher.products.find(p=>p.productid == product.id);
            bp.product = product;
            return bp.priceView.price;
        }));

        let maxPrice = Math.max.apply(Math, serving.map(s=> {
            let bp = s.butcher.products.find(p=>p.productid == product.id);
            bp.product = product;
            return bp.priceView.price;
        }));      
        let weights = await this.getButcherPropertyWeights();

        let l1 = adr.based.getLevel(1);
        let l2 = adr.based.getLevel(2);
        let l3 = adr.based.getLevel(3);

        let orderSize = l3.butcherWeightOrder || l2.butcherWeightOrder || l1.butcherWeightOrder || 150.00;

        let customerFees: {[key: number]: number} = {}, minFee = Number.MAX_SAFE_INTEGER, maxFee = Number.MIN_SAFE_INTEGER;
        
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


        let limits: {[key in ButcherProperty]: number []} = {
            'distance': [0, maxDistance],
            'kasapkart': [0.00, 0.10],
            'productPrice': [minPrice, maxPrice],
            'shipmentPrice': [minFee, maxFee],
            'rating': [80, 100],
            'shipTotal': [0, maxShipTotal],
            'butcherSelection': [-1,1],
            'productSelection': [-1,1]
        }



        weights = l1.butcherWeights ? {...weights, ...l1.butcherWeights}: weights; 
        weights = l2.butcherWeights ? {...weights, ...l2.butcherWeights}: weights; 
        weights = l3.butcherWeights ? {...weights, ...l3.butcherWeights}: weights; 

        weights = product.butcherWeights ? {...weights, ...product.butcherWeights}: weights; 

        for(let i = 0; i < serving.length;i ++) {
            
            serving[i].butcher.calculatedRate = await this.calculateButcherRate(serving[i].butcher, product, serving[i], limits, typeof customerFees[serving[i].butcher.id] == 'undefined' ? maxFee: customerFees[serving[i].butcher.id], weights)
        }

        let weightSorted = _.orderBy(serving, 'butcher.calculatedRate', 'desc');

        return weightSorted;

      
    }

    async getProductsFeed(options: ProductLdOptions): Promise<ProductFeedItem []> {
        let res: ProductFeedItem [] = [];
        let products = await Product.findAll({ 
             where: { status: "onsale" }
        });



        for(let i = 0; i < products.length; i++) {
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

  async getProductsFeedOfButcher(butcher: Butcher, options: ProductLdOptions): Promise<ProductFeedItem []> {
    let res: ProductFeedItem [] = [];
    // let products = await Product.findAll({ 
    //      where: { status: "onsale" }
    // });

    let products = butcher.products;


    for(let i = 0; i < products.length; i++) {
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
            for(let i = 0; i < units.length;i++) {
                let avgPrice = price[`${units[i]}avg`];
                if (avgPrice > 0)  {
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
                    highPrice: high ,
                    lowPrice: low,
                    unit: usedUnit == "kg" ? "KG": product[`${usedUnit}title`],
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

    getPurchaseOptions(product: Product, butcherProduct?: ButcherProduct) {
        let purchaseOptions =[];
        let kgPrice = butcherProduct ? butcherProduct.kgPrice : 0.00;
        this.getProductUnits(product).forEach((p, i) => {
            let col = `unit${i + 1}`
            let add = !butcherProduct ? true: (butcherProduct[`${col}enabled`]);
            add && purchaseOptions.push({
                id: i + 1,
                notePlaceholder: product[`${col}note`],
                desc: this.markdown.render(product[`${col}desc`] || ""),
                kgRatio: product[`${col}kgRatio`],
                unitWeight: (butcherProduct && butcherProduct[`${col}weight`]) || product[`${col}weight`],
                unitPrice: butcherProduct ?
                     (
                         Helper.asCurrency(butcherProduct[`${col}price`]) > 0 ?
                         Helper.asCurrency(butcherProduct[`${col}price`]):
                         Helper.asCurrency( (butcherProduct[`${col}kgRatio`] || product[`${col}kgRatio`]) * kgPrice)
                     ):
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
            })
        })
        return _.sortBy(purchaseOptions, ["displayOrder"]).reverse()
    }

    async getProductView(product: Product, butcher?: Butcher, butcherProduct?: ButcherProduct, loadResources: boolean = false) {
        if (!butcherProduct && butcher && !butcher.products) {
            butcherProduct = await ButcherProduct.findOne({
                where: {
                    productid: product.id,
                    butcherid: butcher.id,
                    enabled: true
                }
            })
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

        let view: ProductView;
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
                id: butcher.id           ,
                puanData: butcher.getPuanData(product.productType),
                earnedPuan: 0.00,
                productNote: '',     
                kgPrice: kgPrice,
                calculatedRate: butcher.calculatedRate,
                locationText: butcher.locationText,                
            } : null,
            butcherNote: (butcherProduct && butcherProduct.mddesc) ? butcherProduct.mddesc: '',
            butcherLongNote: (butcherProduct && butcherProduct.longdesc) ? butcherProduct.longdesc: '',
            slug: product.slug,
            name: product.name,
            kgPrice: kgPrice,
            productType: product.productType,
            shortDesc: product.shortdesc,
            notePlaceholder: product.notePlaceholder,
            priceView: null,
            shipmentDayHours: Shipment.getShipmentDays(),
            // viewUnitPrice: defaultUnitPrice,
            // viewUnit: defaultUnitText,
            // viewUnitDesc: product[`${defaultUnitCol}desc`] || (defaultUnit == 'kg' ? 'kg' : ''),
            // defaultUnit: product.defaultUnit,
            // viewUnitAmount: product.defaultAmount,
            purchaseOptions: [],
            alternateButchers: [],
            nutritionView: null
        }

        if (loadResources) {
            view.resources = [];
            product.resources.forEach(r=>view.resources.push(r.asView()))
        }

        view.nutritionView = product.nutritionView;


        view.purchaseOptions = this.getPurchaseOptions(product, butcherProduct); 

        if (view.purchaseOptions.length) {
            view.priceView = {
                price: view.purchaseOptions[0].unitPrice,
                unitTitle: view.purchaseOptions[0].unitTitle,
                unit: view.purchaseOptions[0].unit
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

    static SetRoutes(router: express.Router) {
        // router.get("/product/:slug", Route.BindRequest(this.prototype.searchRoute));
        // router.get("/product/:slug/:butcher", Route.BindRequest(this.prototype.searchRoute));
    }
}


