import { ApiRouter, ViewRouter } from '../lib/router';
import * as express from "express";
import ButcherModel from '../db/models/butcher';
import { Auth } from '../lib/common';
import Helper from '../lib/helper';
import Resource from '../db/models/resource';
import ResourceRoute from './resource';
import * as path from "path"
import * as Jimp2 from 'jimp'
const Jimp = <Jimp2>require('jimp');
import * as fs from "fs"
import moment = require('moment');
import ProductManager from '../lib/productManager';
import Product from '../db/models/product';
import Butcher from '../db/models/butcher';
import Category from '../db/models/category';
import ButcherProduct from '../db/models/butcherproduct';
import Area from '../db/models/area';
import ProductCategory from '../db/models/productcategory';
import { pbkdf2 } from 'crypto';
var MarkdownIt = require('markdown-it') 
import * as _ from "lodash";
import { ResourceCacheItem } from '../lib/cache';
import Dispatcher from '../db/models/dispatcher';
import config from '../config';
import {Op} from "sequelize";
import Review from '../db/models/review';
import * as sq from 'sequelize';
import SubCategory from '../db/models/subcategory';
import { LogisticProvider, PriceSlice, FromTo } from '../lib/logistic/core';
import  DispatcherApi from './api/dispatcher';
import  ProductApi from './api/product';
import { Provider } from 'nconf';
import AreaApi from './api/area'
import { ButcherLd } from '../models/ButcherLd';



export default class Route extends ViewRouter {
    markdown = new MarkdownIt();
    products: Product[];
    vitrinProducts: Product[];
    butcher: Butcher;
    dispatchers: Dispatcher[];
    reviews: Review[] = [];
    category: Category;
    categories: Category[];
    butcherLd: ButcherLd;

    _ = _;
    subCategories: SubCategory[] = [];

    logisticsProvider: LogisticProvider;
    logisticsPriceSlice: PriceSlice [] = [];
    distance: number;

    filterProductsByCategory(filter, chunk: number = 0) {
        let products = <Product []>ProductManager.filterProductsByCategory(this.products, filter, { productType: 'generic' }, { chunk: chunk })
        let butcherProducts = this.butcher.products.filter(bp=> {
            return  (products.find(p=>p.id == bp.productid) != null)  && !bp['__displayed']
        });
        butcherProducts.forEach(r=>r['__displayed'] = true);
        return butcherProducts;
    }


    async loadReviews(butcher: ButcherModel) {
        let res: Review[] = await Review.sequelize.query(`

        SELECT r.* FROM Reviews r
        WHERE :butcherid = ref2
        ORDER BY r.ID DESC

         `
        ,
        {
            replacements: { butcherid: butcher.id },
            type: sq.QueryTypes.SELECT,
            model: Review,
            mapToModel: true,
            raw: false
        }
        );
        this.reviews = res;
    }

    async createUserLog() {
        let l = this.generateUserLog('butcher', 'view');
        if (l) {
            this.butcher && (l.butcherid = this.butcher.id);
            this.category && (l.butcherName = this.butcher.name);
            this.category && (l.categoryid = this.category.id);
            this.category && (l.categoryName = this.category.name);            
            this.req.query.partial && (l.note = 'partial')
            await this.saveUserLog(l)
        }
    } 


    @Auth.Anonymous()
    async butcherRoute() {
        if (!this.req.params.butcher) {
            return this.next();
        }

        let butcher = this.butcher = await ButcherModel.loadButcherWithProducts(this.req.params.butcher);

        
        if (!butcher) {
            let group = await ButcherModel.count({
                where: {
                    parentButcher: this.req.params.butcher
                }
                
            })
            if (group > 0) {
                return this.res.redirect('/kasaplar?g=' + this.req.params.butcher)
            }  
            return this.next();
        } 



        await this.loadReviews(butcher)

        if (!butcher.location && butcher.gpPlace && butcher.gpPlace['geometry'] && butcher.gpPlace['geometry']['location'])
        {
            let latlong = butcher.gpPlace['geometry']['location']
            butcher.location = {
                type: 'Point',
                coordinates: [parseFloat(latlong.lat), parseFloat(latlong.lng)]            
            }
            await butcher.save()
        }

        

        let images = await butcher.loadResources();

        // this.dispatchers = await Dispatcher.findAll({
        //     where: {
        //         butcherId: this.butcher.id,
        //         enabled: true
        //     },
        //     order: [["toarealevel", "DESC"], ["fee", "ASC"]],
        //     include: [
        //         {
        //             all: true
        //         }
        //     ]
        // })

        // for (let i = 0; i < this.dispatchers.length; i++) {
        //     this.dispatchers[i].address = await this.dispatchers[i].toarea.getPreferredAddress()
        // }

        this.categories = [];



        
        butcher.products = _.sortBy(butcher.products, ["displayOrder", "updatedOn"]).reverse()

        let productCategories = await ProductCategory.findAll({
            include: [{
                all: true
            }]
        });

        this.products = butcher.products.map(p => {
            p.product.categories = productCategories.filter(pc => pc.productid == p.productid)
            return p.product
        })

        this.req.__categories.forEach(c=> {
            let products = <Product []>ProductManager.filterProductsByCategory(this.products, {slug: c.slug}, { }, { chunk: 0 });
            if (products.length) {
                this.categories.push(c)
            }            
        });

        if (!this.req.params.category && this.categories.length) {
            this.category = this.butcher.defaultCategoryId ? this.categories.find(p=>p.id == this.butcher.defaultCategoryId): this.categories[0];
        } else if (this.req.params.category)
            this.category = this.req.__categories.find(p=>p.slug == this.req.params.category);
        if (!this.category) {
            this.category = this.req.__categories[0];
        }


        this.products = <Product []>ProductManager.filterProductsByCategory(this.products, {slug: this.category.slug}, { productType: 'generic' }, { chunk: 0 })
        this.subCategories = ProductManager.generateSubcategories(this.category, this.products);
 


        let pageTitle = Helper.template(butcher.pageTitle || `${butcher.name}`, butcher) ;
        let pageDescription = Helper.template(butcher.pageDescription || `${butcher.name}, ${butcher.address} ${butcher.areaLevel1.name}/${butcher.areaLevel2.name} adresinde hizmet vermekte olup ${(butcher.phone || '').trim().slice(0, -5) + " ..."} numaralı telefon ile ulaşabilirsiniz.`, butcher)
        let pageThumbnail = this.req.helper.imgUrl('butcher-google-photos', butcher.slug)
        
        if (this.req.prefAddr) {
            let dpapi = new DispatcherApi(this.constructorParams);
            let dispatchers = await dpapi.getDispatchers({
                butcher: this.butcher,
                adr: this.req.prefAddr,
                useLevel1: false,                
            })
            this.logisticsProvider = dispatchers.length ? dispatchers[0].provider: null;
            if (this.logisticsProvider) {                
                let areaInfo = await new AreaApi(this.constructorParams).ensureDistance(butcher, this.req.prefAddr.based);                
                let fromTo: FromTo = {                    
                    start: this.butcher.location,
                    finish: this.req.prefAddr.based.location,
                    fId: this.req.prefAddr.based.id.toString(),
                    sId: this.butcher.id.toString()
                }
                this.logisticsPriceSlice = await this.logisticsProvider.priceSlice(fromTo);
                this.distance = areaInfo ? areaInfo.bestKm : await this.logisticsProvider.distance(fromTo)
            }
        }

        this.butcherLd = this.butcher.approved ? new ButcherLd(this.butcher): null;



        if (this.req.session.isNew) {
          this.req.session.prefButcher = butcher.slug;
          await this.req.session.save();
        }
        this.createUserLog();
        if (this.req.query.partial) {           
            this.res.render('pages/category-items.ejs', this.viewData({ pageThumbnail: pageThumbnail, pageTitle: pageTitle, pageDescription: pageDescription, butcher: butcher, images: images }));
        } else this.res.render('pages/butcher', this.viewData({ pageThumbnail: pageThumbnail, pageTitle: pageTitle, pageDescription: pageDescription, butcher: butcher, images: images }));
    }

    getPriceData(product: Product) {

    }

    
    getProductViewParams(product: Product) {
        let showPrice = this.butcher.approved && (this.butcher.status == 'open') && (this.butcher.priceDisplay == 'show');
       


         return { forceDialog: false, link2Location: false,  showPrice: showPrice , showPurchase: showPrice, butcher: this.butcher.slug, butcherProduct: this.butcher.products.find(p=>p.productid == product.id), product: product}
     }

    @Auth.Anonymous()
    async butcherProductFeedRoute() {
        if (!this.req.params.butcher) {
            return this.next();
        }

        let butcher = this.butcher = await ButcherModel.loadButcherWithProducts(this.req.params.butcher);

        
        if (!butcher) {
            return this.next();
        } 

        this.res.header('Content-Type', 'application/xml');
        //res.header('Content-Encoding', 'gzip');               
        let api = new ProductApi({
            req: this.req,
            res: this.res,
            next: null
        })


        
        api.getProductsFeedOfButcher(butcher, {
            thumbnail: this.req.query.thumbnail == "1"
        }).then(products=> {

            try {
                let feed = api.getProductsFeedXML(products)
                this.res.send(feed.end({pretty: config.nodeenv == "development" }))
              } catch (e) {
                console.error(e)
                this.res.status(500).end();
              }
        }).catch(e => {
            console.error(e)
            this.res.status(500).end()
        })        

    }


    
    @Auth.Anonymous()
    async butcherOrderRoute() {
        if (!this.req.params.butcher) {
            return this.next();
        }

        let butcher = this.butcher = await ButcherModel.findOne({
            where: {
                slug: this.req.params.butcher
            }
        });

        
        if (!butcher) {
            return this.next();
        } 

        this.req.session.prefButcher = butcher.slug;
        await this.req.session.save();
        this.res.redirect('/kasap-urunleri?butcher=' + butcher.slug);
    }

    @Auth.Anonymous()
    async butcherPhotoRoute() {
        if (!this.req.params.butcher || !this.req.params.filename) return this.next();
        let butcher = await ButcherModel.findOne({
            where: { slug: this.req.params.butcher }
        });
        if (!butcher)
            return this.next();

        let photo: ResourceCacheItem, thumbnail = false, url = "";

        let res = new ResourceRoute({
            req: this.req,
            res: this.res,
            next: this.next
        });

        let type = "butcher-google-photos";
        let defaultFile = "public/img/butcher-default-thumbnail.jpg";

        if (this.req.params.filename == "thumbnail") {
            thumbnail = true;
            photo = this.req.helper.getResourcesOfType(type + butcher.id).find(p => p.ref1 == butcher.id)
        }
        else photo = this.req.helper.getResourcesOfType(type + this.req.params.filename).find(p => p.contentUrl == this.req.params.filename);

        res.sendResource(photo, thumbnail, thumbnail ? defaultFile : null)
    }



    static SetRoutes(router: express.Router) {
        router.get("/:butcher", Route.BindRequest(Route.prototype.butcherRoute));
        router.get("/:butcher/siparis", Route.BindRequest(Route.prototype.butcherOrderRoute));
        router.get("/:butcher/feed", Route.BindRequest(Route.prototype.butcherProductFeedRoute));
        router.get("/:butcher/:category", Route.BindRequest(Route.prototype.butcherRoute));
        config.nodeenv == 'development' ? router.get("/:butcher/fotograf/:filename", Route.BindRequest(Route.prototype.butcherPhotoRoute)) : null;
    }
}