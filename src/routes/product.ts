import { ApiRouter, ViewRouter } from '../lib/router';
import * as express from "express";
import * as maps from "@google/maps"
import ProductModel from '../db/models/product';
import { Auth } from '../lib/common';
import Helper from '../lib/helper';
import Resource from '../db/models/resource';
import ResourceRoute from './resource';
import * as path from "path"
import * as Jimp2 from 'jimp'
const Jimp = <Jimp2.default>require('jimp');
import * as fs from "fs"
import moment = require('moment');
import Category from '../db/models/category';
import Butcher from '../db/models/butcher';
import ProductApi from './api/product';
import DispatcherApi from './api/dispatcher';
import Area from '../db/models/area';
import ButcherProduct from '../db/models/butcherproduct';
import Dispatcher from '../db/models/dispatcher';
import { PreferredAddress } from '../db/models/user';
var MarkdownIt = require('markdown-it')
import * as _ from "lodash";
import { ResourceCacheItem, ProductCacheItem } from '../lib/cache';
import { ShopCard } from '../models/shopcard';
import config from '../config';
import { Op, Sequelize, where } from 'sequelize';
import { ProductLd } from '../models/ProductLd';
import ProductCategory from '../db/models/productcategory';

interface ButcherSelection {
    best: Dispatcher,
    servingL2: Dispatcher[]
    servingL3: Dispatcher[]
    takeOnly: Butcher[]
}

export default class Route extends ViewRouter {

    butcherProducts: ButcherProduct[] = [];
    markdown = new MarkdownIt();
    foods: Resource[] = [];
    butcherResources: Resource[] = [];
    productLd: ProductLd;

    async tryBestFromShopcard(serving: Dispatcher[], others: Dispatcher[] = []) {
        let shopcard = await ShopCard.createFromRequest(this.req);
        let scButcher = (shopcard.items && shopcard.items.length) ? shopcard.items[0].product.butcher.id : null;
        if (scButcher) {
            let inServing = serving.find(p => p.butcherid == scButcher);
            let inOther = others.find(p => p.butcherid == scButcher);
            return inServing || inOther
        } else return null;
    }

    async tryBestFromOrders(serving: Dispatcher[]) {
        serving.forEach(s => s.lastorderitemid = s.lastorderitemid || 0);
        let orderedByDate = _.orderBy(serving, 'lastorderitemid', 'asc');
        return orderedByDate.length ? orderedByDate[0] : null;
    }

    tryBestAsRandom(serving: Dispatcher[], others: Dispatcher[] = []) {
        let res = (serving.length > 0 ? serving[0] : null);
        res = res || (others.length > 0 ? others[0] : null);

        return res;
    }

    async bestButchersForProduct(pid, adr: PreferredAddress, userBest: Butcher): Promise<ButcherSelection> {
        let api = new DispatcherApi(this.constructorParams);

        let serving = await api.getButchersSelingAndDispatches(adr, pid);

        let takeOnly = serving.filter(p => p.takeOnly == true);
        let servingL3 = serving.filter(p => p.toarealevel == 3 && !p.takeOnly);
        let servingL2 = serving.filter(p => p.toarealevel == 2 && !p.takeOnly && (servingL3.find(m => m.butcher.id == p.butcher.id) == null));


        takeOnly = Helper.shuffle(takeOnly)
        servingL3 = Helper.shuffle(servingL3)
        servingL2 = Helper.shuffle(servingL2)

        let mybest: Dispatcher = await this.tryBestFromShopcard(serving) || 
            await this.tryBestFromOrders(servingL3) || 
            await this.tryBestFromOrders(servingL2) || this.tryBestAsRandom(serving);

        

        if (mybest) {            
            mybest = (userBest ? (serving.find(s=>s.butcherid == userBest.id)): null) || mybest;
        }

        return {
            best: mybest,
            servingL2: servingL2,
            servingL3: servingL3,
            takeOnly: takeOnly
        }


    }

    @Auth.Anonymous()
    async productRoute() {
        if (!this.req.params.product) {
            return this.next();
        }
        let product = await ProductModel.findOne({
            include: [{
                model: ProductCategory,
                include: [Category]
            }
            ], where: { slug: this.req.params.product }
        });
        if (!product) return this.next();

        await product.loadResources();
        let api = new ProductApi(this.constructorParams);
        let dapi = new DispatcherApi(this.constructorParams);

        let butcher: Butcher = this.req.query.butcher ? await Butcher.getBySlug(this.req.query.butcher) : null;
        this.foods = await api.getTarifVideos([product])
        if (this.req.query.semt) {
            let l3 = await Area.getBySlug(this.req.query.semt);
            if (l3 && l3.level == 3) {
                await this.req.helper.setPreferredAddress({
                    level3Id: l3.id
                }, true)
            }
        }




        let selectedButchers: ButcherSelection;

        if (!this.req.prefAddr) {
            selectedButchers = {
                best: null,
                servingL2: [],
                servingL3: [],
                takeOnly: []
            }
        } else
            selectedButchers = await this.bestButchersForProduct(product.id, this.req.prefAddr, butcher);



        
        let view = await api.getProductView(product, selectedButchers.best ? selectedButchers.best.butcher : null, null,  true)
        let serving = selectedButchers.servingL2.concat(selectedButchers.servingL3).concat(<any>selectedButchers.takeOnly);


        serving.forEach(s => {
            let butcher = s instanceof Dispatcher ? s.butcher: s;
            let dispatcher = s instanceof Dispatcher ? s: null;
            if (view.butcher && (butcher.id != view.butcher.id)) {
                let bp = butcher.products.find(bp => bp.productid == product.id);
                view.alternateButchers.push({
                    butcher: {
                        id: butcher.id,
                        slug: butcher.slug,
                        name: butcher.name,
                        kgPrice: bp ? bp.kgPrice: 0,
                        productNote: bp ? bp.mddesc || "" : "",
                        thumbnail: this.req.helper.imgUrl("butcher-google-photos", butcher.slug)
                    },
                    dispatcher: dispatcher ? {
                        id: dispatcher.id,
                        fee: dispatcher.fee,
                        min: dispatcher.min,
                        totalForFree: dispatcher.totalForFree,
                        type: dispatcher.type,
                        priceInfo: dispatcher.priceInfo,
                        takeOnly: dispatcher.takeOnly
                    }: null,
                    purchaseOptions: api.getPurchaseOptions(product, bp).map(po => {
                        return {
                            unit: po.unit,
                            unitPrice: po.unitPrice
                        }
                    })
                })
            } else if (view.butcher && view.butcher.id == s.butcher.id) {
                view.dispatcher = dispatcher ? {
                    id: dispatcher.id,
                    fee: dispatcher.fee,
                    min: dispatcher.min,
                    totalForFree: dispatcher.totalForFree,
                    type: dispatcher.type,
                    priceInfo: dispatcher.priceInfo,
                    takeOnly: dispatcher.takeOnly
                }: null
            }
        })




        if (view.butcher) {
            this.butcherProducts = await ButcherProduct.findAll({
                where: {
                    butcherid: view.butcher.id,
                    vitrin: true,

                    [Op.or]: [
                        {
                            kgPrice: {
                                [Op.gt]: 0
                            }
                        },
                        {
                            unit1price: {
                                gt: 0.0
                            }
                        },
                        {
                            unit2price: {
                                [Op.gt]: 0.0
                            }
                        },
                        {
                            unit3price: {
                                [Op.gt]: 0.0
                            }
                        }
                    ]
                },
                include: [
                    {
                        model: ProductModel
                    }
                ]
            })
        }

            //     this.butcherResources = await Resource.findAll({
            //         where: {
            //             type: ["butcher-google-photos", "butcher-videos"],
            //             ref1: view.butcher.id,
            //             list: true
            //         },
            //         order: [["displayOrder", "DESC"], ["updatedOn", "DESC"]]
            //     })
            // }
            this.productLd = await api.getProductLd(product);
            this.res.render('pages/product', this.viewData({
                butcherProducts: this.butcherProducts.map(p => p.product), butchers: selectedButchers,
                pageTitle: product.name + ' Siparişi ve Fiyatları',
                // pageDescription: product.pageDescription + ' ', 


                pageThumbnail: this.req.helper.imgUrl('product-photos', product.slug),
                pageDescription: product.generatedDesc,
                product: product, view: view,
                __supportMessage: `${`Merhaba, kasaptanal.com üzerinden size ulaşıyorum. ${product.name} ile ilgili whatsapp üzerinden yardımcı olabilir misiniz?`}`
            }))
        
    }


    @Auth.Anonymous()
    async productPhotoRoute() {
        if (!this.req.params.product || !this.req.params.filename) return this.next();
        let product = this.req.__products[this.req.params.product];

        if (!product) return this.next();

        let photo: ResourceCacheItem, thumbnail = this.req.query.thumbnail, url = "";

        let res = new ResourceRoute(this.constructorParams)

        let type = "product-photos";
        let defaultFile = "public/img/product-default-thumbnail.jpg"
        if (this.req.params.filename == "thumbnail") {
            thumbnail = true;
            photo = this.req.helper.getResourcesOfType(type + product.id).find(p => p.ref1 == product.id)
        }
        else photo = this.req.helper.getResourcesOfType(type + this.req.params.filename).find(p => p.contentUrl == this.req.params.filename);
        res.sendResource(photo, thumbnail, thumbnail ? defaultFile : null)
    }



    static SetRoutes(router: express.Router) {
        router.get("/:product", Route.BindRequest(Route.prototype.productRoute));
        // router.get("/:product/yemek-tarifi/:tarif", Route.BindRequest(Route.prototype.productRoute));
        // router.get("/:product/ile-yapin/:tarif", Route.BindRequest(Route.prototype.productRoute));
        //router.get("/:product", Route.BindRequest(Route.prototype.productRoute));
        config.nodeenv == 'development' ? router.get("/:product/resimler/:filename", Route.BindRequest(Route.prototype.productPhotoRoute)) : null;
    }
}