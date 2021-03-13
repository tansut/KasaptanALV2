import { ApiRouter, ViewRouter } from '../../lib/router';
import * as express from "express";
import ProductModel from '../../db/models/product';
import moment = require('moment');
import { Auth } from '../../lib/common';
import Area from '../../db/models/area';
import Resource from '../../db/models/resource';
import { parse } from 'querystring';
import { threadId } from 'worker_threads';
import Helper from '../../lib/helper';
import Category from '../../db/models/category';
import ProductCategory from '../../db/models/productcategory';
import ProductManager from '../../lib/productManager';

export default class Route extends ViewRouter {

    product: ProductModel;

    
    async listViewRoute() {

        let data = await Category.findAll({
            order: ["name", "type"]
        })

        this.res.render('pages/admin/category.list.ejs', this.viewData({ categories: data }))
    }

    async saveProductViewRoute() {
        let category = await Category.findOne({
            where: {
                slug: this.req.params.category
            }
        });

        let products = await ProductManager.getProductsOfCategories([category.id]);
        let product = products.find(p=>p.id == parseInt(this.req.body.productid));
        let pcategory = product.categories.find(p=>p.categoryid == category.id);
        if (this.req.body.op == 'update') {
            pcategory.displayOrder = parseInt(this.req.body.displayorder);
            await pcategory.save();
        } else {
            await pcategory.destroy();
        }

        products = await ProductManager.getProductsOfCategories([category.id]);

        this.res.render('pages/admin/category.productlist.ejs', this.viewData({ category: category, products: products }))

    }

    
    async productViewRoute() {

        let category = await Category.findOne({
            where: {
                slug: this.req.params.category
            }
        })

        let products = await ProductManager.getProductsOfCategories([category.id]);
            
        this.res.render('pages/admin/category.productlist.ejs', this.viewData({ category: category, products: products }))
    }

    static SetRoutes(router: express.Router) {
        router.get("/category/list", Route.BindRequest(Route.prototype.listViewRoute));
        router.get("/category/:category/products", Route.BindRequest(Route.prototype.productViewRoute));
        router.post("/category/:category/products", Route.BindRequest(Route.prototype.saveProductViewRoute));
    }
}

