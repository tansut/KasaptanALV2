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
import ProductApi, { ButcherProperty } from './api/product';
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
    selectedButcher: Butcher;
    api: ProductApi;
    productTypeManager: ProductTypeManager = null;
    logisticsProvider: LogisticProvider;

    dispatcherTypes = DispatcherTypeDesc;
    userArea: Area;

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

    // async tryBestFromOrders(serving: Dispatcher[]) {
    //     return null;
    //     let fullServing = serving.filter(s => s.selection == DispatcherSelection.full);
    //     if (fullServing.length == 0) fullServing = serving;
    //     fullServing.forEach(s => s.lastorderitemid = (s.lastorderitemid || 0));
    //     let orderedByDate = _.orderBy(fullServing, 'lastorderitemid', 'asc');
    //     let orderedByKasapCard = _.orderBy(orderedByDate, 'butcher.enablePuan', 'desc');
    //     return orderedByKasapCard.length ? orderedByKasapCard[0] : null;
    // }

    async findBestButcher(serving: Dispatcher[], product: Product, adr: PreferredAddress): Promise<Dispatcher[]> {



        //let minDistance = Math.min.apply(Math, serving.map(s=>s.butcherArea.bestKm));
        let maxDistance = Math.max.apply(Math, serving.map(s=>s.butcherArea.bestKm));

        //let minPuan = Math.min.apply(Math, serving.map(s=>s.butcher.customerPuanRate));
        //let maxPuan = Math.max.apply(Math, serving.map(s=>s.butcher.customerPuanRate));

        //let minRate = Math.min.apply(Math, serving.map(s=>s.butcher.totalRatingAsPerc));
        //let maxRate = Math.max.apply(Math, serving.map(s=>s.butcher.totalRatingAsPerc));

        let minShipTotal = Math.min.apply(Math, serving.map(s=>s.butcher.shipTotalCount));
        let maxShipTotal = Math.max.apply(Math, serving.map(s=>s.butcher.shipTotalCount));

        let minPrice = Math.min.apply(Math, serving.map(s=> {
            let bp = s.butcher.products.find(p=>p.productid == product.id);
            bp.product = product;
            return bp.priceView.price;
        }));

        let maxPrice = Math.max.apply(Math, serving.map(s=> {
            let bp = s.butcher.products.find(p=>p.productid == product.id);
            bp.product = product;
            return bp.priceView.price;
        }));      
        let weights = await this.api.getButcherPropertyWeights();

        let l1 = this.userArea.getLevel(1);
        let l2 = this.userArea.getLevel(2);
        let l3 = this.userArea.getLevel(3);

        let orderSize = l3.butcherWeightOrder || l2.butcherWeightOrder || l1.butcherWeightOrder || 150.00;

        let customerFees: {[key: number]: number} = {}, minFee = Number.MAX_SAFE_INTEGER, maxFee = Number.MIN_SAFE_INTEGER;
        
        for(let i = 0; i < serving.length;i ++) {
            let fromTo: FromTo = {
                start: serving[i].butcher.location,
                sId: serving[i].id.toString(),
                finish: this.userArea.location,
                fId: this.userArea.id.toString()
            }
            let offerRequest = serving[i].provider.offerRequestFromTo(fromTo);
            offerRequest.orderTotal = orderSize;
            let offer = await serving[i].provider.requestOffer(offerRequest);
            if (offer) {
                serving[i].provider.calculateCustomerFee(offer);
                customerFees[serving[i].butcher.id] = offer.customerFee;
                minFee = Math.min(minFee, offer.customerFee);
                maxFee = Math.max(maxFee, offer.customerFee);
            }
        }

        // let offerRequest = this.offerRequestFromTo(ft);
        // let offer = await this.requestOffer(offerRequest);

        // for (let i = 1; i < 10; i++)
        //     prices.push(Helper.asCurrency(i * slice))

        // for (let i = 0; i < prices.length; i++) {
        //     offer.orderTotal = Helper.asCurrency((2 * prices[i] + slice) / 2);
        //     this.calculateCustomerFee(offer);


        let limits: {[key in ButcherProperty]: number []} = {
            'distance': [0, maxDistance],
            'kasapkart': [0.00, 0.10],
            'productPrice': [minPrice, maxPrice],
            'shipmentPrice': [minFee, maxFee],
            'rating': [80, 100],
            'shipTotal': [0, maxShipTotal],
            'butcherSelection': [-1,1],
            'productSelection': [-1,1]
        }



        weights = l1.butcherWeights ? {...weights, ...l1.butcherWeights}: weights; 
        weights = l2.butcherWeights ? {...weights, ...l2.butcherWeights}: weights; 
        weights = l3.butcherWeights ? {...weights, ...l3.butcherWeights}: weights; 

        for(let i = 0; i < serving.length;i ++) {
            
            serving[i].butcher.calculatedRate = await this.api.calculateButcherRate(serving[i].butcher, product, serving[i], limits, typeof customerFees[serving[i].butcher.id] == 'undefined' ? maxFee: customerFees[serving[i].butcher.id], weights)
        }

        let weightSorted = _.orderBy(serving, 'butcher.calculatedRate', 'desc');

        return weightSorted;

        // let nearRadius = (this.userArea && this.userArea.selectionRadius) ? this.userArea.selectionRadius: 12;
        // let alternateRadius = Math.round(nearRadius * 1.5);

        // let nearButchers = serving.filter(p => p.butcherArea.bestKm <= nearRadius);
        // let alternateButchers = serving.filter(p => (p.butcherArea.bestKm > nearRadius && p.butcherArea.bestKm <= alternateRadius));
        // let farButchers = serving.filter(p => p.butcherArea.bestKm > alternateRadius);

        // let defaultButchers = nearButchers;

        // if (defaultButchers.length == 0) {
        //     defaultButchers = defaultButchers.concat(alternateButchers);
        //     if (defaultButchers.length == 0 && (farButchers.length > 0)) {
        //         defaultButchers.push(farButchers[0]);
        //     }
        // }

        // defaultButchers = defaultButchers.length == 0 ? serving : defaultButchers;


        // let fullServing = serving.filter(s => (s.selection == DispatcherSelection.full || s.selection == DispatcherSelection.onecikar));
        // let mention = fullServing.filter(s => s.selection == DispatcherSelection.onecikar);
        // let finalList = mention.length > 0 ? mention: fullServing;
        // if (finalList.length == 0) finalList = serving;
        // finalList = Helper.shuffle(finalList)
        // let res = (finalList.length > 0 ? finalList[0] : null);
        // return res;
    }

    useL1(product: Product) {
        return (product.productType == ProductType.kurban)
    }


    async locateButchersForProduct(product: Product, adr: PreferredAddress, userBest: Butcher): Promise<ButcherSelection> {
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

        let weighedServing = await this.findBestButcher(serving, product, adr);
        let mybest: Dispatcher = await this.tryBestFromShopcard(weighedServing) || weighedServing[0];
        
        if (mybest) {
            mybest = (userBest ? (weighedServing.find(s => s.butcherid == userBest.id)) : null) || mybest;
        }
        return {
            best: mybest,
            serving: weighedServing,
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
        this.api = new ProductApi(this.constructorParams);
        this.shopcard = await ShopCard.createFromRequest(this.req);
        await product.loadResources();
        await product.loadnutritionValues();

        let shopcard = await ShopCard.createFromRequest(this.req);

        this.shopCardIndex = this.req.query.shopcarditem ? parseInt(this.req.query.shopcarditem as string) : -1;
        this.shopCardItem = (this.shopCardIndex >= 0 && shopcard.items) ? shopcard.items[this.shopCardIndex] : null;
        let butcher: Butcher = null;
        if (this.shopCardItem) {
            butcher = await Butcher.getBySlug(this.shopCardItem.product.butcher.slug);
        } else if (this.req.query.butcher) {
            butcher = await Butcher.getBySlug(this.req.query.butcher as string)
        } else if (this.req.session && this.req.session.prefButcher) {
            butcher = await Butcher.getBySlug(this.req.session.prefButcher as string)
        }
         
         this.reviews = await this.api.loadReviews(product.id, (butcher && this.showOtherButchers()) ? 0: (butcher ? butcher.id:0));
        // this.reviews = await api.loadReviews(product.id, butcher ? (this.req.query.butcher ? butcher.id : 0): 0);
        //this.reviews = await api.loadReviews(product.id, 0);


        this.foods = await this.api.getTarifVideos([product])
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
        } else {
            this.userArea = await Area.findByPk(this.req.prefAddr.level3Id);
            await this.userArea.getPreferredAddress();
            selectedButchers = await this.locateButchersForProduct(product, this.req.prefAddr, butcher);
        }
        let serving = selectedButchers.serving.concat(<any>selectedButchers.takeOnly);


        if (selectedButchers.best && this.req.query.butcher && (selectedButchers.best.butcher.slug != this.req.query.butcher)) {
            serving = [];
            selectedButchers.best = null;
        }

        let view = await this.api.getProductView(product, selectedButchers.best ? selectedButchers.best.butcher : null, null, true)

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
                        kgPrice: bp ? bp.kgPrice : 0,
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
                        priceSlice: await dispatcher.provider.priceSlice(fromTo),
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