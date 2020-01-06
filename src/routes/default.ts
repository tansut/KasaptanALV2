import { ApiRouter, ViewRouter } from '../lib/router';
import * as express from "express";
import * as maps from "@google/maps"
import ButcherModel from '../db/models/butcher';
import moment = require('moment');
import { Auth } from '../lib/common';
import Helper from '../lib/helper';
import Resource from '../db/models/resource';
import Area from '../db/models/area';
import { where } from 'sequelize/types';
import Product from '../db/models/product';
import Category from '../db/models/category';
import ProductManager from '../lib/productManager';
import config from '../config';
import ProductsApi from './api/product';
import Content from '../db/models/content';
let ellipsis = require('text-ellipsis');

export default class Route extends ViewRouter {

    products: Product[];
    tarifs: Resource[];
    foods: Resource[];
    blogItems: Content[];

    async getBlogItems() {

        let allcontent = await Content.findAll({
            attributes: ["title", "category", "description", "slug", "categorySlug"],
            order: [["UpdatedOn", "DESC"]],
            limit: 15
        })

        return allcontent;
    }
    



 

    filterProductsByCategory(filter = {}, chunk: number = 0) {
        let products = ProductManager.filterProductsByCategory(this.products, filter, { productType: 'generic' }, { chunk: chunk })
        return products.slice(0, 8);
    }

    getProductCategoriesToView(product: Product) {
        return product.categories.filter(p => ['reyon', 'amac'].indexOf(p.category.type) >= 0)
    }

    @Auth.Anonymous()
    async defaultRoute() {
        let recentButchers = await ButcherModel.findAll({
            order: [["updatedon", "DESC"]],
            limit: 15,
            include: [
                { all: true }
            ],
            where: {
                approved: true
            }
        });

        this.products = await ProductManager.getProducts();
        this.tarifs = await new ProductsApi(this.constructorParams).getTarifVideos(null, 10);
        this.foods = await new ProductsApi(this.constructorParams).getFoodResources(null, 15);
        
        this.blogItems = await this.getBlogItems();

        this.res.render("pages/default.ejs", this.viewData({
            recentButchers: recentButchers,
            // butcherCities: cities,
            ellipsis: ellipsis
        }));
    }

    @Auth.Anonymous()
    async setUserAddr() {
        let area = await Area.getBySlug(this.req.params.slug);
        if (!area) return this.next();
        if (area.level == 3) {
            await this.req.helper.setPreferredAddress({
                level3Id: area.id
            }, true)
        }
        if (this.req.query.r)
            this.res.redirect(this.req.query.r);
        else this.res.redirect('/')
    }

    static SetRoutes(router: express.Router) {
        if (config.nodeenv == 'production') {
            router.get("/home", Route.BindRequest(this.prototype.defaultRoute))
            router.get("/", Route.BindToView("pages/offline.ejs"))
        }
        else {
            router.get("/", Route.BindRequest(this.prototype.defaultRoute))
        }
            router.get("/adres-belirle/:slug", Route.BindRequest(this.prototype.setUserAddr))
            router.get("/hikayemiz", Route.BindToView("pages/content.kurumsal.ejs"))
            router.get("/iletisim", Route.BindToView("pages/content.contact.ejs"))
            router.get("/kasap-basvuru", Route.BindToView("pages/content.kasap-secim.ejs"))
            router.get("/kullanici-sozlesmesi", Route.BindToView("pages/content.kullanici-sozlesmesi.ejs"))
        
    }
}