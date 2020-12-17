import { ApiRouter, ViewRouter } from '../lib/router';
import * as express from "express";
import * as maps from "@google/maps"
import ProductModel, { ProductType } from '../db/models/product';
import { Auth, ProductTypeManager, ProductTypeFactory } from '../lib/common';
import Helper from '../lib/helper';
import Resource from '../db/models/resource';
import ResourceRoute from './resource';
import * as sq from 'sequelize';
import * as path from "path"
import * as Jimp2 from 'jimp'
const Jimp = <Jimp2>require('jimp');
import * as fs from "fs"
import moment = require('moment');
import Category from '../db/models/category';
import Butcher from '../db/models/butcher';
import ProductApi from './api/product';
import DispatcherApi, { DispatcherQuery } from './api/dispatcher';
import Area from '../db/models/area';
import ButcherProduct from '../db/models/butcherproduct';
import Dispatcher, { DispatcherSelection } from '../db/models/dispatcher';
import { PreferredAddress } from '../db/models/user';
var MarkdownIt = require('markdown-it')
import * as _ from "lodash";
import { ResourceCacheItem, ProductCacheItem } from '../lib/cache';
import { ShopCard, ShopcardItem } from '../models/shopcard';
import config from '../config';
import { Op, Sequelize, where } from 'sequelize';
import { ProductLd } from '../models/ProductLd';
import ProductCategory from '../db/models/productcategory';
import Review from '../db/models/review';
import Product from '../db/models/product';
import { PuanCalculator } from '../lib/commissionHelper';
import { LogisticProvider, PriceSlice, FromTo } from '../lib/logistic/core';

import { PriceView } from '../models/common';

interface ButcherSelection {
    best: Dispatcher,
    serving: Dispatcher[]
    // servingL2: Dispatcher[]
    // servingL3: Dispatcher[]
    takeOnly: Dispatcher[]
}

interface StartPrice {
    view: PriceView;
    basedOn: 'butcher' | 'global';
    title: string;
}

export default class Route extends ViewRouter {
    startPrice: StartPrice;
    shopcard: ShopCard;
    butcherProducts: ButcherProduct[] = [];
    markdown = new MarkdownIt();
    foods: Resource[] = [];
    butcherResources: Resource[] = [];
    productLd: ProductLd;
    product: Product;
    reviews: Review[] = [];
    shopCardIndex: number = -1;
    shopCardItem: ShopcardItem = null;
    dispatchingAvailable: boolean = true;

    productTypeManager: ProductTypeManager = null;
    logisticsProvider: LogisticProvider;


    get ProductTypeManager() {
        let params = {
            product: this.product
        }
        if (this.shopCardItem && this.shopCardItem.productTypeData) {
            params = { ...params, ...this.shopCardItem.productTypeData }
        }
        let result = this.productTypeManager || (this.productTypeManager = ProductTypeFactory.create(this.product.productType, params))
        return result;
    }


    showOtherButchers() {
        let show = true;
        
        if (this.req.query.butcher) { 
            show = (this.req.query.utm_medium != 'Social' ) && (this.req.query.utm_medium != 'Butcher');
        }

        // let shopcard = this.shopcard;
        // let scButcher = (shopcard.items && shopcard.items.length) ? shopcard.items[0].product.butcher.id : null;
        // if (scButcher) {
        //     let inServing = serving.find(p => p.butcherid == scButcher);
        //     let inOther = others.find(p => p.butcherid == scButcher);
        //     return inServing || inOther
        // } else return null;

        return show;
    }

    async tryBestFromShopcard(serving: Dispatcher[], others: Dispatcher[] = []) {
        let shopcard = this.shopcard;
        let scButcher = (shopcard.items && shopcard.items.length) ? shopcard.items[0].product.butcher.id : null;
        if (scButcher) {
            let inServing = serving.find(p => p.butcherid == scButcher);
            let inOther = others.find(p => p.butcherid == scButcher);
            return inServing || inOther
        } else return null;
    }

    async tryBestFromOrders(serving: Dispatcher[]) {
        return null;
        let fullServing = serving.filter(s => s.selection == DispatcherSelection.full);
        if (fullServing.length == 0) fullServing = serving;
        fullServing.forEach(s => s.lastorderitemid = (s.lastorderitemid || 0));
        let orderedByDate = _.orderBy(fullServing, 'lastorderitemid', 'asc');
        let orderedByKasapCard = _.orderBy(orderedByDate, 'butcher.enablePuan', 'desc');
        return orderedByKasapCard.length ? orderedByKasapCard[0] : null;
    }

    tryBestAsRandom(serving: Dispatcher[]) {
        let fullServing = serving.filter(s => (s.selection == DispatcherSelection.full || s.selection == DispatcherSelection.onecikar));
        let mention = fullServing.filter(s => s.selection == DispatcherSelection.onecikar);
        let finalList = mention.length > 0 ? mention: fullServing;
        finalList = Helper.shuffle(finalList)
        if (finalList.length == 0) finalList = serving;
        let res = (finalList.length > 0 ? finalList[0] : null);
        return res;
    }

    useL1(product: Product) {
        return (product.productType == ProductType.kurban)
    }

    async bestButchersForProduct(product: Product, adr: PreferredAddress, userBest: Butcher): Promise<ButcherSelection> {
        let api = new DispatcherApi(this.constructorParams);

        let q: DispatcherQuery = {
            adr: adr,
            product: product,
            useLevel1: this.useL1(product),
            orderType: product.productType
        }

        let serving = await api.getDispatchers(q);
        let takeOnly = serving.filter(p => p.takeOnly == true);


        serving = serving.filter(p => !p.takeOnly);
        // let servingL2 = serving.filter(p => p.toarealevel == 2 && !p.takeOnly && (servingL3.find(m => m.butcher.id == p.butcher.id) == null));
        // let servingL1 = serving.filter(p => p.toarealevel == 1 && !p.takeOnly && (servingL2.find(m => m.butcher.id == p.butcher.id) == null) && (servingL3.find(m => m.butcher.id == p.butcher.id) == null));


        //takeOnly = Helper.shuffle(takeOnly)
        // servingL3 = Helper.shuffle(servingL3)
        // servingL2 = Helper.shuffle(servingL2)
        //serving = Helper.shuffle(serving);

        let sameGroup: string[] = []

        _.remove(serving, (item) => {
            if (item.butcher.parentButcher) {
                if (sameGroup.find(g => g == item.butcher.parentButcher)) {
                    return true;
                } else {
                    sameGroup.push(item.butcher.parentButcher);
                    return false;
                }
            } else return false;
        })


        let nearButchers = serving.filter(p => p.butcherArea.bestKm <= 12.0);
        let alternateButchers = serving.filter(p => (p.butcherArea.bestKm > 12.0 && p.butcherArea.bestKm <= 20.0));
        let farButchers = serving.filter(p => p.butcherArea.bestKm > 20.0);

        let defaultButchers = nearButchers;

        if (defaultButchers.length < 1) {
            defaultButchers = defaultButchers.concat(alternateButchers);
        }

        defaultButchers = defaultButchers.length == 0 ? serving : defaultButchers;

        let mybest: Dispatcher = await this.tryBestFromShopcard(serving) ||
            // await this.tryBestFromOrders(servingL3) ||
            // await this.tryBestFromOrders(servingL2) || 
            await this.tryBestFromOrders(serving) ||
            this.tryBestAsRandom(defaultButchers);
        if (mybest) {
            mybest = (userBest ? (serving.find(s => s.butcherid == userBest.id)) : null) || mybest;
        }

        return {
            best: mybest,
            serving: serving,
            // servingL2: servingL2,
            // servingL3: servingL3,
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
        this.product = product;
        let api = new ProductApi(this.constructorParams);
        this.shopcard = await ShopCard.createFromRequest(this.req);

        await product.loadResources();

        let shopcard = await ShopCard.createFromRequest(this.req);

        this.shopCardIndex = this.req.query.shopcarditem ? parseInt(this.req.query.shopcarditem as string) : -1;
        this.shopCardItem = (this.shopCardIndex >= 0 && shopcard.items) ? shopcard.items[this.shopCardIndex] : null;

        let butcher = this.shopCardItem ? await Butcher.getBySlug(this.shopCardItem.product.butcher.slug) : (this.req.query.butcher ? await Butcher.getBySlug(this.req.query.butcher as string) : null);

        this.reviews = await api.loadReviews(product.id, butcher ? (this.req.query.butcher ? butcher.id : 0): 0);


        this.foods = await api.getTarifVideos([product])
        if (this.req.query.semt) {
            let l3 = await Area.getBySlug(this.req.query.semt as string);
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
                serving: [],
                takeOnly: []
            }
        } else
            selectedButchers = await this.bestButchersForProduct(product, this.req.prefAddr, butcher);

        let serving = selectedButchers.serving.concat(<any>selectedButchers.takeOnly);


        if (selectedButchers.best && this.req.query.butcher && (selectedButchers.best.butcher.slug != this.req.query.butcher)) {
            serving = [];
            selectedButchers.best = null;
        }

        let view = await api.getProductView(product, selectedButchers.best ? selectedButchers.best.butcher : null, null, true)

        let fromTo: FromTo;

        if (this.req.prefAddr) {
            let l3 = await Area.findByPk(this.req.prefAddr.level3Id)
            fromTo = {
                start: null,
                finish: l3.location,
                fId: l3.id.toString()
            }
        }

        for (let i = 0; i < serving.length; i++) {
            let s = serving[i];
            let butcher =  s.butcher;
            let dispatcher = s;

            if (view.butcher && (butcher.id != view.butcher.id)) {
                let bp = butcher.products.find(bp => bp.productid == product.id);
                fromTo.start = butcher.location;
                fromTo.sId = butcher.id.toString();
                view.alternateButchers.push({
                    butcher: {
                        id: butcher.id,
                        description: butcher.description,
                        enableCreditCard: butcher.enableCreditCard,
                        slug: butcher.slug,
                        badges: butcher.getBadgeList(),
                        userRatingAsPerc: butcher.userRatingAsPerc,
                        shipRatingAsPerc: butcher.shipRatingAsPerc,
                        name: butcher.name,
                        puanData: butcher.getPuanData(this.product.productType),
                        earnedPuan: 0.00,
                        kgPrice: bp ? bp.kgPrice : 0,
                        locationText: butcher.locationText,
                        productNote: bp ? (bp.mddesc ? this.markdown.render(bp.mddesc) : "") : "",
                        thumbnail: this.req.helper.imgUrl("butcher-google-photos", butcher.slug)
                    },
                    dispatcher: dispatcher ? {
                        id: dispatcher.id,
                        fee: dispatcher.fee,
                        min: dispatcher.min,
                        totalForFree: dispatcher.totalForFree,
                        type: dispatcher.type,
                        distance: dispatcher.butcherArea.bestKm,
                        priceSlice: await dispatcher.provider.priceSlice(fromTo),
                        priceInfo: dispatcher.priceInfo,
                        userNote: dispatcher.userNote,
                        takeOnly: dispatcher.takeOnly
                    } : null,
                    purchaseOptions: api.getPurchaseOptions(product, bp).map(po => {
                        return {
                            unit: po.unit,
                            unitTitle: po.unitTitle,
                            unitPrice: po.unitPrice
                        }
                    })
                })
            } else if (view.butcher && view.butcher.id == s.butcher.id) {
                fromTo.start = s.butcher.location;
                fromTo.sId = s.butcher.id.toString();
                this.logisticsProvider = dispatcher ? dispatcher.provider: null;
                view.dispatcher = dispatcher ? {
                    id: dispatcher.id,
                    fee: dispatcher.fee,
                    min: dispatcher.min,
                    totalForFree: dispatcher.totalForFree,
                    type: dispatcher.type,
                    priceInfo: dispatcher.priceInfo,
                    distance: dispatcher.butcherArea.bestKm,
                    priceSlice: await dispatcher.provider.priceSlice(fromTo),
                    userNote: dispatcher.userNote,
                    takeOnly: dispatcher.takeOnly
                } : null
            }
        }






        if (view.butcher) {
            let calculator = new PuanCalculator();
            view.butcher.earnedPuan = this.req.user ? await calculator.getEarnedButcherPuan(this.req.user.id, view.butcher.id) : 0.00
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
        if (view.butcher) {
            this.butcherResources = await Resource.findAll({
                where: {
                    type: ["butcher-google-photos", "butcher-videos"],
                    ref1: view.butcher.id,
                    list: true
                },
                order: [["displayOrder", "DESC"], ["updatedOn", "DESC"]]
            })
        }

        this.productLd = (product.status == "onsale") ? await api.getProductLd(product) : null;

        if (this.productLd) {
            if (!this.productLd.offers) {
                this.productLd = null;
            }
        }

        if (!this.req.prefAddr) {
            if (butcher && butcher.slug == this.req.query.butcher) {
                let pview = await api.getProductView(product, butcher);
                this.startPrice = {
                    title: butcher.name,
                    basedOn: 'butcher',
                    view: pview.priceView
                }
            } else {
                if (this.productLd && this.productLd.offers) {

                    this.startPrice = {
                        title: 'İstediğiniz gün ve saatte kapınızda!',
                        basedOn: 'global',
                        view: {
                            price: this.productLd.offers.lowPrice, unit: this.productLd.offers.unit, unitTitle: this.productLd.offers.unit
                        }
                    }
                }
            }
        }



        this.dispatchingAvailable = this.req.prefAddr && (view.butcher != null || await new DispatcherApi(this.constructorParams).dispatchingAvailable(this.req.prefAddr, this.useL1(this.product)));

        this.res.render('pages/product', this.viewData({
            butcherProducts: this.butcherProducts.map(p => p.product), butchers: selectedButchers,
            pageTitle: product.name + ' Siparişi ve Fiyatları',
            // pageDescription: product.pageDescription + ' ', 


            pageThumbnail: this.req.helper.imgUrl('product-photos', product.slug),
            pageDescription: product.generatedDesc,
            product: product, view: view,
            __hidesupportMessage: false,
            __supportMessage: `${`Merhaba, kasaptanal.com üzerinden size ulaşıyorum. ${product.name} ile ilgili whatsapp üzerinden yardımcı olabilir misiniz?`}`
        }))

    }


    @Auth.Anonymous()
    async productPhotoRoute() {
        if (!this.req.params.product || !this.req.params.filename) return this.next();
        let product = this.req.__products[this.req.params.product];

        if (!product) return this.next();

        let photo: ResourceCacheItem, thumbnail = false, url = "";

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