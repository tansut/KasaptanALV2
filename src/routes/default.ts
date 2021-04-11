import { ApiRouter, ViewRouter } from '../lib/router';
import * as express from "express";
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
import { Op } from 'sequelize';
import { SiteStatsData } from '../models/sitestat';
import { SiteStats } from '../lib/sitestats';
import TempLoc from '../db/models/temp_loc';
import { Order } from '../db/models/order';
import OrderApi from './api/order'

let ellipsis = require('text-ellipsis');

export default class Route extends ViewRouter {

    lastOrders: Order[] = [];
    hide4Sebep = false;
    foods: Resource[];
    blogItems: Content[];
    foodsTitle = "Et Yemekleri";
    stats: SiteStatsData;

    async getBlogItems() {
        return this.req.__recentBlogs;
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

    @Auth.Anonymous()
    async kasapViewRoute() {
         this.foods = await new ProductsApi(this.constructorParams).getFoodResources(null, 10);
        this.sendView("pages/content.kasap-basvuru.ejs", this.viewData({

        }))
    }


    @Auth.Anonymous()
    async defaultRoute() {
        let recentButchers: ButcherModel[] = await CacheManager.dataCache.get("recent-butchers");
        if (!recentButchers) {
            recentButchers = await ButcherModel.findAll({
                order: [["displayOrder", "DESC"]],
                limit: 10,
                where: {
                    approved: true,
                    showListing: true
                }
            });
            CacheManager.dataCache.set("recent-butchers", recentButchers.map(b => b.get({ plain: true })));
        }

        if (this.req.user) {
            this.lastOrders = await new OrderApi(this.constructorParams).lastOrders(this.req.user.id, 9)
        }

        // this.foods = await new ProductsApi(this.constructorParams).getResources({
        //     type: ['product-videos', 'product-photos'],
        //     list: true,
        //     tag1: {
        //         [Op.or]: [{
        //             [Op.like]: '%yemek%'

        //         }, { [Op.like]: '%tarif%' }]
        //     }
        // }, null, 10);
        // this.foodsTitle = 'Yemekler ve Tarifler'

        //this.foods = CacheManager.dataCache.get("recent-foods");
        this.blogItems = await this.getBlogItems();
        //this.stats = await SiteStats.get();

        
        this.appUI.tabIndex = 0;
        this.res.render("pages/default.ejs", this.viewData({
            recentButchers: recentButchers,
            ellipsis: ellipsis
        }));

    }

    @Auth.Anonymous()
    async testsubmit() {
        this.res.redirect('/')
    }

    @Auth.Anonymous()
    async setUserAddr() {
        let area = await Area.getBySlug(this.req.params.slug);
        if (!area) return this.next();
        await this.req.helper.setPreferredAddressByArea(area, true);
        
        //this.res.send('ok')
                 if (this.req.query.r)
             this.res.redirect(this.req.query.r as string);
         else this.res.redirect('/')
    }

    async tempares() {
        let tl = await TempLoc.findAll({
            where: {
                il: ['MUĞLA', 'TEKİRDAĞ', 'KOCAELİ', 'SAKARYA']
            }
        })

        for(let i = 0; i < tl.length;i++) {
            let t = tl[i];
            t.semt = t.semt.replace("ERYAMANEVLERİ", "ERYAMAN")
            t.semt = t.semt.replace("HASKÖY S.EVLERİ", "HASKÖY SUBAYEVLERİ")

            

            let slug = Helper.slugify(`${t.il}-${t.ilce}-${t.semt}`);
            let area = await Area.findOne({
                where: {
                    slug: slug
                }
            })



            if (!area) {
                console.log(`${t.il}-${t.ilce}-${t.semt} bulunamadı`)
            } else {
                let na: Area = new Area();
                na.name = Helper.capitlize(t.mahalle.replace(" MAH", ' Mahallesi'));
                na.slug = Helper.slugify(`${area.slug}-${t.mahalle.replace(" MAH", '')}`);
                na.parentid = area.id;
                na.lowerName = Helper.toLower(na.name);
                na.level = 4;
                na.status = 'generic';
                try {
                    await na.save();
                } catch(err) {
console.log(err.message)
                }
               
            }


        }
        
        this.res.send('OK')
    }

    static SetRoutes(router: express.Router) {
        // if (config.nodeenv == 'production') {
        //     router.get("/home", Route.BindRequest(this.prototype.defaultRoute))
        //     router.get("/", Route.BindToView("pages/offline.ejs"))
        // }
        // else {
            
        // }
        router.get("/", Route.BindRequest(this.prototype.defaultRoute))
        router.get("/temparea", Route.BindRequest(this.prototype.tempares))

        router.get("/testsubmit", Route.BindToView("pages/test-submit.ejs"))
        router.post("/testsubmit", Route.BindRequest(this.prototype.testsubmit))

        router.get("/adres-belirle/:slug", Route.BindRequest(this.prototype.setUserAddr))
        router.get("/hikayemiz", Route.BindToView("pages/content.kurumsal.ejs"));
        router.get("/neden-kasaptanal", Route.BindToView("pages/content.neden-kasaptanal.ejs"));
        router.get("/iletisim", Route.BindToView("pages/content.contact.ejs"))
        router.get("/yardim", Route.BindToView("pages/content.yardim.ejs"))
        router.get("/kasap-secim-kriterleri", Route.BindToView("pages/content.kasap-secim.ejs"))
        router.get("/kasap", Route.BindRequest(this.prototype.kasapViewRoute))
        router.get("/kullanici-sozlesmesi", Route.BindToView("pages/content.kullanici-sozlesmesi.ejs"))
        router.get("/gizlilik-sozlesmesi", Route.BindToView("pages/content.gizlilik-sozlesmesi.ejs"))
        router.get("/satis-sozlesmesi", Route.BindToView("pages/content.satis-sozlesmesi.ejs"))
        router.get("/mobil-uygulamalar", Route.BindToView("pages/content.mobil-uygulamalar.ejs"))
    }
} 