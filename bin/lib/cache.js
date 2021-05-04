"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CacheManager = void 0;
const category_1 = require("../db/models/category");
const product_1 = require("../db/models/product");
const productManager_1 = require("./productManager");
const butcher_1 = require("../db/models/butcher");
const area_1 = require("../db/models/area");
const path = require("path");
const _ = require("lodash");
const config_1 = require("../config");
const helper_1 = require("./helper");
const resource_1 = require("../db/models/resource");
const content_1 = require("../db/models/content");
const webpage_1 = require("../db/models/webpage");
const redirect_1 = require("../db/models/redirect");
const pricecategory_1 = require("../db/models/pricecategory");
const subcategory_1 = require("../db/models/subcategory");
const redismanager_1 = require("./redismanager");
const fs = require('fs');
let cache;
class CacheManager {
    static clear() {
        this.dataCache.flushAll();
        this.cacheGenerated = false;
    }
    static use(app) {
        app.use((req, res, next) => {
            CacheManager.generateDataCache(req).then(p => {
                res.locals.__categories = p.categories;
                req.__categories = p.categories;
                req.__pricecategories = p.pricecategories;
                req.__resources = p.resources;
                req.__products = p.products;
                req.__recentBlogs = p.recentBlogs;
                req.__categoryProducts = p.categoryProducts;
                req.__butchers = p.butchers;
                req.__webpages = p.webPages;
                req.__redirects = p.redirects;
                res.locals._ = _;
                res.locals.__cities = p.cities;
                res.locals.__butcherCities = p.butcherCities;
                res.locals.__req = req;
                res.locals.__viewRoot = path.join(__dirname, '../src/views');
                res.locals.__config = config_1.default;
                res.locals.__helper = helper_1.default;
                next();
            }).catch(next);
        });
    }
    static fillButcherCities(cities) {
        return __awaiter(this, void 0, void 0, function* () {
            let result = yield this.dataCache.get("butcher-cities");
            if (!result) {
                let citiesOfButchers = yield butcher_1.default.aggregate('areaLevel1Id', 'DISTINCT', { plain: false });
                result = [];
                for (let i = 0; i < citiesOfButchers.length; i++) {
                    result.push(cities[citiesOfButchers[i]['DISTINCT']]);
                }
                yield this.dataCache.set("butcher-cities", result);
            }
            return result;
        });
    }
    static fillRecentBlogs() {
        return __awaiter(this, void 0, void 0, function* () {
            let result = yield this.dataCache.get("recent-blogs");
            if (!result) {
                result = yield content_1.default.findAll({
                    raw: true,
                    attributes: ["title", "category", "description", "slug", "categorySlug"],
                    order: [["DisplayOrder", "DESC"], ["UpdatedOn", "DESC"]],
                    limit: 10
                });
                yield this.dataCache.set("recent-blogs", result);
            }
            return result;
        });
    }
    // static async fillAppNav(url): Promise<AppNavData> {    
    //     url = (config.nodeenv == 'production') ? 'https://www.kasaptanal.com': 'http://192.168.2.236:3000'        
    //     let data: AppNavData =  await this.dataCache.get("app-nav-data");
    //     if (!data) {
    //         let rawdata = fs.readFileSync(path.join(config.projectDir, `app-nav-levels.json`));
    //         let result = <AppNavLevel[]>JSON.parse(rawdata);
    //         for(var i=0; i < result.length; i++) {
    //             result[i].regex = result[i].regex.replace('{root}', url)
    //         }
    //         let categories = await this.dataCache.get<Category[]>("categories") || await Category.findAll();
    //         for(var i = 0; i < categories.length;i++) {
    //             result.push({
    //                 regex: `${url}/${categories[i].slug}?`,
    //                 level: 2
    //             })
    //         }
    //         // let prods = <any>this.dataCache.get("products")
    //         // for (var o in prods) {
    //         //     result.push({
    //         //         regex: `${url}/${prods[o].slug}?`,
    //         //         level: 3
    //         //     })
    //         // }
    //         // let butchers = await Butcher.findAll();
    //         // for(var i = 0; i < butchers.length;i++) {
    //         //     result.push({
    //         //         regex: `${url}/${butchers[i].slug}?`,
    //         //         level: 2
    //         //     })
    //         // }
    //         data = {
    //             active: true,
    //             levels: result
    //         };
    //         await this.dataCache.set("app-nav-data", data);
    //     }
    //     return data;
    // }
    static fillRedirects() {
        return __awaiter(this, void 0, void 0, function* () {
            let result = yield this.dataCache.get("redirects");
            if (!result) {
                result = {};
                let list = yield redirect_1.default.findAll({
                    where: {
                        enabled: true
                    },
                    raw: true
                });
                list.forEach(item => {
                    result[item.fromUrl] = {
                        toUrl: item.toUrl,
                        permanent: item.permanent
                    };
                });
                yield this.dataCache.set("redirects", result);
            }
            return result;
        });
    }
    static fillWebPages() {
        return __awaiter(this, void 0, void 0, function* () {
            let result = yield this.dataCache.get("web-pages");
            if (!result) {
                result = {};
                let list = yield webpage_1.default.findAll({
                    raw: true
                });
                list.forEach(item => {
                    result[item.slug] = {
                        pageTitle: item.pageTitle,
                        pageDescription: item.pageDescription
                    };
                });
                yield this.dataCache.set("web-pages", result);
            }
            return result;
        });
    }
    static fillCities() {
        return __awaiter(this, void 0, void 0, function* () {
            let result = yield this.dataCache.get("cities");
            if (!result) {
                result = {};
                let data = yield area_1.default.findAll({
                    where: {
                        level: 1
                    },
                    raw: true
                });
                for (let i = 0; i < data.length; i++) {
                    result[data[i].id] = data[i];
                }
                yield this.dataCache.set("cities", result);
            }
            return result;
        });
    }
    static fillCategories() {
        return __awaiter(this, void 0, void 0, function* () {
            let categories = yield this.dataCache.get("categories");
            if (!categories) {
                categories = yield category_1.default.findAll({
                    raw: false,
                    include: [
                        {
                            model: subcategory_1.default,
                        }
                    ],
                    order: [["type", 'desc'], ["displayOrder", 'desc']]
                });
                categories = JSON.parse(JSON.stringify(categories));
                yield this.dataCache.set("categories", categories);
            }
            return categories;
        });
    }
    static fillPriceCategories(cats) {
        return __awaiter(this, void 0, void 0, function* () {
            let categories = yield this.dataCache.get("pricecategories");
            if (!categories) {
                categories = yield pricecategory_1.default.findAll({
                    raw: true,
                    order: [["displayOrder", 'desc']]
                });
                categories.forEach(m => {
                    m.category = cats.find(c => c.id == m.categoryid);
                });
                yield this.dataCache.set("pricecategories", categories);
            }
            return categories;
        });
    }
    static fillProductsByCategory(categories) {
        return __awaiter(this, void 0, void 0, function* () {
            let cacheproducts = yield this.dataCache.get("category-products");
            if (!cacheproducts) {
                cacheproducts = {};
                for (let i = 0; i < categories.length; i++) {
                    let prods = yield productManager_1.default.getProductsOfCategories([categories[i].id]);
                    cacheproducts[categories[i].slug] = prods.map(pr => ({
                        slug: pr.slug
                    }));
                }
                yield this.dataCache.set("category-products", cacheproducts);
            }
            return cacheproducts;
        });
    }
    static fillResources() {
        return __awaiter(this, void 0, void 0, function* () {
            let resources = yield this.dataCache.get("resources");
            if (!resources) {
                let res = yield resource_1.default.findAll({
                    raw: true,
                    order: [["type", 'desc'], ["displayOrder", "DESC"], ["updatedOn", "DESC"]]
                });
                let result = {};
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
                        folder: ri.folder,
                        tag1: ri.tag1
                    };
                    //result[ri.type].push(obj)
                    result[ri.type + ri.ref1].push(obj);
                    result[ri.type + ri.contentUrl].push(obj);
                });
                resources = result;
                yield this.dataCache.set("resources", resources);
            }
            return resources;
        });
    }
    static fillProducts() {
        return __awaiter(this, void 0, void 0, function* () {
            let products = yield this.dataCache.get("products");
            if (!products) {
                let res = yield product_1.default.findAll({
                    attributes: ['slug', 'id', 'tag2', 'badge', 'name'],
                    raw: true,
                    order: [["displayOrder", "DESC"]]
                });
                let result = {};
                res.forEach((ri, i) => {
                    result[ri.slug] = {
                        id: ri.id,
                        slug: ri.slug,
                        name: ri.name,
                        tag2: ri.tag2,
                        badge: ri.badge
                    };
                });
                products = result;
                yield this.dataCache.set("products", result);
            }
            return products;
        });
    }
    static fillButchers() {
        return __awaiter(this, void 0, void 0, function* () {
            let butchers = yield this.dataCache.get("butchers");
            if (!butchers) {
                let res = yield butcher_1.default.findAll({
                    attributes: ['name', 'id', 'slug'],
                    raw: true,
                    order: [['updatedon', 'DESC']]
                });
                let result = {};
                res.forEach((ri, i) => {
                    result[ri.slug] = {
                        id: ri.id,
                        name: ri.name
                    };
                });
                butchers = result;
                yield this.dataCache.set("butchers", result);
            }
            return butchers;
        });
    }
    static generateDataCache(req) {
        return __awaiter(this, void 0, void 0, function* () {
            let categories = yield this.fillCategories();
            let pricecategories = yield this.fillPriceCategories(categories);
            let products = yield this.fillProducts();
            let butchers = yield this.fillButchers();
            let cities = yield this.fillCities();
            let butcherCities = yield this.fillButcherCities(cities);
            let resources = yield this.fillResources();
            let recentBlogs = yield this.fillRecentBlogs();
            let webPages = yield this.fillWebPages();
            let redirects = yield this.fillRedirects();
            //let appNavs = <any>await this.fillAppNav(Helper.getUrl(req));
            let categoryProducts = yield this.fillProductsByCategory(categories);
            return {
                categories: categories,
                pricecategories: pricecategories,
                products: products,
                cities: cities,
                butcherCities: butcherCities,
                resources: resources,
                recentBlogs: recentBlogs,
                categoryProducts: categoryProducts,
                butchers: butchers,
                webPages: webPages,
                redirects: redirects,
            };
        });
    }
}
exports.CacheManager = CacheManager;
CacheManager.dataCache = redismanager_1.default;
CacheManager.cacheGenerated = false;
CacheManager.init = () => {
};
