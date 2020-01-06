import { ApiRouter, ViewRouter } from '../lib/router';
import * as express from "express";
import * as maps from "@google/maps"
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


export default class Route extends ViewRouter {

    content: Content;
    allcontent: Content[];
    resources: Resource [] = [];

    getCategories() {
        let result = {};
        for (let i = 0; i < this.allcontent.length; i++) {
            if (!result[this.allcontent[i].categorySlug])
                result[this.allcontent[i].categorySlug] = this.allcontent[i].category
        }
        return result;
    }

    getContentImages() {
        return [{
            url: `/content-resimleri/${this.content.slug}.jpg`
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
            pageTitle: this.content.pageTitle || this.content.title,
            pageDescription: this.content.pageDescription || this.content.description
        }))
    }

    getthumbnailurl(content: Content) {
        return `/content-resimleri/${content.slug}-thumbnail.jpg`;
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
            order: [["UpdatedOn", "DESC"]],
            where: where
        })
        this.allcontent = allcontent;
        this.resources = await new ProductsApi(this.constructorParams).getInformationalVideos(25)

        this.res.render('pages/blog.index.ejs', this.viewData({ pageTitle: 'Et Kültürü', pageDescription: '',  allcontent: allcontent }))
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

        this.renderPage()

    }




    static SetRoutes(router: express.Router) {
        router.get("/et-kulturu", Route.BindRequest(Route.prototype.indexRoute));
        router.get("/et-kulturu/:category", Route.BindRequest(Route.prototype.indexRoute));
        router.get("/et-kulturu/:category/:content", Route.BindRequest(Route.prototype.viewRoute));
    }
}