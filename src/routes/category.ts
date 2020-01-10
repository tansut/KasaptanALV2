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

export default class Route extends ViewRouter {

    category: Category;
    products: Product[];
    foods: Resource[];
    foodsWithCats = {}
    //categories: Category[];

    renderPage(view: string) {
        this.res.render(view, this.viewData({
            pageTitle: this.category.pageTitle || this.category.name + ' Et Lezzetleri',
            pageDescription: this.category.pageDescription
        }))
    }

    getFoods(category: Category) {
        return this.foodsWithCats[category.id] || [];
    }

    generateFoodWithCats(foods: Resource[]) {
        let res = {};

        foods.forEach(f => {
            f.categories.forEach(fc => {
                if (!res[fc.categoryid])
                    res[fc.categoryid] = [];
                res[fc.categoryid].push(f);
            })

        })
        return res;
    }

    async fillFoodsAndTarifs(categoryid?: number, subcategory?: string, discardFoodCategory: boolean = false) {
        if (subcategory) {
            let category = this.req.__categories.find(p => p.slug == subcategory);
            this.products = await ProductManager.getProductsOfCategories([category.id])
            this.foods = await new ProductsApi(this.constructorParams).getFoodAndTarifResources(this.products, null, (categoryid && !discardFoodCategory) ? [categoryid] : null);
            this.foodsWithCats = this.generateFoodWithCats(this.foods)
        } else {
            this.foods = await new ProductsApi(this.constructorParams).getFoodAndTarifResources(null, null, categoryid ? [categoryid] : null);
            this.foodsWithCats = this.generateFoodWithCats(this.foods)
        }
    }


    async fillFoods(categoryid?: number, subcategory?: string, discardFoodCategory: boolean = false) {
        if (subcategory) {
            let category = this.req.__categories.find(p => p.slug == subcategory);
            this.products = await ProductManager.getProductsOfCategories([category.id])
            this.foods = await new ProductsApi(this.constructorParams).getFoodResources(this.products, null, (categoryid && !discardFoodCategory) ? [categoryid] : null);
            this.foodsWithCats = this.generateFoodWithCats(this.foods)
        } else {
            this.foods = await new ProductsApi(this.constructorParams).getFoodResources(null, null, categoryid ? [categoryid] : null);
            this.foodsWithCats = this.generateFoodWithCats(this.foods)
        }
    }

    async fillTarifs(subcategory?: string) {
        if (subcategory) {
            let category = this.req.__categories.find(p => p.slug == subcategory);
            this.products = await ProductManager.getProductsOfCategories([category.id])
            this.foods = await new ProductsApi(this.constructorParams).getTarifVideos(this.products);
            this.foodsWithCats = this.generateFoodWithCats(this.foods)
        } else {
            this.foods = await new ProductsApi(this.constructorParams).getTarifVideos();
            this.foodsWithCats = this.generateFoodWithCats(this.foods)
        }
    }

    @Auth.Anonymous()
    async viewFoodsRoute() {
        if (this.req.params.category) {
            this.category = this.req.__categories.find(p => p.slug == this.req.params.category);
            if (!this.category) return this.next();
            await this.fillFoods(null, this.req.params.category)
        } else {
            await this.fillFoods();
        }

        this.res.render('pages/foods.ejs', this.viewData({
            pageTitle: 'Et Yemekleri'
        }))
    }

    @Auth.Anonymous()
    async viewTarifsRoute() {
        if (this.req.params.category) {
            this.category = this.req.__categories.find(p => p.slug == this.req.params.category);

            if (!this.category) return this.next();
            await this.fillTarifs(this.req.params.category)
        } else {
            await this.fillTarifs();
        }

        this.res.render('pages/tarifs.ejs', this.viewData({
            pageTitle: 'Et Yemek Tarifleri'
        }))
    }

    @Auth.Anonymous()
    async viewAsFoodRoute(back: boolean = false) {
        if (!this.req.params.category) {
            return this.next();
        }
        this.category = this.req.__categories.find(p => p.slug == this.req.params.category);
        if (!this.category) return this.next();

        await this.fillFoods(this.category.id, this.category.slug, true);
        this.renderPage('pages/category-food.ejs')
    }

    @Auth.Anonymous()
    async viewAsFoodAndTarifRoute(back: boolean = false) {
        if (!this.req.params.category) {
            return this.next();
        }
        this.category = this.req.__categories.find(p => p.slug == this.req.params.category);
        if (!this.category) return this.next();

        await this.fillFoodsAndTarifs(this.category.id, this.category.slug, true);
        this.renderPage('pages/category-food.ejs')
    }



    @Auth.Anonymous()
    async viewAsTarifRoute(back: boolean = false) {
        if (!this.req.params.category) {
            return this.next();
        }
        this.category = this.req.__categories.find(p => p.slug == this.req.params.category);
        if (!this.category) return this.next();

        await this.fillFoods(this.category.id, this.req.params.subcategory);
        this.renderPage('pages/category-food.ejs')
    }


    @Auth.Anonymous()
    async viewRoute(back: boolean = false) {
        if (!this.req.params.category) {
            return this.next();
        }
        this.category = this.req.__categories.find(p => p.slug == this.req.params.category);
        if (!this.category) return this.next();

        if (this.category.type == 'resource') {
            await this.fillFoods(this.category.id, this.req.params.subcategory);
            this.renderPage('pages/category-food.ejs')
        }

        else {
            this.products = await ProductManager.getProductsOfCategories([this.category.id]);
            // this.foods = Helper.shuffle(await new ProductsApi(this.constructorParams).getResources({tag1: ['tarif', 'yemek']}, this.products));
            this.foods = await new ProductsApi(this.constructorParams).getFoodAndTarifResources(this.products, 15);

            this.renderPage('pages/category.ejs')

        }
    }

    @Auth.Anonymous()
    async categoryPhotoRoute() {
        if (!this.req.params.category || !this.req.params.filename) return this.next();
        let category = this.req.__categories.find(p => p.slug == this.req.params.category);
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
            photo = this.req.helper.getResourcesOfType(type + category.id).find(p => p.ref1 == category.id)
        }
        else photo = this.req.helper.getResourcesOfType(type + this.req.params.filename).find(p => p.contentUrl == this.req.params.filename);
        res.sendResource(photo, thumbnail, thumbnail ? defaultFile : null)
    }


    static SetRoutes(router: express.Router) {
        router.get("/:category", Route.BindRequest(Route.prototype.viewRoute));
        router.get("/:category/et-yemekleri", Route.BindRequest(Route.prototype.viewAsFoodRoute));
        router.get("/:category/et-yemek-tarifleri", Route.BindRequest(Route.prototype.viewAsTarifRoute));
        router.get("/:category/et-yemekleri-ve-tarifleri", Route.BindRequest(Route.prototype.viewAsFoodAndTarifRoute));
        router.get("/:category/alt/:subcategory", Route.BindRequest(Route.prototype.viewRoute));
        router.get("/et-yemek-tarifleri", Route.BindRequest(Route.prototype.viewTarifsRoute));
        router.get("/et-yemek-tarifleri/:category", Route.BindRequest(Route.prototype.viewTarifsRoute));
        router.get("/et-yemekleri", Route.BindRequest(Route.prototype.viewFoodsRoute));
        router.get("/et-yemekleri/:category", Route.BindRequest(Route.prototype.viewFoodsRoute));
        //router.get("/:category/resimler/:filename", Route.BindRequest(Route.prototype.categoryPhotoRoute));

    }
}