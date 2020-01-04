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

export default class Route extends ApiRouter {
    markdown = new MarkdownIt();

    async getFoodResources(products4?: Product[], limit?: number) {
        return this.getResources({
            type: ['product-videos', 'product-photos'],
            tag1: 'yemek'
        },products4, limit)
    }

    async getResources(where, products4?: Product[], limit?: number) {
        if (products4) where["ref1"] = products4.map(p=>p.id);
        let allresources = await Resource.findAll({
            where: where,
            limit: limit || 1000,
            include: [{
                model: ResourceCategory,
                as: 'categories',
                include: [{
                    model: Category}
                ]
            }],            
            order:  [['updatedon', 'DESC']]
        }); 

        let products = products4 || await Product.findAll({
            where: {
                id: allresources.map(p=>p.ref1)
            }
        })

        let resources = [];

        allresources.forEach(p=> {
            let product = products.find(r=>r.id == p.ref1);
            if (product) {
                p.product = product;
                resources.push(p);
            }  
        })

        return resources;        
    }   


    async getTarifVideos(products4?: Product[], limit?: number) {
        return this.getResources({
            type: 'product-videos',
            tag1: 'yemek-tarifi'
        }, products4, limit)          
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
                id: resources.map(p=>p.ref1)
            }
        })

        resources.forEach(p=> {
            p.product = products.find(r=>r.id == p.ref1)
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


