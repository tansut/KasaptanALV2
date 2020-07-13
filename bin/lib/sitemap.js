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
const sitemap_1 = require("sitemap");
var fs = require('fs');
const config_1 = require("../config");
const path = require("path");
const product_1 = require("../db/models/product");
const category_1 = require("../db/models/category");
const resource_1 = require("../db/models/resource");
const sequelize_1 = require("sequelize");
const content_1 = require("../db/models/content");
const butcher_1 = require("../db/models/butcher");
const area_1 = require("../db/models/area");
const pricecategory_1 = require("../db/models/pricecategory");
class SiteMapManager {
    static getStream() {
        const smStream = new sitemap_1.SitemapStream({ hostname: 'https://www.kasaptanal.com' });
        return smStream;
    }
    static fillArea(stream) {
        return __awaiter(this, void 0, void 0, function* () {
            let items = yield area_1.default.findAll({
                where: {
                    status: 'active'
                }
            });
            items.forEach(item => {
                stream.write({
                    url: `${this.baseUrl}/${item['slug']}-kasap`
                });
            });
        });
    }
    static fillButchers(stream) {
        return __awaiter(this, void 0, void 0, function* () {
            let items = yield butcher_1.default.findAll({
                include: [
                    {
                        model: area_1.default,
                        all: true,
                        as: "areaLevel1Id"
                    }
                ],
                where: {
                    approved: true
                }
            });
            for (let i = 0; i < items.length; i++) {
                let item = items[i];
                let resources = yield resource_1.default.findAll({
                    where: {
                        ref1: item.id,
                        type: 'butcher-google-photos'
                    }
                });
                stream.write({
                    url: `${this.baseUrl}/${item.slug}`,
                    img: resources.map(r => {
                        return {
                            url: r.getFileUrl(),
                            title: r.title,
                            caption: `${item.name}`,
                            geoLocation: item.areaLevel1 && (item.areaLevel1.name + ',' + 'Turkey')
                        };
                    })
                });
            }
        });
    }
    static fillBlog(stream) {
        return __awaiter(this, void 0, void 0, function* () {
            let catdata = yield content_1.default.sequelize.query("SELECT distinct category, categorySlug from Contents", {
                raw: true,
                type: sequelize_1.QueryTypes.SELECT
            });
            catdata.forEach(item => {
                stream.write({
                    url: `${this.baseUrl}/blog/${item['categorySlug']}`,
                    img: []
                });
            });
            let items = yield content_1.default.findAll({
                raw: true
            });
            items.forEach(item => {
                stream.write({
                    url: `${this.baseUrl}/blog/${item.slug}`,
                    img: [{
                            url: `${config_1.default.staticDomain}/content-resimleri/${item.slug}.jpg`,
                            title: item.title,
                            caption: item.description
                        }]
                });
            });
        });
    }
    static fillFoods(stream) {
        return __awaiter(this, void 0, void 0, function* () {
            let items = yield resource_1.default.findAll({
                where: {
                    type: ['product-videos', 'product-photos'],
                    [sequelize_1.Op.or]: [{
                            tag1: {
                                [sequelize_1.Op.or]: [{
                                        [sequelize_1.Op.like]: '%yemek%'
                                    }, { [sequelize_1.Op.like]: '%tarif%' }]
                            }
                        }]
                }
            });
            items.forEach(item => {
                stream.write({
                    url: `${this.baseUrl}/et-yemekleri/${item.slug || item.id}`,
                    img: item.contentType == 'image/jpeg' ? [{
                            url: item.getFileUrl(),
                            title: item.title,
                            caption: item.description
                        }
                    ] : []
                });
            });
        });
    }
    static fillCategories(stream) {
        return __awaiter(this, void 0, void 0, function* () {
            let items = yield category_1.default.findAll({
                attributes: ['name', 'slug', 'type', 'id', 'tarifTitle'],
                raw: true
            });
            for (let i = 0; i < items.length; i++) {
                let item = items[i];
                let resources = yield resource_1.default.findAll({
                    where: {
                        ref1: item.id,
                        type: 'category-photos'
                    }
                });
                stream.write({
                    url: item.type == 'resource' ? `${this.baseUrl}/et-yemekleri/${item.slug}` : `${this.baseUrl}/${item.slug}`,
                    img: resources.map(r => {
                        return {
                            url: r.getFileUrl(),
                            title: r.title || item.name,
                            caption: `${item.shortdesc}` || `${item.name}`
                        };
                    })
                });
                if (item.type != 'resource' && item.tarifTitle) {
                    stream.write({
                        url: `${this.baseUrl}/${item.slug}/et-yemekleri`
                    });
                }
            }
        });
    }
    static fillPriceCategories(stream) {
        return __awaiter(this, void 0, void 0, function* () {
            let items = yield pricecategory_1.default.findAll({
                include: [
                    {
                        model: category_1.default
                    }
                ]
            });
            for (let i = 0; i < items.length; i++) {
                let item = items[i];
                let resources = yield resource_1.default.findAll({
                    where: {
                        ref1: item.category.id,
                        type: 'category-photos'
                    }
                });
                stream.write({
                    url: `${this.baseUrl}/${item.slug}`,
                    img: resources.map(r => {
                        return {
                            url: r.getFileUrl(),
                            title: r.title || item.name,
                            caption: `${item.shortdesc}` || `${item.name}`
                        };
                    })
                });
            }
        });
    }
    static fillProducts(stream) {
        return __awaiter(this, void 0, void 0, function* () {
            let items = yield product_1.default.findAll({
                attributes: ['slug', 'name', 'id'],
                raw: true
            });
            for (let i = 0; i < items.length; i++) {
                let item = items[i];
                let resources = yield resource_1.default.findAll({
                    where: {
                        ref1: item.id,
                        type: 'product-photos',
                        [sequelize_1.Op.or]: [{
                                tag1: ''
                            }, {
                                tag1: null
                            }]
                    }
                });
                stream.write({
                    url: `${this.baseUrl}/${item.slug}`,
                    img: resources.map(r => {
                        return {
                            url: r.getFileUrl(),
                            title: r.title || item.name,
                            caption: `${item.name}`
                        };
                    })
                });
            }
        });
    }
    static fill(stream) {
        return __awaiter(this, void 0, void 0, function* () {
            var defaultUrls = fs.readFileSync(path.join(config_1.default.projectDir, "siteurl.txt"), 'utf8').split(/\r?\n/);
            defaultUrls.forEach(line => {
                stream.write({ url: `${this.baseUrl}${line}` });
            });
            yield this.fillProducts(stream);
            yield this.fillCategories(stream);
            yield this.fillPriceCategories(stream);
            yield this.fillFoods(stream);
            yield this.fillBlog(stream);
            yield this.fillButchers(stream);
            yield this.fillArea(stream);
        });
    }
}
exports.default = SiteMapManager;
SiteMapManager.baseUrl = 'https://www.kasaptanal.com';
