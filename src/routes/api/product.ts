import { Auth } from '../../lib/common';
import { ApiRouter } from '../../lib/router';
import * as express from "express";
import { ProductView } from '../../models/productView';
import Product from '../../db/models/product';
import Butcher from '../../db/models/butcher';
import ButcherProduct from '../../db/models/butcherproduct';
import Helper from '../../lib/helper';
var MarkdownIt = require('markdown-it')

import * as _ from 'lodash';
import Resource from '../../db/models/resource';
import ResourceCategory from '../../db/models/resourcecategory';
import Category from '../../db/models/category';
import { Op } from 'sequelize';

export default class Route extends ApiRouter {
    markdown = new MarkdownIt();

    async getFoodResources(products4?: Product[], limit?: number, catids?: number[]) {
        return this.getResources({
            type: ['product-videos', 'product-photos'],
            tag1: {
                [Op.like]: '%yemek%', 
            }
        }, products4, limit, catids)
    }

    async getFoodAndTarifResources(products4?: Product[], limit?: number, catids?: number[]) {
        return this.getResources({
            type: ['product-videos', 'product-photos'],
            tag1: {
                [Op.or]: [{
                    [Op.like]: '%yemek%'
                             
                }, {[Op.like]: '%tarif%'}]
            }
        }, products4, limit, catids)
    }

    async getResources(where, products4?: Product[], limit?: number, catids?: number[]) {
        if (products4) {
            let ids = products4.map(p => p.id);
            where = { ...{
                [Op.or]: {
                ref1: ids,
                ref2: ids,
                ref3: ids,
                ref4: ids,
                ref5: ids
            }},
            ...where
        }
        } 
        if (catids) where['$categories.category.id$'] = catids;
        let params = {
            where: where,
            include: [{
                model: ResourceCategory,
                as: 'categories',
                include: [{
                    model: Category
                }
                ]
            }],
            order: [[{ model: ResourceCategory, as: 'categories' }, "displayOrder", "desc"], ["displayOrder", "desc"], ["updatedOn", "desc"]]
        }
        if (limit) params['limit'] = limit;
        let allresources = await Resource.findAll(<any>params);

        let products = products4 || await Product.findAll({
            where: {
                id: allresources.map(p => p.ref1).concat(allresources.filter(p => p.ref2).map(p => p.ref2)).concat(allresources.filter(p => p.ref3).map(p => p.ref3)).concat(allresources.filter(p => p.ref4).map(p => p.ref4)).concat(allresources.filter(p => p.ref5).map(p => p.ref5))
            }
        })

        let resources = [];

        allresources.forEach(res => {
            let product1 = products.find(prod => prod.id == res.ref1);
            let product2 = res.ref2 ? products.find(prod => prod.id == res.ref2): null;
            let product3 = res.ref3 ? products.find(prod => prod.id == res.ref3): null;
            let product4 = res.ref4 ? products.find(prod => prod.id == res.ref4): null;
            let product5 = res.ref5 ? products.find(prod => prod.id == res.ref5): null;
            if (product1) {
                res.product = product1;
                resources.push(res);
            }
            if (product2) {
                res.otherProducts = res.otherProducts || []
                res.otherProducts = [product2];
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


    async getTarifVideos(products4?: Product[], limit?: number, catids?: number[]) {
        return this.getResources({
            type: 'product-videos',
            tag1: {
                [Op.like]: '%tarif%', 
            } 
        }, products4, limit, catids)
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

    async getProductView(product: Product, butcher?: Butcher, butcherProduct?: ButcherProduct) {
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


        let kgPrice = butcherProduct ? butcherProduct.kgPrice : product.kgPrice;
        let defaultUnitCol = `unit${product.defaultUnit}`
        let defaultUnitPrice = 0.0;
        let defaultUnitText = "";
        let kgRatio = 0.00;
        let defaultUnit = "";
        if (product.defaultUnit == 0) {
            kgRatio = 1.00;
            defaultUnit = 'kg'
        } else {
            kgRatio = product[`${defaultUnitCol}kgRatio`]
            defaultUnit = product[`${defaultUnitCol}`]
        }
        defaultUnitPrice = Helper.asCurrency(Helper.asCurrency(kgRatio * kgPrice) * product.defaultAmount);
        defaultUnitText = defaultUnit == 'kg' ? (product.defaultAmount < 1 ? `${product.defaultAmount * 1000}gr` : "kg") : product[`${defaultUnitCol}`]

        let view: ProductView;
        view = {
            id: product.id,
            butcher: butcherProduct ? {
                slug: butcher.slug,
                name: butcher.name,
                id: butcher.id
            } : null,
            slug: product.slug,
            name: product.name,
            kgPrice: kgPrice,
            shortDesc: product.shortdesc,
            notePlaceholder: product.notePlaceholder,
            viewUnitPrice: defaultUnitPrice,
            viewUnit: defaultUnitText,
            viewUnitDesc: product[`${defaultUnitCol}desc`] || (defaultUnit == 'kg' ? 'kg' : ''),
            defaultUnit: product.defaultUnit,
            viewUnitAmount: product.defaultAmount,
            purchaseOptions: []
        }

        this.getProductUnits(product).forEach((p, i) => {
            let col = `unit${i + 1}`

            view.purchaseOptions.push({
                id: i + 1,
                notePlaceholder: product[`${col}note`],
                desc: this.markdown.render(product[`${col}desc`] || ""),
                kgRatio: product[`${col}kgRatio`],
                unitPrice: Helper.asCurrency(product[`${col}kgRatio`] * kgPrice),
                unit: p,
                unitTitle: product[`${col}title`],
                displayOrder: product[`${col}Order`],
                min: product[`${col}min`],
                max: product[`${col}max`],
                default: product[`${col}def`],
                perPerson: product[`${col}perPerson`],
                step: product[`${col}step`],
            })
        })

        view.purchaseOptions = _.sortBy(view.purchaseOptions, ["displayOrder"]).reverse()

        return view;
    }

    @Auth.Anonymous()
    async searchRoute() {
        let product = await Product.findOne({
            where: {
                slug: this.req.params.slug
            }
        })

        let butcher: Butcher = this.req.params.butcher ? await Butcher.findOne(
            {
                include: [{
                    all: true
                }],
                where: {
                    slug: this.req.params.butcher
                }
            }
        ) : null;

        let view = this.getProductView(product, butcher)
        this.res.send(view)
    }

    static SetRoutes(router: express.Router) {
        router.get("/product/:slug", Route.BindRequest(this.prototype.searchRoute));
        router.get("/product/:slug/:butcher", Route.BindRequest(this.prototype.searchRoute));
    }
}


