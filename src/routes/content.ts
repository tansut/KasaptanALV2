import { ApiRouter, ViewRouter } from '../lib/router';
import * as express from "express";
import ButcherModel from '../db/models/butcher';
import moment = require('moment');
import { Auth } from '../lib/common';
import AreaModel from '../db/models/area';
import Helper from '../lib/helper';
import Area from '../db/models/area';
import Category from '../db/models/category';
import Content from '../db/models/content';
import config from '../config';
import * as path from 'path';
import * as fs from 'fs';
import { readFileSync } from 'fs';
import Resource from '../db/models/resource';
let ellipsis = require('text-ellipsis');
var MarkdownIt = require('markdown-it')
import ProductsApi from './api/product';
import { Sequelize, QueryTypes } from 'sequelize';
import { ProductCacheItem } from '../lib/cache';


export default class Route extends ViewRouter {

    content: Content;
    allcontent: Content[]; 
    resources: Resource[] = [];
    mangalFoods: Resource[] = [];
    categories: any;

    async foods() {
        return await new ProductsApi(this.constructorParams).getFoodAndTarifResources(null, 10);
    }


    filterProductsByCategory(category: Category, limit= 8) {
        let result: ProductCacheItem[] = []
        let prodSlugs = this.req.__categoryProducts[category.slug];
        if (prodSlugs) {
            for (let i = 0; i < prodSlugs.length; i++) {
                let product = this.req.__products[prodSlugs[i].slug];
                if (product) result.push(product);
                if (result.length >= limit) break;
            }
        }
        return result; //.slice(0, 8);
    }

    async loadCategories() {

        let catdata = await Content.sequelize.query("SELECT distinct category, categorySlug from Contents", {
            raw: true  ,
            type: QueryTypes.SELECT       
        } )

        this.categories = catdata;

    }

    getContentImages() {
        return [{
            url: `${config.staticDomain}/content-resimleri/${this.content.slug}.jpg`
        }]
    }

    // getHtmlContent() {
    //     let md = new MarkdownIt();
    //     let file = path.resolve(path.join(config.projectDir, "src/views/pages/content/" + this.content.slug + ".md"))
    //     let content = fs.readFileSync(file, "utf8")
    //     return md.render(content)
    // }

    renderPage() {
        this.res.render(`pages/blog.view.ejs`, this.viewData({
            pageThumbnail: `${config.staticDomain}/content-resimleri/${this.content.slug}-thumbnail.jpg`,
            pageTitle: (this.content.pageTitle || this.content.title),
            pageDescription: this.content.pageDescription || this.content.description
        }))
    }

    getthumbnailurl(content: Content) {
        return `${config.staticDomain}/content-resimleri/${content.slug}-thumbnail.jpg`;
    }

    @Auth.Anonymous()
    async indexRoute() {
        let where = {};
        if (this.req.params.category)
            where = {
                categorySlug: this.req.params.category
            }
        let allcontent = await Content.findAll({
            attributes: ["title", "category", "description", "slug", "categorySlug"],
            order: [["displayOrder", "DESC"], ["UpdatedOn", "DESC"]],
            where: where,
            limit: 25
        })
        if (this.req.params.category && allcontent.length == 0)
            return this.next();
        if (this.req.path.toLowerCase().startsWith('/et-kulturu')) {
            return this.res.redirect(this.req.originalUrl.toLowerCase().replace('/et-kulturu', '/blog'), 301)
        }
        this.allcontent = allcontent;
        this.resources = await new ProductsApi(this.constructorParams).getInformationalVideos(25)
        await this.loadCategories();
        let category = this.categories.find(p=>p.categorySlug == this.req.params.category)
        this.renderView('pages/blog.index.ejs',
        
            this.req.params.category ? `blog/${this.req.params.category}`: null, {
                pageTitle: 'Et Kültür Blog' + (category ? ' | ' + category.category :''),              
                pageDescription: category ? 'KasaptanAl.com Et Kültür Blog ' + category.category + ' kategorisi içeriklerini keşfedin.':  'KasaptanAl.com Et Kültür Blog ete ve hayata dair pek çok eğlenceli, kısa ve öz içeriklerle sizi bekliyor.',
                allcontent: allcontent
        })
    }


    @Auth.Anonymous()
    async viewRoute() {
        if (!this.req.params.content) {
            return this.next();
        }



        this.content = await Content.findOne({
            where: {
                slug: this.req.params.content
            }
        })

        if (!this.content) return this.next();

        if (this.req.path.toLowerCase().startsWith('/et-kulturu')) {
            return this.res.redirect(this.req.originalUrl.toLowerCase().replace('/et-kulturu', '/blog'), 301)
        }

        await this.loadCategories();
        this.mangalFoods = this.req.params.content == 'antrikot' ? await this.foods(): [];

        this.renderPage()

    }




    static SetRoutes(router: express.Router) {
        router.get("/blog", Route.BindRequest(Route.prototype.indexRoute));
        router.get("/blog/:category", Route.BindRequest(Route.prototype.indexRoute));
        router.get("/blog/:content", Route.BindRequest(Route.prototype.viewRoute));

        router.get("/et-kulturu", Route.BindRequest(Route.prototype.indexRoute, [true]));
        router.get("/et-kulturu/:category", Route.BindRequest(Route.prototype.indexRoute, [true]));
        router.get("/et-kulturu/:content", Route.BindRequest(Route.prototype.viewRoute, [true]));

    }
}