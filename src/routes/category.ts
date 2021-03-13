import { ApiRouter, ViewRouter } from '../lib/router';
import * as express from "express";
import ButcherModel from '../db/models/butcher';
import moment = require('moment');
import { Auth } from '../lib/common';
import AreaModel from '../db/models/area';
import Helper from '../lib/helper';
import Area from '../db/models/area';
import Category, { CategorySubItemsMode } from '../db/models/category';
import Resource from '../db/models/resource';
let ellipsis = require('text-ellipsis');
import ResourceRoute from './resource';
import Product from '../db/models/product';
import ProductManager from '../lib/productManager';
import ProductsApi from './api/product';
import { ResourceCacheItem } from '../lib/cache';
import { Op } from 'sequelize';
import config from '../config';
var MarkdownIt = require('markdown-it')
import * as _ from "lodash";
import SubCategory from '../db/models/subcategory';
import { flatMap } from 'lodash';
import DispatcherApi, { DispatcherQuery } from './api/dispatcher';
import { timeStamp } from 'console';


export default class Route extends ViewRouter {
    markdown = new MarkdownIt();
    forceSemt = false;
    category: Category;
    products: Product[];
    foods: Resource[] = [];
    foodsWithCats = {}
    foodCategory = ""
    _ = _;
    subCategories: SubCategory[] = [];
    prices: Array<any> = [];




    renderPage(view: string, viewAsTarif: boolean = false) {
        let pageTitle = viewAsTarif ? (this.category.tarifPageTitle || this.category.tarifTitle) : this.category.pageTitle;
        let pageDescription = viewAsTarif ? this.category.tarifPageDesc : this.category.pageDescription;
        let append = (viewAsTarif || this.category.type == 'resource') ? '' : '';
        this.res.render(view, this.viewData({
            pageTitle: (pageTitle || this.category.name + ' Et Lezzetleri') + append,
            pageDescription: pageDescription,
            pageThumbnail: this.req.helper.imgUrl('category-photos', this.category.slug)
        }))
    }

    getFoods(category: Category) {
        return this.foodsWithCats[category.id] || [];
    }

    getPriceData(product: Product) {
        let price = this.prices.find(p=>p.pid == product.id);
        if (!price) return null;
        let units = ['kg', 'unit1', 'unit2', 'unit3'];
        let usedUnit = null;

        for(let i = 0; i < units.length;i++) {
            let avgPrice = price[`${units[i]}avg`];
            if (avgPrice > 0)  {
                usedUnit = units[i];
                break;
            }
        }
        if (usedUnit) {
            return {
                offerCount: price['count'],
                highPrice: Number(price[`${usedUnit}max`].toFixed(2)) ,
                lowPrice: Number(price[`${usedUnit}min`].toFixed(2)),
                priceUnit: usedUnit == 'kg' ? 'KG': product[`${usedUnit}title`],
                priceCurrency: "TRY"
            }
        } else return null;

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

    async fillTarifs(categoryid?: number, subcategory?: string, discardFoodCategory: boolean = false) {
        if (subcategory) {
            let category = this.req.__categories.find(p => p.slug == subcategory);
            this.products = await ProductManager.getProductsOfCategories([category.id])
            this.foods = await new ProductsApi(this.constructorParams).getTarifResources(this.products, null, (categoryid && !discardFoodCategory) ? [categoryid] : null);
            this.foodsWithCats = this.generateFoodWithCats(this.foods)
        } else {
            this.foods = await new ProductsApi(this.constructorParams).getTarifResources(null, null, categoryid ? [categoryid] : null);
            this.foodsWithCats = this.generateFoodWithCats(this.foods)
        }
    }

    @Auth.Anonymous()
    async foodsAndTarifsRoute() {
        this.foodCategory = this.req.query.tab as string;
        if (this.foodCategory == 'tarifler') {
            await this.fillTarifs();
        } else if (this.foodCategory == 'yemekler') {
            await this.fillFoods();
        } else await this.fillFoodsAndTarifs();


        this.sendView('pages/foods.ejs', {
            pageTitle: 'Et Yemekleri ve Tarifleri'
        })
    }

    @Auth.Anonymous()
    async viewTarifsRoute() {
        if (this.req.params.category) {
            this.category = this.req.__categories.find(p => p.slug == this.req.params.category);

            if (!this.category) return this.next();
            //await this.fillTarifs(this.req.params.category)
        } else {
            await this.fillTarifs();
        }

        this.res.render('pages/tarifs.ejs', this.viewData({
            pageTitle: 'Et Yemek Tarifleri'
        }))
    }




    @Auth.Anonymous()
    async viewAsFoodAndTarifRoute(back: boolean = false) {
        if (!this.req.params.category) {
            return this.next();
        }
        this.category = this.req.__categories.find(p => p.slug == this.req.params.category);
        if (!this.category) return this.next();

        this.foodCategory = this.req.query.tab as string;

        if (this.category.type == 'resource') {
            if (this.foodCategory == 'tarifler') {
                await this.fillTarifs(this.category.id);
            } else if (this.foodCategory == 'yemekler') {
                await this.fillFoods(this.category.id);
            } else await this.fillFoodsAndTarifs(this.category.id);
            this.renderPage('pages/category-food.ejs')
        } else {
            if (this.foodCategory == 'tarifler') {
                await this.fillTarifs(this.category.id, this.category.slug, true);
            } else if (this.foodCategory == 'yemekler') {
                await this.fillFoods(this.category.id, this.category.slug, true);
            } else await this.fillFoodsAndTarifs(this.category.id, this.category.slug, true);

            this.renderPage('pages/category-sub-food.ejs', true)
        }
    }



    @Auth.Anonymous()
    async viewProductCategoryRoute(back: boolean = false) {
        if (!this.req.params.category) {
            return this.next();
        }
        this.category = this.req.__categories.find(p => p.slug == this.req.params.category);
        if (!this.category) return this.next();

        if (this.category.type == 'resource') {
            return this.res.redirect('/et-yemekleri/' + this.category.slug, 301);
            //await this.fillFoods(this.category.id, this.req.params.subcategory);
            //this.renderPage('pages/category-food.ejs')
        }

        else if (this.category.type.startsWith("product")) {
            let parse = this.category.type.split(':');
            let filters = parse[1].split('=');
            let where = {};
            where[filters[0]] = filters[1];
            where['status'] = "onsale";
            this.products = await Product.findAll({
                where: where,
                order: ['tag1']
            });
            this.subCategories = ProductManager.generateSubcategories(this.category, this.products);

        } else {
            this.products = await ProductManager.getProductsOfCategories([this.category.id]);

            this.subCategories = ProductManager.generateSubcategories(this.category, this.products);


            if (this.category.relatedFoodCategory) {
                this.foods = await new ProductsApi(this.constructorParams).getFoodAndTarifResources(null, null, [this.category.relatedFoodCategory]);

            } else if (this.category.tarifTitle) {
                this.foods = await new ProductsApi(this.constructorParams).getFoodAndTarifResources(this.products, 15);
            }

        }

        let api = new ProductsApi(this.constructorParams);

        if (this.req.prefAddr) {
            let dapi = new DispatcherApi(this.constructorParams);
            let q: DispatcherQuery = {
                adr: this.req.prefAddr,
                excludeCitywide: this.category.slug != 'tum-turkiye',
            }
            let serving = await dapi.getDispatchers(q);
            this.prices = serving.length ? await api.getPriceStats(this.products.map(p=>p.id), serving.map(b=>b.butcherid)): []
        } else this.prices = []
        this.forceSemt = true;
        this.appUI.title = 'Ürünler';
        //this.appUI.tabIndex = 1;
        this.renderPage('pages/category.ejs')

    }

    @Auth.Anonymous()
    async categoryPhotoRoute() {
        if (!this.req.params.category || !this.req.params.filename) return this.next();
        let category = this.req.__categories.find(p => p.slug == this.req.params.category);
        if (!category)
            return this.next();

        let photo: ResourceCacheItem, thumbnail = false, url = "";

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
        router.get("/:category", Route.BindRequest(Route.prototype.viewProductCategoryRoute));
        router.get("/:category/et-yemekleri", Route.BindRequest(Route.prototype.viewAsFoodAndTarifRoute));
        router.get("/et-yemekleri", Route.BindRequest(Route.prototype.foodsAndTarifsRoute));
        router.get("/et-yemekleri/:category", Route.BindRequest(Route.prototype.viewAsFoodAndTarifRoute));




        // router.get("/et-yemek-tarifleri", Route.BindRequest(Route.prototype.viewTarifsRoute));

        // router.get("/et-yemek-tarifleri/kategori/:category", Route.BindRequest(Route.prototype.viewTarifsRoute));




        //router.get("/et-yemekleri/kategori/:category", Route.BindRequest(Route.prototype.viewFoodsRoute));
        config.nodeenv == 'development' ? router.get("/:category/resimler/:filename", Route.BindRequest(Route.prototype.categoryPhotoRoute)) : null;

    }
}