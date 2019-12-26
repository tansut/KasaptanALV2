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

let cache: Cache;

export interface ResourceCacheItem {
    ref1: number;
    contentUrl: string;
    thumbnailUrl: string;
    folder: string;
}

export class CacheManager {

    static dataCache = new Cache();

    static clear() {
        this.dataCache.flushAll();
    }

    static use(app: express.Application) {
        app.use((req: AppRequest, res, next) => {
            let list = [];
            list.push(CacheManager.generateDataCache().then(p => {
                res.locals.__categories = p.categories;
                req.__categories = p.categories;
                req.__resources = p.resources;
                //res.locals.__products = p.products;
                res.locals._ = _;
                res.locals.__cities = p.cities;
                res.locals.__butcherCities = p.butcherCities
                res.locals.__req = req
                res.locals.__viewRoot = path.join(__dirname, '../src/views')
                res.locals.__config = config;
                res.locals.__helper = Helper;               
            }))
            Promise.all(list).then(r => {
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

    // static async fillProducts(categories: Category[]) {
    //     let cacheproducts = null;// this.dataCache.get("products")
    //     if (!cacheproducts) {
    //         let products = await Product.findAll({
    //             order: ["displayOrder"],
    //             include: [{
    //                 model: ProductCategory,
    //                 include: [Category]
    //             },
    //             ],
    //         })
    //         let productsByCategory = {}
    //         categories.map(p => {
    //             let prods = ProductManager.filterProductsByCategory(products, {
    //                 slug: p.slug
    //             })
    //             productsByCategory[p.slug] = (<any>prods) // .map(p => p.toJSON())
    //         });
    //         cacheproducts = {
    //             all: products, //.map(p => p.toJSON()),
    //             byCategory: productsByCategory
    //         }
    //         //this.dataCache.set("products", cacheproducts);
    //     }
    //     return cacheproducts;
    // }

    static async fillResources(): Promise<{ [key: string]: [ResourceCacheItem]; }>  {
        let resources = <any>this.dataCache.get("resources")
        if (!resources) {
            let res = await Resource.findAll({
                raw: true,
                order: [["type", 'desc'], ["updatedOn", "DESC"]]
            })
            let result: { [key: string]: ResourceCacheItem []; } = {};
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
            this.dataCache.set("resources", result);
        }
        return resources;
    }

    static async generateDataCache() {
        let categories = await this.fillCategories();
        //let products = <any>await this.fillProducts(categories);
        let cities = <any>await this.fillCities();
        let butcherCities = <any>await this.fillButcherCities(cities);
        let resources = <any>await this.fillResources();
        return {
            categories: categories,
            //products: products,
            cities: cities,
            butcherCities: butcherCities,
            resources: resources
        }
    }

    static init = () => {

    }
}

