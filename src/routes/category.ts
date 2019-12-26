import { ApiRouter, ViewRouter } from '../lib/router';
import * as express from "express";
import * as maps from "@google/maps"
import ButcherModel from '../db/models/butcher';
import moment = require('moment');
import { Auth } from '../lib/common';
import AreaModel from '../db/models/area';
import Helper from '../lib/helper';
import Area from '../db/models/area';
import Category from '../db/models/category';
import Resource from '../db/models/resource';
let ellipsis = require('text-ellipsis');
import ResourceRoute from './resource';
import Product from '../db/models/product';
import ProductManager from '../lib/productManager';
import ProductsApi from './api/product';
import { ResourceCacheItem } from '../lib/cache';

export default class Route extends ViewRouter {

    category: Category;
    products: Product[];
    foods: Resource[];
    //categories: Category[];

    renderPage() {
        this.res.render('pages/category.ejs', this.viewData({
            pageTitle: this.category.name + ' Et Lezzetleri'
        }))
    }

    @Auth.Anonymous()
    async viewFoodsRoute() {
        let all = await ProductManager.getProducts();
        //this.categories = await ProductManager.getCategories();

        if (this.req.params.category) {
            this.category = this.req.__categories.find(p=>p.slug == this.req.params.category);

            if (!this.category) return this.next();
            this.products = <Product[]>ProductManager.filterProductsByCategory(all, { slug: this.category.slug }, { productType: 'generic' }, { chunk: 0 });
            this.foods = await new ProductsApi(this.constructorParams).getFoodsForProducts(this.products);
        } else {
            this.foods = await new ProductsApi(this.constructorParams).getFoods();
        }

        this.res.render('pages/foods.ejs', this.viewData({
            pageTitle: 'Et Yemek Tarifleri'
        }))
    }


    @Auth.Anonymous()
    async viewRoute(back: boolean = false) {
        if (!this.req.params.category) {
            return this.next();
        }

        this.category = this.req.__categories.find(p=>p.slug == this.req.params.category);

        if (!this.category) return this.next();

        let all = await ProductManager.getProducts();
        this.products = <Product[]>ProductManager.filterProductsByCategory(all, { slug: this.category.slug }, { productType: 'generic' }, { chunk: 0 });
        this.foods = await new ProductsApi(this.constructorParams).getFoodsForProducts(this.products);


        this.renderPage()

    }

    @Auth.Anonymous()
    async categoryPhotoRoute() {
        if (!this.req.params.category || !this.req.params.filename) return this.next();
        let category = this.req.__categories.find(p=>p.slug == this.req.params.category);
        if (!category)
            return this.next();

        let photo: ResourceCacheItem, thumbnail = this.req.query.thumbnail, url = "";

        let res = new ResourceRoute({
            req: this.req,
            res: this.res,
            next: this.next
        })

        let type = "category-photos";
        let defaultFile = "public/img/category-default-thumbnail.jpg";

        if (this.req.params.filename == "thumbnail") {
            thumbnail = true;
            photo = this.req.helper.getResourcesOfType(type + category.id).find(p=>p.ref1 == category.id)
        }
        else photo = this.req.helper.getResourcesOfType(type + this.req.params.filename).find(p=>p.contentUrl == this.req.params.filename);
        res.sendResource(photo, thumbnail, thumbnail ? defaultFile : null)
    }


    static SetRoutes(router: express.Router) {
        router.get("/:category", Route.BindRequest(Route.prototype.viewRoute));
        router.get("/et-yemek-tarifleri", Route.BindRequest(Route.prototype.viewFoodsRoute));
        router.get("/et-yemek-tarifleri/:category", Route.BindRequest(Route.prototype.viewFoodsRoute));
        router.get("/:category/resimler/:filename", Route.BindRequest(Route.prototype.categoryPhotoRoute));

    }
}