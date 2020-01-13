import * as Cache from "node-cache";
import Category from "../db/models/category";
import Product from "../db/models/product";
import ProductCategory from "../db/models/productcategory";
import ProductManager from "./productManager";
import Butcher from "../db/models/butcher";
import Area from "../db/models/area";
import * as express from 'express';
import { AppRequest } from "./http";
import * as path from 'path';
import * as _ from "lodash";
import config from "../config";
import Helper from "./helper";
import { RequestHelper } from "./RequestHelper";
import Resource from "../db/models/resource";
import Content from "../db/models/content";

let cache: Cache;

export interface ResourceCacheItem {
    ref1: number;
    contentUrl: string;
    thumbnailUrl: string;
    folder: string;
}

export interface ProductCacheItem {
    id: number;
    slug: string;
    tag2: string;
    name: string;
    badge: string;
}

export interface ButcherCacheItem {
    id: number;
    //slug: string;
    name: string;
}

export interface CategoryProductItem {
    slug: string;
}

export class CacheManager {

    static dataCache = new Cache();

    static clear() {
        this.dataCache.flushAll();
    }

    static use(app: express.Application) {
        app.use((req: AppRequest, res, next) => {          
            CacheManager.generateDataCache().then(p => {
                res.locals.__categories = p.categories;
                req.__categories = p.categories;
                req.__resources = p.resources;
                req.__products = p.products;
                req.__recentBlogs = p.recentBlogs;
                req.__categoryProducts = p.categoryProducts;
                req.__butchers = p.butchers;
                res.locals._ = _;
                res.locals.__cities = p.cities;
                res.locals.__butcherCities = p.butcherCities
                res.locals.__req = req
                res.locals.__viewRoot = path.join(__dirname, '../src/views')
                res.locals.__config = config;
                res.locals.__helper = Helper;
                next();
            }).catch(next)
        })
    }

    static async fillButcherCities(cities) {
        let result = this.dataCache.get("butcher-cities");
        if (!result) {
            let citiesOfButchers: any = await Butcher.aggregate('areaLevel1Id', 'DISTINCT', { plain: false });
            result = []
            for (let i = 0; i < citiesOfButchers.length; i++) {
                (<any>result).push(cities[citiesOfButchers[i]['DISTINCT']])
            }
            this.dataCache.set("butcher-cities", result);

        }
        return result;
    }

    static async fillRecentBlogs() {
        let result = this.dataCache.get("recent-blogs");
        if (!result) {
            result = await Content.findAll({
                raw: true,
                attributes: ["title", "category", "description", "slug", "categorySlug"],
                order: [["UpdatedOn", "DESC"]],
                limit: 15
            });
            this.dataCache.set("recent-blogs", result);
        }
        return result
    }

    static async fillCities() {
        let result = this.dataCache.get("cities");
        if (!result) {
            result = {};
            await Area.findAll({
                where: {
                    level: 1
                },
                raw: true
            }).then(data => {
                for (let i = 0; i < data.length; i++) {
                    result[data[i].id] = data[i]
                }
                this.dataCache.set("cities", result);
            })
        }
        return result
    }

    static async fillCategories(): Promise<Category[]> {
        let categories = <Category[]>this.dataCache.get("categories")
        if (!categories) {
            categories = await Category.findAll({
                raw: true,
                order: [["type", 'desc'], ["displayOrder", 'desc']]
            })
            this.dataCache.set("categories", categories);
        }
        return categories;
    }

    static async fillProductsByCategory(categories: Category[]) {
        let cacheproducts: { [key: string]: CategoryProductItem[] } = this.dataCache.get("category-products")
        if (!cacheproducts) {
            cacheproducts = {}
            for (let i = 0; i < categories.length; i++) {
                let prods = await ProductManager.getProductsOfCategories([categories[i].id])
                cacheproducts[categories[i].slug] = prods.map(pr => <CategoryProductItem>{
                    slug: pr.slug
                })
            }

            this.dataCache.set("category-products", cacheproducts);
        }
        return cacheproducts;
    }

    static async fillResources(): Promise<{ [key: string]: [ResourceCacheItem]; }> {
        let resources = <any>this.dataCache.get("resources")
        if (!resources) {
            let res = await Resource.findAll({
                raw: true,
                order: [["type", 'desc'], ["displayOrder", "DESC"], ["updatedOn", "DESC"]]
            })
            let result: { [key: string]: ResourceCacheItem[]; } = {};
            res.forEach((ri, i) => {
                if (!result[ri.type])
                    result[ri.type] = [];
                if (!result[ri.type + ri.ref1])
                    result[ri.type + ri.ref1] = [];
                if (!result[ri.type + ri.contentUrl])
                    result[ri.type + ri.contentUrl] = [];
                let obj = {
                    contentUrl: ri.contentUrl,
                    ref1: ri.ref1,
                    thumbnailUrl: ri.thumbnailUrl,
                    folder: ri.folder
                }
                //result[ri.type].push(obj)
                result[ri.type + ri.ref1].push(obj)
                result[ri.type + ri.contentUrl].push(obj)
            })
            resources = result;
            this.dataCache.set("resources", resources);
        }
        return resources;
    }

    static async fillProducts(): Promise<{ [key: string]: [ProductCacheItem]; }> {
        let products = <any>this.dataCache.get("products")
        if (!products) {
            let res = await Product.findAll({
                attributes: ['slug', 'id', 'tag2', 'badge', 'name'],
                raw: true,
                order: [["displayOrder", "DESC"]]
            })
            let result: { [key: string]: ProductCacheItem; } = {};
            res.forEach((ri, i) => {
                result[ri.slug] = {
                    id: ri.id,
                    slug: ri.slug,
                    name: ri.name,
                    tag2: ri.tag2,
                    badge: ri.badge
                }
            })
            products = result;
            this.dataCache.set("products", result);
        }
        return products;
    }

    static async fillButchers(): Promise<{ [key: string]: [ButcherCacheItem]; }> {
        let butchers = <any>this.dataCache.get("butchers")
        if (!butchers) {
            let res = await Butcher.findAll({
                attributes: ['name', 'id', 'slug'],
                raw: true,
                order: [['updatedon', 'DESC']]
            })
            let result: { [key: string]: ButcherCacheItem; } = {};
            res.forEach((ri, i) => {
                result[ri.slug] = {
                    id: ri.id,
                    name: ri.name
                }
            })
            butchers = result;
            this.dataCache.set("butchers", result);
        }
        return butchers;
    }

    static async generateDataCache() {
        let categories = await this.fillCategories();
        let products = <any>await this.fillProducts();
        let butchers = <any>await this.fillButchers();
        let cities = <any>await this.fillCities();
        let butcherCities = <any>await this.fillButcherCities(cities);
        let resources = <any>await this.fillResources();
        let recentBlogs = <any>await this.fillRecentBlogs();
        let categoryProducts = <any>await this.fillProductsByCategory(categories);
        return {
            categories: categories,
            products: products,
            cities: cities,
            butcherCities: butcherCities,
            resources: resources,
            recentBlogs: recentBlogs,
            categoryProducts: categoryProducts,
            butchers: butchers
        }
    }

    static init = () => {

    }
}

