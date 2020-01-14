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
import { ProductCacheItem, CacheManager } from '../lib/cache';
let ellipsis = require('text-ellipsis');

export default class Route extends ViewRouter {

    tarifs: Resource[];
    foods: Resource[];
    blogItems: Content[];

    async getBlogItems() {
        return this.req.__recentBlogs;
    }


    filterProductsByCategory(category: Category) {
        let result: ProductCacheItem[] = []
        let prodSlugs = this.req.__categoryProducts[category.slug];
        if (prodSlugs) {
            for (let i = 0; i < prodSlugs.length; i++) {
                let product = this.req.__products[prodSlugs[i].slug];
                if (product) result.push(product);
                if (result.length >= 8) break;
            }
        }
        return result; //.slice(0, 8);
    }

    @Auth.Anonymous()
    async kasapViewRoute() {
        this.foods = await new ProductsApi(this.constructorParams).getFoodResources(null, 15);
        this.sendView("pages/content.kasap-basvuru.ejs", this.viewData({

        }))
    }


    @Auth.Anonymous()
    async defaultRoute() {
        let recentButchers: ButcherModel[] = CacheManager.dataCache["recent-butchers"];
        if (!recentButchers) {
            recentButchers = await ButcherModel.findAll({
                order: [["updatedon", "DESC"]],
                limit: 15,
                include: [
                    { all: true }
                ],
                raw: true,
                where: {
                    approved: true
                }
            });
            CacheManager.dataCache["recent-butchers"] = recentButchers;
        }

        this.tarifs = null; // CacheManager.dataCache["home-tarifs"];
        if (!this.tarifs) {
            this.tarifs = await new ProductsApi(this.constructorParams).getTarifVideos(null, 10, null);
            CacheManager.dataCache["home-tarifs"] = this.tarifs;
        }
        this.foods = null;//  CacheManager.dataCache["home-foods"];
        if (!this.foods) {
            this.foods = await new ProductsApi(this.constructorParams).getFoodResources(null, 15, null);
            CacheManager.dataCache["home-foods"] = this.foods;
        }

        this.blogItems = await this.getBlogItems();

        this.res.render("pages/default.ejs", this.viewData({
            recentButchers: recentButchers,
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
        // if (config.nodeenv == 'production') {
        //     router.get("/home", Route.BindRequest(this.prototype.defaultRoute))
        //     router.get("/", Route.BindToView("pages/offline.ejs"))
        // }
        // else {

        // }
        router.get("/", Route.BindRequest(this.prototype.defaultRoute))
        router.get("/adres-belirle/:slug", Route.BindRequest(this.prototype.setUserAddr))
        router.get("/hikayemiz", Route.BindToView("pages/content.kurumsal.ejs"))
        router.get("/iletisim", Route.BindToView("pages/content.contact.ejs"))
        router.get("/kasap-secim-kriterleri", Route.BindToView("pages/content.kasap-secim.ejs"))
        router.get("/kasap", Route.BindRequest(this.prototype.kasapViewRoute))
        router.get("/kullanici-sozlesmesi", Route.BindToView("pages/content.kullanici-sozlesmesi.ejs"))
    }
} 