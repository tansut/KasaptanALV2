import { ApiRouter, ViewRouter } from '../../lib/router';
import * as express from "express";
import * as maps from "@google/maps"
import ButcherModel from '../../db/models/butcher';
import moment = require('moment');
import { Auth } from '../../lib/common';
import Area from '../../db/models/area';
import Resource from '../../db/models/resource';
import { parse } from 'querystring';
import { threadId } from 'worker_threads';
import Helper from '../../lib/helper';
import Product from '../../db/models/product';
import ProductCategory from '../../db/models/productcategory';
import Category from '../../db/models/category';
import ButcherProduct from '../../db/models/butcherproduct';
import Dispatcher from '../../db/models/dispatcher';
import IyziPayment from '../../lib/payment/iyzico';
import { CreditcardPaymentFactory } from '../../lib/payment/creditcard';

export default class Route  extends ViewRouter {

    butcher: ButcherModel;
    products: Product[];

    dispatchs: Dispatcher[] = [];

    activetab: string;

    darea1: Area [] = [];
    darea2: Area [] = [];
    darea3: Area [] = [];

    darea1sel: number;
    darea2sel: number;

    @Auth.Anonymous()
    async listViewRoute() {

        let butchers = await ButcherModel.findAll({
            order: ["name"]
        })

        this.res.render('pages/admin/butcher.list.ejs', this.viewData({ butchers: butchers }))
    }

    async getButcher() {
        return await ButcherModel.findOne({
            include: [{
                all: true,
                //model: ButcherProduct,
                //include: [Area]
            }], where: { slug: this.req.params.butcher }
        });
    }

    async getResources(butcher) {
        return await Resource.findAll({
            where: {
                type: "butcher-google-photos",
                ref1: butcher.id
            },
            order: [["displayOrder", "DESC"], ["updatedOn", "DESC"]]
        })
    }

    async getProducts() {
        return await Product.findAll({
            include: [{
                all: true
            }
            ], 
            order: ["Tag1", "Name"],
            where: {}
        });
    }

    getProductUnits(product: Product) {
        let result = [];
        (product.unit1 && product.unit1 != "" && product.unit1 != 'kg') ? result.push(product.unit1) : null;
        (product.unit2 && product.unit2 != "" && product.unit2 != 'kg') ? result.push(product.unit2) : null;
        (product.unit3 && product.unit3 != "" && product.unit3 != 'kg') ? result.push(product.unit3) : null;
        return result;
    }

    getButcherProductInfo(productid) {
        let butcherProduct = this.butcher.products.find(c => c.productid == productid)
        return butcherProduct ? {
            displayOrder: butcherProduct.displayOrder,
            enabled: butcherProduct.enabled,
            product: butcherProduct,
            unit1price: butcherProduct.unit1price,
            unit2price: butcherProduct.unit2price,
            unit3price: butcherProduct.unit3price,
            vitrin: butcherProduct.vitrin,
            kgPrice: butcherProduct.kgPrice,
            mddesc: butcherProduct.mddesc
        } : {
                displayOrder: "",
                enabled: false,
                unit1price: 0,
                unit2price: 0,
                unit3price: 0,
                vitrin: false,
                kgPrice: 0,
                mddesc: ""
            }
    }


    @Auth.Anonymous()
    async editViewRoute() {
        if (!this.req.params.butcher) {
            return this.next();
        }

        this.butcher = await this.getButcher();
        let resources = await this.getResources(this.butcher);
        this.products = await this.getProducts();
        this.dispatchs = await Dispatcher.findAll({
            where: {
                butcherId: this.butcher.id
            },
            order: [["toarealevel", "DESC"], ["fee", "ASC"]],
            include: [
                {
                    all: true
                }
            ]
        })

        for (let i = 0; i < this.dispatchs.length; i++) {
            this.dispatchs[i].address = await this.dispatchs[i].toarea.getPreferredAddress()
        }

        let area1 = await Area.findAll({
            where: {
                level: 1
            }
        });

        let area2 = await Area.findAll({
            where: {
                level: 2,
                parentid: this.butcher.areaLevel1Id
            }
        });

        let area3 = await Area.findAll({
            where: {
                level: 3,
                parentid: this.butcher.areaLevel2Id
            }
        });

        this.darea1 = await Area.findAll({
            where: { level: 1 }
        });

        this.res.render('pages/admin/butcher.edit.ejs', this.viewData({ images: resources, area1: area1, area2: area2, area3: area3, butcher: this.butcher }))
    }


    async dispatchRoute() {
        if (!this.req.params.butcher) {
            return this.next();
        }
        this.butcher = await this.getButcher();



        this.darea1 = await Area.findAll({
            where: { level: 1 }
        });

        if (parseInt(this.req.body.dareal1) > 0) {
            this.darea1sel = parseInt(this.req.body.dareal1)
        
            this.darea2 = await Area.findAll({
                where: { level: 2, parentid :parseInt(this.req.body.dareal1) }
            });
        }

        if (parseInt(this.req.body.dareal2) > 0) {
            this.darea2sel = parseInt(this.req.body.dareal2)
            this.darea3 = await Area.findAll({
                where: { level: 3, parentid :parseInt(this.req.body.dareal2) }
            });
        }

        if (this.req.body.add == "ilceekle") {
            let l2 = this.darea2.find(p=>p.id == parseInt(this.req.body.dareal2))
            let paddr = await l2.getPreferredAddress();
            let d = new Dispatcher();
            d.toarealevel = 2;
            d.toareaid = parseInt(this.req.body.dareal2);
            d.totalForFree = parseInt(this.req.body.free);
            d.fee = parseInt(this.req.body.fee);
            d.type = 'butcher';
            d.name = this.butcher.name;
            d.butcherid = this.butcher.id;
            d.note = paddr.display;
            d.typeid = 0;
            await d.save();
        }  

 

        if (this.req.body.add == "semtekle") {
            let l3 = this.darea3.find(p=>p.id == parseInt(this.req.body.dareal3))
            let paddr = await l3.getPreferredAddress();
            let d = new Dispatcher();
            d.toarealevel = 3;
            d.toareaid = parseInt(this.req.body.dareal3);
            d.totalForFree = parseInt(this.req.body.free);
            d.fee = parseInt(this.req.body.fee);
            d.type = 'butcher';
            d.name = this.butcher.name;
            d.butcherid = this.butcher.id;
            d.note = paddr.display;
            d.typeid = 0;
            await d.save();
        }  

        if (this.req.body.delete) {
            let id = parseInt(this.req.body.delete);
            await Dispatcher.destroy({
                where: {
                    id: id
                }
            })
        } else if (this.req.body.update) {
            let id = parseInt(this.req.body.update);
            let d = await Dispatcher.findByPk(id);
            let fee = parseInt(this.req.body['fee' + id.toString()])
            let free = parseInt(this.req.body['free' + id.toString()])
            let min = parseInt(this.req.body['min' + id.toString()])
            d.enabled = this.req.body['enabled' + id.toString()] == "on" ? true : false;
            d.takeOnly = this.req.body['takeonly' + id.toString()] == "on" ? true : false;


            d.fee = fee;
            d.totalForFree = free;
            d.min = min;
            await d.save()

        }

        this.activetab = "dispatch";
        return this.editViewRoute()
    }        


    async saveRoute() {

        if (!this.req.params.butcher) {
            return this.next();
        }
        this.butcher = await this.getButcher();
        let resources = await this.getResources(this.butcher);
        this.products = await this.getProducts();

        if (this.req.body.saveAsSubMerchant) {
            let payment = CreditcardPaymentFactory.getInstance();
            let subMerchantReq = payment.subMerchantRequestFromButcher(this.butcher);
            let result = await payment.createSubMerchant(subMerchantReq);
            let k = result.subMerchantKey;
            console.log(k)
        }
        else if (this.req.body.save == "true") {
            this.butcher.slug = this.req.body.butcherslug
            this.butcher.name = this.req.body.butchername;
            this.butcher.address = this.req.body.butcheradres;
            this.butcher.phone = this.req.body.butchertel;
            this.butcher.website = this.req.body.butcherweb;
            this.butcher.postal = this.req.body.butcherpostal;
            this.butcher.areaLevel1Id = parseInt(this.req.body.areal1);
            this.butcher.areaLevel2Id = parseInt(this.req.body.areal2);
            this.butcher.areaLevel3Id = parseInt(this.req.body.areal3);
            this.butcher.approved = this.req.body.butcherapproved ? true : false;
            this.butcher.instagram = this.req.body.butcherinstagram;
            this.butcher.videoInstagramStr = this.req.body.butchervideoinstagram;
            this.butcher.facebook = this.req.body.butcherfacebook;
            this.butcher.description = this.req.body.butcherdesc;
            this.butcher.keywords = this.req.body.keywords;

            await this.butcher.save();

            //return this.res.redirect(`/pages/admin/butcher/${this.butcher.slug}`)
        }

        else if (this.req.body.updateproduct == "true") {
            let productid = parseInt(this.req.body.productid);
            let newItem: ButcherProduct = await ButcherProduct.findOne({
                where: {
                    butcherid: this.butcher.id,
                    productid: productid
                }
            });

            if (newItem == null)
                newItem = new ButcherProduct();

            newItem.enabled = this.req.body.productenabled == "on";
            newItem.vitrin = this.req.body.productvitrin == "on";
            newItem.butcherid = this.butcher.id;
            newItem.productid = productid;
            newItem.displayOrder = (this.req.body.productdisplayorder ? parseInt(this.req.body.productdisplayorder) : 0)
            newItem.unit1price = this.req.body.unit1price ? parseFloat(this.req.body.unit1price) : 0;
            newItem.unit2price = this.req.body.unit2price ? parseFloat(this.req.body.unit2price) : 0;
            newItem.unit3price = this.req.body.unit3price ? parseFloat(this.req.body.unit3price) : 0;
            newItem.kgPrice = this.req.body.productkgPrice ? parseFloat(this.req.body.productkgPrice) : 0;
            newItem.mddesc = this.req.body.productmddesc;
            await newItem.save();
            this.butcher = await this.getButcher();
        }

        else {
            if (parseInt(this.req.body.areal1) != this.butcher.areaLevel1Id)
                this.butcher.areaLevel1Id = parseInt(this.req.body.areal1)

            if (parseInt(this.req.body.areal2) != this.butcher.areaLevel2Id)
                this.butcher.areaLevel2Id = parseInt(this.req.body.areal2)

        }

        let area1 = await Area.findAll({
            where: { level: 1 }
        });

        let area2 = await Area.findAll({
            where: {
                level: 2,
                parentid: this.butcher.areaLevel1Id
            }
        });

        let area3 = await Area.findAll({
            where: {
                level: 3,
                parentid: this.butcher.areaLevel2Id
            }
        });


        this.res.render('pages/admin/butcher.edit.ejs', this.viewData({ images: resources, area1: area1, area2: area2, area3: area3, butcher: this.butcher }))
    }

    static SetRoutes(router: express.Router) {
        router.get("/butcher/googlesearch", Route.BindToView("pages/admin/butcher.googlesearch.ejs"));
        router.get("/butcher/list", Route.BindRequest(Route.prototype.listViewRoute));
        router.get("/butcher/:butcher", Route.BindRequest(Route.prototype.editViewRoute));
        router.post("/butcher/:butcher", Route.BindRequest(Route.prototype.saveRoute));
        router.post("/butcher/:butcher/dispatch", Route.BindRequest(Route.prototype.dispatchRoute));


    }
}

