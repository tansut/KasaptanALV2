import * as Jimp2 from 'jimp'
const Jimp = <Jimp2.default>require('jimp');
import * as path from "path"
import Category from '../db/models/category';
import ProductCategory from '../db/models/productcategory';
import { Json } from 'sequelize/types/lib/utils';
import ProductModel from '../db/models/product';
import * as _ from "lodash";
import Butcher from '../db/models/butcher';
import ButcherProduct from '../db/models/butcherproduct';
import Resource from '../db/models/resource';
import ResourceCategory from '../db/models/resourcecategory';

interface FilterOptions {
    chunk?: number;
}

export default class ProductManager {
    static async getProducts() {
        return await ProductModel.findAll({
            include: [{
                model: ProductCategory,
                include: [Category]
            },
            ], where: {},
            order: [["displayorder", "desc"]]
        });
    }

    static async getProductsOfCategories(catids: number[]) {
        return await ProductModel.findAll({
            include: [{
                model: ProductCategory,
                as: 'categories',
                include: [{
                    model: Category}
                ]
            },
            ], where: {
                '$categories.category.id$': catids
            },
            order: [[ { model: ProductCategory, as: 'categories' }, "displayOrder", "desc"], [ "displayorder", "desc"]]
        });
    }    



    static async getCategories() {
        return await Category.findAll({
            order: ["type", "displayorder"]
        });
    }

    static async getProductsOfButcher(butcher: Butcher) {
        return await ProductModel.findAll({
            include: [{
                model: ProductCategory,
                include: [Category]
            }
            ], where: {

            }
        });
    }

    static filterResources(products: Resource[], filter = {}, options: FilterOptions = {}) {
        let result = _.filter(products, filter)
        return options.chunk > 0 ? _.chunk(result, options.chunk) : result
    }

    static filterResourcesByCategory(products: Resource[], categoryFilter = {}, productFilter = {}, options: FilterOptions = {}) {
        let filteredProducts = ProductManager.filterResources(products, productFilter);
        let result = products.filter(p => {
            return p.categories.findIndex(c => {
                let pass = true
                Object.keys(categoryFilter).forEach(k => {
                    let val = c.category[k];
                    pass = pass && (val == categoryFilter[k])
                })
                return pass;
            }) >= 0
        })
        result = _.orderBy(result, (i: Resource) => {
            return i.categories.find(c=>c.category.slug == categoryFilter['slug']).displayOrder
        }, ['desc']);
        return options.chunk > 0 ? _.chunk(result, options.chunk) : result
    }

    static filterProducts(products: ProductModel[], filter = {}, options: FilterOptions = {}) {
        let result = _.filter(products, filter)
        return options.chunk > 0 ? _.chunk(result, options.chunk) : result
    }


    static filterProductsByCategory(products: ProductModel[], categoryFilter = {}, productFilter = {}, options: FilterOptions = {}) {
        let filteredProducts = ProductManager.filterProducts(products, productFilter);
        let result = products.filter(p => {
            return p.categories.findIndex(c => {
                let pass = true
                Object.keys(categoryFilter).forEach(k => {
                    let val = c.category[k];
                    pass = pass && (val == categoryFilter[k])
                })
                return pass;
            }) >= 0
        })
        result = _.orderBy(result, (i: ProductModel) => {
            return i.categories.find(c=>c.category.slug == categoryFilter['slug']).displayOrder
        }, ['desc']);
        return options.chunk > 0 ? _.chunk(result, options.chunk) : result
    }




    static getProductCategories(product: ProductModel) {
        let categories = product.getCategories();
        return JSON.stringify(categories.map(p => p.name))
    }

    static filterCategories(categories: Category[], filter = {}, options: FilterOptions = {}) {
        let result = _.filter(categories, filter)
        return options.chunk > 0 ? _.chunk(result, options.chunk) : result
    }
}