import { ApiRouter, ViewRouter } from '../lib/router';
import * as express from "express";
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
import ProductApi, { ButcherProperty, ButcherSelection, StartPrice } from './api/product';
import DispatcherApi, { DispatcherQuery } from './api/dispatcher';
import Area from '../db/models/area';
import ButcherProduct from '../db/models/butcherproduct';
import Dispatcher, { DispatcherSelection, DispatcherSelectionWeigts, DispatcherTypeDesc } from '../db/models/dispatcher';
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
import { pbkdf2 } from 'crypto';
import { off } from 'process';
import Brand from '../db/models/brand';
import BrandGroup from '../db/models/brandgroup';



export default class Route extends ViewRouter {
    forceSemt= true;
    semtReturn: string;
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
    selectedButcher: Butcher;
    api: ProductApi;
    productTypeManager: ProductTypeManager = null;
    logisticsProvider: LogisticProvider;

    dispatcherTypes = DispatcherTypeDesc;

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
        this.api = new ProductApi(this.constructorParams);
        let shopcard = this.shopcard = await ShopCard.createFromRequest(this.req);
        await product.loadResources();
        await product.loadnutritionValues();        

        this.shopCardIndex = this.req.query.shopcarditem ? parseInt(this.req.query.shopcarditem as string) : -1;
        this.shopCardItem = (this.shopCardIndex >= 0 && shopcard.items) ? shopcard.items[this.shopCardIndex] : null;
        let butcher: Butcher = null;
        let butcherSelection ='auto-selected';

        if (this.shopCardItem) {
            butcher = await Butcher.getBySlug(this.shopCardItem.product.butcher.slug);
            butcher && (butcherSelection = 'from-shopcard')
        } else if (this.req.query.butcher) {
            butcher = await Butcher.getBySlug(this.req.query.butcher as string);
            butcher && (butcherSelection = 'from-url')
        } else if (this.req.session && this.req.session.prefButcher) {
            butcher = await Butcher.getBySlug(this.req.session.prefButcher as string);
            butcher && (butcherSelection = 'from-session')
        }
         
         this.reviews = await this.api.loadReviews(product.id, (butcher && this.showOtherButchers()) ? 0: (butcher ? butcher.id:0));
        // this.reviews = await api.loadReviews(product.id, butcher ? (this.req.query.butcher ? butcher.id : 0): 0);
        //this.reviews = await api.loadReviews(product.id, 0);


        this.foods = await this.api.getTarifVideos([product])
        if (this.req.query.semt) {
            let area = await Area.getBySlug(this.req.query.semt as string);
            await this.req.helper.setPreferredAddressByArea(area, true)
        }




        let selectedButchers: ButcherSelection;

        if (!this.req.prefAddr) {
            selectedButchers = {
                best: null,
                serving: [],
                takeOnly: []
            }
        } else {
            selectedButchers = await this.api.locateButchersForProduct(product, this.req.prefAddr, butcher, shopcard);
        }
        let serving = selectedButchers.serving.concat(<any>selectedButchers.takeOnly);

        if (selectedButchers.best && this.req.query.butcher && (selectedButchers.best.butcher.slug != this.req.query.butcher)) {
            serving = [];
            selectedButchers.best = null;
        }

        let view = await this.api.getProductView(product, selectedButchers.best ? selectedButchers.best.butcher : null, null, true)

        let fromTo: FromTo;

        if (this.req.prefAddr) {
            fromTo = {
                start: null,
                finish: this.req.prefAddr.based.location,
                fId: this.req.prefAddr.based.id.toString()
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
                        shipday0: butcher.shipday0,
                        shipday1: butcher.shipday1,
                        shipday2: butcher.shipday2,
                        shipday3: butcher.shipday3,
                        shipday4: butcher.shipday4,
                        shipday5: butcher.shipday5,
                        shipday6: butcher.shipday6,
                        id: butcher.id,
                        description: butcher.description,
                        enableCreditCard: butcher.enableCreditCard,
                        slug: butcher.slug,
                        badges: butcher.getBadgeList(),
                        userRatingAsPerc: butcher.userRatingAsPerc,
                        shipRatingAsPerc: butcher.shipRatingAsPerc,
                        shipSuccessText: butcher.shipSuccessText,
                        name: butcher.name,
                        puanData: butcher.getPuanData(this.product.productType),
                        earnedPuan: 0.00,
                        calculatedRate: butcher.calculatedRate,
                        kgPrice: bp ? Helper.CalculateDiscount(bp.discountType, bp.priceDiscount, bp.kgPrice) : 0,
                        regularKgPrice: bp.kgPrice,
                        locationText: butcher.locationText,
                        productNote: bp ? (bp.mddesc ? this.markdown.render(bp.mddesc) : "") : "",
                        thumbnail: this.req.helper.imgUrl("butcher-google-photos", butcher.slug)
                    },
                    dispatcher: dispatcher ? {
                        id: dispatcher.id,
                        fee: dispatcher.fee,
                        minCalculated: dispatcher.minCalculated,
                        totalForFree: dispatcher.totalForFree,
                        type: dispatcher.type,
                        distance: dispatcher.butcherArea.bestKm,
                        priceSlice: [], // await dispatcher.provider.priceSlice(fromTo),
                        priceInfo: dispatcher.priceInfo,
                        userNote: dispatcher.userNote,
                        takeOnly: dispatcher.takeOnly
                    } : null,
                    purchaseOptions: this.api.getPurchaseOptions(product, bp).map(po => {
                        return {
                            unit: po.unit,
                            unitTitle: po.unitTitle,
                            unitPrice: po.unitPrice
                        }
                    })
                })
            } else if (view.butcher && view.butcher.id == s.butcher.id) {
                view.butcher.calculatedRate = butcher.calculatedRate;
                fromTo.start = s.butcher.location;
                fromTo.sId = s.butcher.id.toString();
                this.logisticsProvider = dispatcher ? dispatcher.provider: null;
                view.dispatcher = dispatcher ? {
                    id: dispatcher.id,
                    fee: dispatcher.fee,
                    minCalculated: dispatcher.minCalculated,
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

        this.productLd = (product.status == "onsale") ? await this.api.getProductLd(product, {
            thumbnail: false
        }) : null;

        if (this.productLd) {
            if (!this.productLd.offers) {
                this.productLd = null;
            }
        }

        if (!this.req.prefAddr) {
            if (butcher && butcher.slug == this.req.query.butcher) {
                let pview = await this.api.getProductView(product, butcher);
                this.startPrice = {
                    title: butcher.name,
                    basedOn: 'butcher',
                    view: pview.priceView
                }
            } else {
                if (this.productLd && this.productLd.offers) {

                    this.startPrice = {
                        title: '',
                        basedOn: 'global',
                        view: {
                            price: this.productLd.offers.lowPrice, 
                            unit: this.productLd.offers.unit, 
                            unitTitle: this.productLd.offers.unit,
                            regular: this.productLd.offers.lowPrice
                        }
                    }
                }
            }
        }



        this.dispatchingAvailable = this.req.prefAddr && (view.butcher != null || await new DispatcherApi(this.constructorParams).dispatchingAvailable(this.req.prefAddr, this.api.useL1(this.product)));
        //this.semtReturn = "/" + this.product.slug + 
        //this.appUI.tabIndex = 1;
        let l = this.generateUserLog('product', 'view');
        if (l) {
            l.productid = this.product.id;
            l.productName = this.product.name;
            butcher && (l.butcherid = butcher.id);
            butcher && (l.butcherName = butcher.name);
            l.note = 'butcherselection:' + butcherSelection;
            l.note += (' inframe:' + (this.req.query.frame == '1' ? 'yes':'no'))
            await this.saveUserLog(l);
        }
        this.res.render('pages/product', this.viewData({
            butcherProducts: this.butcherProducts.map(p => p.product), butchers: selectedButchers,
            pageTitle: product.name + ' Siparişi ve Fiyatları',
            // pageDescription: product.pageDescription + ' ', 
           

            pageThumbnail: this.req.helper.imgUrl('product-photos', product.slug),
            pageDescription: product.generatedDesc,
            product: product, view: view,
            __hidesupportMessage: false,
            __supportMessage: `${`Merhaba, kasaptanal.com üzerinden ${this.req.prefAddr ? '' + this.req.prefAddr.display +'':'' } size ulaşıyorum.  ${product.name} (${this.url}/${product.slug}) ile ilgili whatsapp üzerinden yardımcı olabilir misiniz?`}`
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