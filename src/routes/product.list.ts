import { ApiRouter, ViewRouter } from '../lib/router';
import * as express from "express";
import * as maps from "@google/maps"
import ProductModel from '../db/models/product';
import { Auth } from '../lib/common';
import Helper from '../lib/helper';
import Resource from '../db/models/resource';
import ResourceRoute from './resource';
import * as path from "path"
import * as Jimp2 from 'jimp'
const Jimp = <Jimp2>require('jimp');
import * as fs from "fs"
import moment = require('moment');
import Category from '../db/models/category';
import ProductCategory from '../db/models/productcategory';
import { Json } from 'sequelize/types/lib/utils';
import ProductManager from '../lib/productManager';
let ellipsis = require('text-ellipsis');
import * as _ from "lodash";
import Product from '../db/models/product';

export default class Route extends ViewRouter {

    products: [];
    categories: Category[];


    browseTypes = { 
        reyon: 'Reyonlar',
        list: 'Listeler'
    }
    


    filterProductsByCategory(slug: string, chunk: number = 0) {
        let products = ProductManager.filterProductsByCategory(this.products, { slug: slug }, { productType: 'generic' }, { chunk: chunk })
        return products;
    }


    filterCategories(type: string) {
        return ProductManager.filterCategories(this.categories, { type: type })
    }

     async fillProducts(categories: Category[]) {
        let cacheproducts = null;// this.dataCache.get("products")
        if (!cacheproducts) {
            let products = await ProductModel.findAll({
                order: ["displayOrder"],
                where: {
                    productType: 'generic'
                },
                include: [{
                    model: ProductCategory,
                    include: [Category]
                },
                ],
            })
            let productsByCategory = {}
            categories.map(p => {
                let prods = ProductManager.filterProductsByCategory(products, {
                    slug: p.slug
                })
                productsByCategory[p.slug] = (<any>prods) // .map(p => p.toJSON())
            });
            cacheproducts = {
                all: products, //.map(p => p.toJSON()),
                byCategory: productsByCategory
            }
            //this.dataCache.set("products", cacheproducts);
        }
        return cacheproducts;
    }



    @Auth.Anonymous()
    async productsView() {
        //this.products = await ProductManager.getProducts();
        //((this.categories = await ProductManager.getCategories();

        //((this.res.render('pages/all-products.ejs', this.viewData({ ellipsis: ellipsis, products: this.products }))
    }

    @Auth.Anonymous()
    async reyonView() {
        // this.products =  await ProductManager.getProducts();
        // this.categories = this.req.__categories;
        this.products = await this.fillProducts(this.req.__categories);
        this.sendView('pages/reyon-view.ejs', { ellipsis: ellipsis, products: this.products })
    }

    @Auth.Anonymous()
    async redirectedReyon() {
        this.res.redirect('/kasap-urunleri', 301);
    }



    static SetRoutes(router: express.Router) {
        //router.get("/tum-lezzetler", Route.BindRequest(Route.prototype.productsView));
        router.get("/lezzetler", Route.BindRequest(Route.prototype.redirectedReyon));
        router.get("/kasap-urunleri", Route.BindRequest(Route.prototype.reyonView));

    }
}