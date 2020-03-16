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

interface ButcherSelection {
    best: Butcher,
    servingL2: Dispatcher[]
    servingL3: Dispatcher[]
    others: Butcher[]
}

export default class Route extends ViewRouter {

    butcherProducts: ButcherProduct[] = [];
    markdown = new MarkdownIt();
    foods: Resource[] = [];
    butcherResources: Resource[] = [];
    productLd: ProductLd;

    async tryBestFromShopcard(serving: Butcher[], others: Butcher[]) {
        let shopcard = await ShopCard.createFromRequest(this.req);
        let scButcher = (shopcard.items && shopcard.items.length) ? shopcard.items[0].product.butcher.id : null;
        if (scButcher) {
            let inServing = serving.find(p => p.id == scButcher);
            let inOther = others.find(p => p.id == scButcher);
            return inServing || inOther
        } else return null;
    }

    async tryBestFromOrders(serving: Dispatcher[]) {
        serving.forEach(s=>s.lastorderitemid = s.lastorderitemid || 0);
        let orderedByDate = _.orderBy(serving, 'lastorderitemid', 'asc');
        return orderedByDate.length ? orderedByDate[0].butcher : null;
    }

    tryBestAsRandom(serving: Butcher[], others: Butcher[]) {
        let res = (serving.length > 0 ? serving[0] : null);
        res = res || (others.length > 0 ? others[0] : null);

        return res;
    }

    async bestButchersForProduct(pid, adr: PreferredAddress, userBest: Butcher): Promise<ButcherSelection> {
        let api = new DispatcherApi(this.constructorParams);

        // let sellingl3 = await Butcher.sellingButchers(pid, {
        //     level3Id: this.req.prefAddr.level3Id
        // });

        // let sellingl2 = await Butcher.sellingButchers(pid, {
        //     level2Id: this.req.prefAddr.level2Id
        // });

         let butchersInCity = await Butcher.sellingButchers(pid, {
             level1Id: this.req.prefAddr.level1Id
         });

        let serving = await api.getButchersSelingAndDispatches(adr, pid);

        let servingL3 = serving.filter(p=>p.toarealevel == 3);
        let servingL2 = serving.filter(p=>p.toarealevel == 2 && (servingL3.find(m=>m.butcher.id == p.butcher.id) == null));



        _.remove(butchersInCity, p => serving.find(s => s.butcherid == p.butcher.id));

        let takeButcherIds = _.uniqBy(butchersInCity, function (e) {
            return e.butcherid;
        });

        let takeButchers = takeButcherIds.map(p => p.butcher);
        let servingButchers = serving.map(p => p.butcher);

        takeButchers = Helper.shuffle(takeButchers)
        servingButchers = Helper.shuffle(servingButchers)

        let mybest = await this.tryBestFromShopcard(servingButchers, takeButchers) || await this.tryBestFromOrders(servingL3) || await this.tryBestFromOrders(servingL2) || this.tryBestAsRandom(servingButchers, takeButchers);

        if (mybest)
            mybest = userBest || mybest;

        return {
            best: mybest,
            servingL2: servingL2,
            servingL3: servingL3,
            others: takeButchers
        }


    }

    @Auth.Anonymous()
    async productRoute() {
        if (!this.req.params.product) {
            return this.next();
        }
        let product = await ProductModel.findOne({
            include: [{
                all: true
            }], where: { slug: this.req.params.product }
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


        //let butchersSelling = await Butcher.sellingButchers(product.id);


        let selectedButchers: ButcherSelection;

        if (!this.req.prefAddr) {
            selectedButchers = {
                best: null,
                servingL2: [],
                servingL3: [],
                others: []
            }
        } else
            selectedButchers = await this.bestButchersForProduct(product.id, this.req.prefAddr, butcher);



        if (this.req.prefAddr && !butcher) {



            // let dispatcher = await dapi.bestDispatcher(this.req.prefAddr.level3Id, 3);
            // if (dispatcher && dispatcher.type == 'butcher') {

            // let l1Butchers = await Butcher.sellingButchers(product.id, {
            //     level3Id: this.req.prefAddr.level3Id
            // }); 

            // let l2Butchers = await Butcher.sellingButchers(product.id, {
            //     level2Id: this.req.prefAddr.level2Id
            // });

            // let l3Butchers = await Butcher.sellingButchers(product.id, {
            //     level2Id: this.req.prefAddr.level2Id
            // });

            // }
            // let butchersInSemt = await Butcher.getByArea(this.req.prefAddr.level3Id, 3);
            // let butchersInDistrict = await Butcher.getByArea(this.req.prefAddr.level2Id, 2);
            // let butchersInCity = await Butcher.getByArea(this.req.prefAddr.level1Id, 1);

            //  if (!butcher && l1Butchers.length > 0) selectedButcherProduct = l1Butchers[0];
            //  if (!butcher && l2Butchers.length > 0) selectedButcherProduct = l2Butchers[0];
            //  if (!butcher && l3Butchers.length > 0) selectedButcherProduct = l3Butchers[0];

            //  if (selectedButcherProduct) butcher = selectedButcherProduct.butcher;

            //  this.butcherProducts =  l1Butchers.concat(l1Butchers).concat(l1Butchers)
        }



        // if (this.butcherProducts.length == 0) {
        //     this.butcherProducts = await Butcher.sellingButchers(product.id); 
        // }




        let view = await api.getProductView(product, selectedButchers.best || (selectedButchers.others.length ? selectedButchers.others[0]: null), null, true)




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

            this.butcherResources = await Resource.findAll({
                where: {
                    type: ["butcher-google-photos", "butcher-videos"],
                    ref1: view.butcher.id,
                    list: true
                },
                order: [["displayOrder", "DESC"], ["updatedOn", "DESC"]]
            })
        }
        this.productLd = await api.getProductLd(product);
        this.res.render('pages/product', this.viewData({ butcherProducts: this.butcherProducts.map(p => p.product), butchers: selectedButchers, 
            pageTitle: product.name + ' Siparişi ve Fiyatları', 
            // pageDescription: product.pageDescription + ' ', 


            pageThumbnail: this.req.helper.imgUrl('product-photos', product.slug),
            pageDescription: product.generatedDesc,
            product: product, view: view, 
            __supportMessage: `${`Merhaba, kasaptanal.com üzerinden size ulaşıyorum. ${product.name} ile ilgili whatsapp üzerinden yardımcı olabilir misiniz?`}` }))
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