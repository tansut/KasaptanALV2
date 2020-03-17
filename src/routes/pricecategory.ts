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
import { Op } from 'sequelize';
import config from '../config';
import PriceCategory from '../db/models/pricecategory';

export default class Route extends ViewRouter {

    category: PriceCategory;
    products: Product[];

    renderPage(view: string) {
        let pageTitle =  this.category.pageTitle;
        let pageDescription = this.category.pageDescription;
        this.res.render(view, this.viewData({
            pageTitle: pageTitle || this.category.name,
            pageDescription: pageDescription,
            pageThumbnail: this.req.helper.imgUrl('category-photos', this.category.category.slug)
        }))
    }


    @Auth.Anonymous()
    async viewAllRoute() {
        this.renderView("pages/reyon-price-view.ejs")
    }

    @Auth.Anonymous()
    async viewProductCategoryRoute(back: boolean = false) {
        if (!this.req.params.category) {
            return this.next();
        }
        this.category = this.req.__pricecategories.find(p => p.slug == this.req.params.category);
        if (!this.category) return this.next();

        this.products = await ProductManager.getProductsOfCategories([this.category.categoryid]);

        this.renderPage('pages/pricecategory.ejs')

        
    }



    static SetRoutes(router: express.Router) {
        router.get("/:category", Route.BindRequest(Route.prototype.viewProductCategoryRoute));
        router.get("/et-fiyatlari", Route.BindRequest(Route.prototype.viewAllRoute));
    }
}