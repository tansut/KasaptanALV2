import * as express from "express";
import { ViewRouter } from '../../lib/router';
import moment = require('moment');
import { CacheManager } from "../../lib/cache";
import Butcher from "../../db/models/butcher";
import { Auth } from "../../lib/common";
import ButcherProduct from "../../db/models/butcherproduct";
import Product from "../../db/models/product";
import Area from "../../db/models/area";
import { ButcherRouter } from "./home";
import * as _ from "lodash";
import Helper from "../../lib/helper";


export default class Route extends ButcherRouter {

    sellingProducts = [];
    otherProducts = [];
    goto: string;
    _ = _;

    async getProducts() {
        return await Product.findAll({
            include: [{
                all: true
            }
            ],
            order: ["Tag1", "Name"],
            where: {

            }
        });
    }


    getProductUnits(product: Product, bp) {
        let result = [];
        (product.unit1 && product.unit1 != "" ) ? result.push({
            unit: product.unit1,
            unitTitle: product.unit1title,
            kgRatio: product.unit1kgRatio,
            desc: product.unit1desc,
            enabled: bp.unit1enabled,
            butcherNote: product.unit1ButcherNote,
            price: Helper.asCurrency(bp.unit1price > 0 ? bp.unit1price: product.unit1kgRatio * bp.kgPrice)
    
        }) : null;
        (product.unit2 && product.unit2 != "") ? result.push(
            {
                unit: product.unit2,
                unitTitle: product.unit2title,
                kgRatio: product.unit2kgRatio,
                desc: product.unit2desc,
                enabled: bp.unit2enabled,
                butcherNote: product.unit2ButcherNote,

                price: Helper.asCurrency(bp.unit2price > 0 ? bp.unit2price: product.unit2kgRatio * bp.kgPrice)

            }
        ) : null;
        (product.unit3 && product.unit3 != "") ? result.push(
            {
                unit: product.unit3,
                unitTitle: product.unit3title,
                kgRatio: product.unit3kgRatio,
                desc: product.unit3desc,
                enabled: bp.unit3enabled,
                butcherNote: product.unit3ButcherNote,
                price: Helper.asCurrency(bp.unit3price > 0 ? bp.unit3price: product.unit3kgRatio * bp.kgPrice)

            }
        ) : null;
        return result;
    }



    getButcherProductInfo(butcherProduct, product = null) {
        //let butcherProduct = this.butcher.products.find(c => c.productid == productid)
        return butcherProduct ? {
            displayOrder: butcherProduct.displayOrder,
            enabled: butcherProduct.enabled,
            bp: butcherProduct,
            product: product || butcherProduct.product,
            unit1price: butcherProduct.unit1price,            
            unit2price: butcherProduct.unit2price,
            unit3price: butcherProduct.unit3price,
            unit1enabled: butcherProduct.unit1enabled,
            unit2enabled: butcherProduct.unit2enabled,
            unit3enabled: butcherProduct.unit3enabled,
            vitrin: butcherProduct.vitrin,
            kgPrice: butcherProduct.kgPrice,
            mddesc: butcherProduct.mddesc
        } : {
                displayOrder: "",
                enabled: false,
                unit1price: 0,
                unit2price: 0,
                unit3price: 0,
                unit1enabled: true,
                unit2enabled: true,
                unit3enabled: true,
                vitrin: false,
                kgPrice: 0,
                mddesc: "",
                product: product
            }
    }

    async setProducts() {
        let selling = this.butcher.products.filter(p => {
            return p.enabled
        })
        selling = _.sortBy(selling, ["displayOrder"]).reverse();

        let allproducts = await this.getProducts()

        let others = allproducts.filter(p => {
            let bp = this.butcher.products.find(bp => {
                return bp.enabled == true && bp.productid == p.id
            })
            return !bp
        })
        others = _.sortBy(others, ["displayOrder"]).reverse();

        this.sellingProducts = selling.map(p => this.getButcherProductInfo(p));
        this.otherProducts = others.map(p => this.getButcherProductInfo(null, p));
    }

    async saveProductRoute() {
        await this.setButcher();

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
        newItem.displayOrder = (this.req.body.productdisplayorder ? parseInt(this.req.body.productdisplayorder) : newItem.displayOrder)
        newItem.unit1price = this.req.body.unit1price ? parseFloat(this.req.body.unit1price) : 0;
        newItem.unit2price = this.req.body.unit2price ? parseFloat(this.req.body.unit2price) : 0;
        newItem.unit3price = this.req.body.unit3price ? parseFloat(this.req.body.unit3price) : 0;
        newItem.kgPrice = this.req.body.productkgPrice ? parseFloat(this.req.body.productkgPrice) : 0;
        newItem.mddesc = this.req.body.productmddesc;

        newItem.unit1enabled = this.req.body.unit1enabled =="on";
        newItem.unit2enabled = this.req.body.unit2enabled =="on";
        newItem.unit3enabled = this.req.body.unit3enabled =="on";

        if (
            newItem.enabled && ( 
            !(Helper.nvl(newItem.kgPrice) || Helper.nvl(newItem.unit1price) || Helper.nvl(newItem.unit2price) || Helper.nvl(newItem.unit3price)) ||
            !(newItem.unit1enabled || newItem.unit2enabled || newItem.unit3enabled))
        ) {
            this.goto = "p" + productid.toString();
            await this.setProducts();
            this.res.render("pages/butcher.products.ejs", this.viewData({
                _usrmsg: {
                    text: "Geçerli satış değerleri girmeden ürün satılamaz",
                    type: 'danger'
                }
            }))
        } else {
            await newItem.save();
            await this.setButcher();
            await this.setProducts();
            this.goto = "p" + productid.toString();

            this.res.render("pages/butcher.products.ejs", this.viewData({

            }))

        }


    }

    async viewRoute() {
        await this.setButcher();
        await this.setProducts();
        // (p.kgPrice > 0 || p.unit1price > 0 || p.unit2price > 0 || p.unit3price > 0)


        this.res.render("pages/butcher.products.ejs", this.viewData({

        }))
    }

    static SetRoutes(router: express.Router) {
        router.get("/products", Route.BindRequest(this.prototype.viewRoute));
        router.get("/product/save", Route.BindRequest(this.prototype.viewRoute));
        router.post("/product/save", Route.BindRequest(this.prototype.saveProductRoute));
    }
}

