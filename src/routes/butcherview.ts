import { ApiRouter, ViewRouter } from '../lib/router';
import * as express from "express";
import * as maps from "@google/maps"
import ButcherModel from '../db/models/butcher';
import { Auth } from '../lib/common';
import Helper from '../lib/helper';
import Resource from '../db/models/resource';
import ResourceRoute from './resource';
import * as path from "path"
import * as Jimp2 from 'jimp'
const Jimp = <Jimp2.default>require('jimp');
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



export default class Route extends ViewRouter {
    markdown = new MarkdownIt();
    products: Product[];
    vitrinProducts: Product[];
    butcher: Butcher;
    dispatchers: Dispatcher[];
    reviews: Review[] = [];


    filterProductsByCategory(filter, chunk: number = 0) {
        let products = ProductManager.filterProductsByCategory(this.products, filter, { productType: 'generic' }, { chunk: chunk })
        return products;
    }


    async loadReviews(butcher: ButcherModel) {
        let res: Review[] = await Review.sequelize.query(`
        SELECT r.* FROM Reviews r, Orders o  
        WHERE r.type='order' and r.ref1=o.id and r.ref2=:bid
        ORDER BY r.ID DESC
         `
        ,
        {
            replacements: { bid: butcher.id },
            type: sq.QueryTypes.SELECT,
            mapToModel: true,
            raw: true
        }
        );
        this.reviews = res;
    }



    @Auth.Anonymous()
    async butcherRoute() {
        if (!this.req.params.butcher) {
            return this.next();
        }
        let butcher = this.butcher = await ButcherModel.findOne({
            include: [{
                model: ButcherProduct,
                include: [Product],
                // where: {
                //     [Op.or]: [{
                //         '$products.kgPrice$': {
                //             [Op.gt]: 0.0
                //         }
                //     },

                //     {
                //         '$products.unit1price$': {
                //             [Op.gt]: 0.0
                //         }
                //     },

                //     {
                //         '$products.unit2price$': {
                //             [Op.gt]: 0.0
                //         }
                //     },
                //     {
                //         '$products.unit3price$': {
                //             [Op.gt]: 0.0
                //         }
                //     }
                //     ]                    
                // }
            },
            {
                model: Area,
                all: true,
                as: "areaLevel1Id"

            }], where: { slug: this.req.params.butcher,
            
            
            }
        });
        if (!butcher) {
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

 

        butcher.products = butcher.products.filter(p => {
            return p.enabled && (p.kgPrice > 0 || (p.unit1price > 0 && p.unit1enabled) || (p.unit2price > 0 && p.unit2enabled) || (p.unit3price > 0 && p.unit1enabled))
        })
        
        butcher.products = _.sortBy(butcher.products, ["displayOrder", "updatedOn"]).reverse()
        let images = await Resource.findAll({
            where: {
                type: ["butcher-google-photos", "butcher-videos"],
                ref1: butcher.id,
                list: true
            },
            order: [["displayOrder", "DESC"], ["updatedOn", "DESC"]]
        })

        let productCategories = await ProductCategory.findAll({
            include: [{
                all: true
            }]
        });

        this.products = butcher.products.map(p => {
            p.product.categories = productCategories.filter(pc => pc.productid == p.productid)
            return p.product
        })

        this.vitrinProducts = butcher.products.filter(bp => bp.vitrin).map(bp => bp.product);

        this.dispatchers = await Dispatcher.findAll({
            where: {
                butcherId: this.butcher.id,
                enabled: true
            },
            order: [["toarealevel", "DESC"], ["fee", "ASC"]],
            include: [
                {
                    all: true
                }
            ]
        })

        for (let i = 0; i < this.dispatchers.length; i++) {
            this.dispatchers[i].address = await this.dispatchers[i].toarea.getPreferredAddress()
        }

        let pageTitle = butcher.pageTitle || `${butcher.name}` ;
        let pageDescription = butcher.pageDescription || `${butcher.name}, ${butcher.address} ${butcher.areaLevel1.name}/${butcher.areaLevel2.name} adresinde hizmet vermekte olup ${(butcher.phone || '').trim().slice(0, -5) + " ..."} numaralı telefon ile ulaşabilirsiniz.`
        let pageThumbnail = this.req.helper.imgUrl('butcher-google-photos', butcher.slug)
        this.res.render('pages/butcher', this.viewData({ pageThumbnail: pageThumbnail, pageTitle: pageTitle, pageDescription: pageDescription, butcher: butcher, images: images }));
    }


    @Auth.Anonymous()
    async butcherPhotoRoute() {
        if (!this.req.params.butcher || !this.req.params.filename) return this.next();
        let butcher = await ButcherModel.findOne({
            where: { slug: this.req.params.butcher }
        });
        if (!butcher)
            return this.next();

        let photo: ResourceCacheItem, thumbnail = this.req.query.thumbnail, url = "";

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
        config.nodeenv == 'development' ? router.get("/:butcher/fotograf/:filename", Route.BindRequest(Route.prototype.butcherPhotoRoute)) : null;
    }
}