import { Auth } from '../../lib/common';
import { ApiRouter } from '../../lib/router';
import * as express from "express";
import { ProductView } from '../../models/productView';
import Product from '../../db/models/product';
import Butcher from '../../db/models/butcher';
import ButcherProduct from '../../db/models/butcherproduct';
import Helper from '../../lib/helper';
var MarkdownIt = require('markdown-it')
import * as sq from 'sequelize';


import * as _ from 'lodash';
import Resource from '../../db/models/resource';
import ResourceCategory from '../../db/models/resourcecategory';
import Category from '../../db/models/category';
import { Op } from 'sequelize';
import { ProductLd, IProductLd } from '../../models/ProductLd';
import DispatcherApi from './dispatcher';
import Review from '../../db/models/review';

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

export default class Route extends ApiRouter {
    markdown = new MarkdownIt();

    async getFoodResources(products4?: Product[], limit?: number, catids?: number[], options = {}) {
        return this.getResources({
            list: true,
            type: ['product-videos', 'product-photos'],
            tag1: {
                [Op.like]: '%yemek%',
            }
        }, products4, limit, catids, options)
    }

    async loadReviews(productid: number) {
        let res: Review[] = await Review.sequelize.query(`
        SELECT r.* FROM Reviews r, Orders o, OrderItems oi 
        WHERE r.type='order' and oi.status='teslim edildi' and r.ref1=o.id and oi.orderid = o.id and oi.productid=:pid
        ORDER BY r.ID DESC
        `
        ,
        {
            replacements: { pid: productid },
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


    async getPriceStats(productids: number []): Promise<Array<any>> {
        let sql = `(${productids.join(',')})`
        let q = `select ButcherProducts.productid as pid,  count(*) as count, 
        min(kgPrice) as kgmin, avg(kgPrice) as kgavg, max(kgPrice) as kgmax, 
        min(unit1price) as unit1min, avg(unit1price) as unit1avg, max(unit1price) as unit1max,
        min(unit2price)  as unit2min, avg(unit1price)  as unit2avg, max(unit2price) as unit2max,
        min(unit3price)  as unit3min, avg(unit1price)  as unit2avg, max(unit3price) as unit3max
        from ButcherProducts, Butchers 
        where 
        ButcherProducts.productid in ${sql} and 
        ButcherProducts.enabled=true and 
        ButcherProducts.butcherid = Butchers.id 
        and Butchers.approved=true
        group by ButcherProducts.productid
        `

        let res = await Product.sequelize.query<any>(q, {
            raw: true  ,
            mapToModel: false,
            type: sq.QueryTypes.SELECT       
        } )        

        return res;
    }

    async getProductsFeed(): Promise<ProductFeedItem []> {
        let res: ProductFeedItem [] = [];
        let products = await Product.findAll({ 
             where: { status: "onsale" }
        });

        for(let i = 0; i < products.length; i++) {
            let p = products[i];
            await p.loadResources();
            let ld = await this.getProductLd(p);
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
                    mpn: "",
                    gtin: "KA" + p.id.toString()
                }
                res.push(feed)
            }
        }

          

       return res;
  }



    async getProductLd(product: Product): Promise<IProductLd> {
        let res = new ProductLd(product)
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
                res.offers = {
                    '@type': "AggregateOffer",
                    offerCount: price['count'],
                    highPrice: Number(price[`${usedUnit}max`].toFixed(2)) ,
                    lowPrice: Number(price[`${usedUnit}min`].toFixed(2)),
                    priceCurrency: "TRY",
                    availability: "InStock"
                }
            }
        }

        return res;
  }

    @Auth.Anonymous()
    async getProductLdById(id: number) {
        let product = await Product.findOne({
            include: [{
                all: true 
            }], where: { slug: this.req.params.product }
        });
        if (!product) return this.res.sendStatus(404);

        await product.loadResources();
        return this.getProductLd(product);
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
                enableCreditCard: butcher.enableCreditCard,
                userRatingAsPerc: butcher.userRatingAsPerc,
                shipRatingAsPerc: butcher.shipRatingAsPerc,
                slug: butcher.slug,
                badges: butcher.getBadgeList(),
                name: butcher.name,
                id: butcher.id           ,
                puanData: butcher.getPuanData(product.productType),
                earnedPuan: 0.00,
                productNote: '',     
                kgPrice: kgPrice
            } : null,
            butcherNote: (butcherProduct && butcherProduct.mddesc) ? butcherProduct.mddesc: '',
            butcherLongNote: (butcherProduct && butcherProduct.longdesc) ? butcherProduct.longdesc: '',
            slug: product.slug,
            name: product.name,
            kgPrice: kgPrice,
            productType: product.productType,
            shortDesc: product.shortdesc,
            notePlaceholder: product.notePlaceholder,
            // viewUnitPrice: defaultUnitPrice,
            // viewUnit: defaultUnitText,
            // viewUnitDesc: product[`${defaultUnitCol}desc`] || (defaultUnit == 'kg' ? 'kg' : ''),
            // defaultUnit: product.defaultUnit,
            // viewUnitAmount: product.defaultAmount,
            purchaseOptions: [],
            alternateButchers: []
        }

        if (loadResources) {
            view.resources = [];
            product.resources.forEach(r=>view.resources.push(r.asView()))
        }


        view.purchaseOptions = this.getPurchaseOptions(product, butcherProduct); 

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


