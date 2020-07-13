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
const Jimp = require('jimp');
const category_1 = require("../db/models/category");
const productcategory_1 = require("../db/models/productcategory");
const product_1 = require("../db/models/product");
const _ = require("lodash");
const subcategory_1 = require("../db/models/subcategory");
class ProductManager {
    static getProducts() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield product_1.default.findAll({
                include: [{
                        model: productcategory_1.default,
                        include: [category_1.default]
                    },
                ], where: {},
                order: [["displayorder", "desc"]]
            });
        });
    }
    static getProductsOfCategories(catids) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield product_1.default.findAll({
                include: [{
                        model: productcategory_1.default,
                        as: 'categories',
                        include: [{
                                model: category_1.default
                            }
                        ]
                    },
                ], where: {
                    '$categories.category.id$': catids
                },
                order: [[{ model: productcategory_1.default, as: 'categories' }, "displayOrder", "desc"], ["displayorder", "desc"]]
            });
        });
    }
    static getCategories() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield category_1.default.findAll({
                order: ["type", "displayorder"]
            });
        });
    }
    static getProductsOfButcher(butcher) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield product_1.default.findAll({
                include: [{
                        model: productcategory_1.default,
                        include: [category_1.default]
                    }
                ], where: {}
            });
        });
    }
    static filterResources(products, filter = {}, options = {}) {
        let result = _.filter(products, filter);
        return options.chunk > 0 ? _.chunk(result, options.chunk) : result;
    }
    static filterResourcesByCategory(products, categoryFilter = {}, productFilter = {}, options = {}) {
        let filteredProducts = ProductManager.filterResources(products, productFilter);
        let result = products.filter(p => {
            return p.categories.findIndex(c => {
                let pass = true;
                Object.keys(categoryFilter).forEach(k => {
                    let val = c.category[k];
                    pass = pass && (val == categoryFilter[k]);
                });
                return pass;
            }) >= 0;
        });
        result = _.orderBy(result, (i) => {
            return i.categories.find(c => c.category.slug == categoryFilter['slug']).displayOrder;
        }, ['desc']);
        return options.chunk > 0 ? _.chunk(result, options.chunk) : result;
    }
    static filterProducts(products, filter = {}, options = {}) {
        let result = _.filter(products, filter);
        return options.chunk > 0 ? _.chunk(result, options.chunk) : result;
    }
    static generateSubcategories(category, products) {
        let subCategories = [];
        if (category.subItemsMode == category_1.CategorySubItemsMode.subitems) {
            subCategories = category.subCategories;
        }
        else if (category.subItemsMode == category_1.CategorySubItemsMode.tag1) {
            let tags = _.uniq(products.map(p => p.tag1));
            let i = 0;
            tags.forEach(t => {
                let subCat = new subcategory_1.default({
                    id: i++,
                    visible: true,
                    categoryid: 0,
                    displayOrder: i,
                    title: t,
                    description: '',
                    category: null
                });
                subCategories.push(subCat);
            });
        }
        if (subCategories.length == 0) {
            let subCat = new subcategory_1.default({
                id: 0,
                visible: false,
                categoryid: 0,
                displayOrder: 0,
                title: 'tümü',
                description: '',
                category: null
            });
            subCategories.push(subCat);
        }
        subCategories.forEach((sc, i) => {
            if (subCategories.length == 1) {
                sc.products = products;
            }
            else {
                if (category.subItemsMode == category_1.CategorySubItemsMode.subitems) {
                    sc.products = products.filter(p => { return p.categories.find(pc => pc.subcategoryid == sc.id); });
                }
                else {
                    sc.products = products.filter(p => { return p.tag1 == sc.title; });
                }
            }
        });
        subCategories = _.sortBy(subCategories, ["displayOrder"]).reverse();
        return subCategories;
    }
    static filterProductsByCategory(products, categoryFilter = {}, productFilter = {}, options = {}) {
        let filteredProducts = ProductManager.filterProducts(products, productFilter);
        let result = products.filter(p => {
            return p.categories.findIndex(c => {
                let pass = true;
                Object.keys(categoryFilter).forEach(k => {
                    let val = c.category[k];
                    pass = pass && (val == categoryFilter[k]);
                });
                return pass;
            }) >= 0;
        });
        result = _.orderBy(result, (i) => {
            return i.categories.find(c => c.category.slug == categoryFilter['slug']).displayOrder;
        }, ['desc']);
        return options.chunk > 0 ? _.chunk(result, options.chunk) : result;
    }
    static getProductCategories(product) {
        let categories = product.getCategories();
        return JSON.stringify(categories.map(p => p.name));
    }
    static filterCategories(categories, filter = {}, options = {}) {
        let result = _.filter(categories, filter);
        return options.chunk > 0 ? _.chunk(result, options.chunk) : result;
    }
}
exports.default = ProductManager;
