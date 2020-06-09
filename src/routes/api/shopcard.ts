import { Auth } from '../../lib/common';
import { ApiRouter } from '../../lib/router';
import * as express from "express";
import SiteLog from '../../db/models/sitelog';
import email from '../../lib/email';
import { ShopCard } from '../../models/shopcard';
import Product from '../../db/models/product';
import ProductApi from './product'
import Butcher from '../../db/models/butcher';
import Area from '../../db/models/area';
import Dispatcher from '../../db/models/dispatcher';


export default class Route extends ApiRouter {

    async getDispatcher(to:Area) {
        let res = await Dispatcher.findOne({
            where: {
                toareaid: to.id,                
            }
        })
        return res;
    }

    @Auth.Anonymous()
    async addRoute() {
        let api = new ProductApi(this.constructorParams);
        let item = this.req.body;
      
        let shopcard = await ShopCard.createFromRequest(this.req);
        let product = await Product.findByPk(item.id);
        let butcher = this.req.body.butcher ? await Butcher.findOne( {             
            where: {
               slug: this.req.body.butcher.slug
            },            
                include: [{
                  all: true  
                }]
        }): null;
        let productView = await api.getProductView(product, butcher)
        if (item.shopcardIndex >= 0) {
            shopcard.remove(item.shopcardIndex);
        }
        shopcard.addProduct(productView, item.quantity, item.purchaseoption, item.note, item.productTypeData || {});
        await shopcard.saveToRequest(this.req);
        this.res.send(shopcard);
    }

    @Auth.Anonymous()
    async updateRoute() {
        let api = new ProductApi(this.constructorParams);
        let item = this.req.body;
      
        let shopcard = await ShopCard.createFromRequest(this.req);
        let product = await Product.findByPk(item.id);
        let butcher = this.req.body.butcher ? await Butcher.findOne( {             
            where: {
               slug: this.req.body.butcher.slug
            },            
                include: [{
                  all: true  
                }]
        }): null;
        let productView = await api.getProductView(product, butcher)
        shopcard.addProduct(productView, item.quantity, item.purchaseoption, item.note, item.productTypeData || {});
        await shopcard.saveToRequest(this.req);
        this.res.send(shopcard);
    }    

    @Auth.Anonymous()
    async removeRoute() {
        let item = this.req.body;
        let shopcard = await ShopCard.createFromRequest(this.req);
        shopcard.remove(item.order);
        await shopcard.saveToRequest(this.req);
        this.res.send(shopcard);
    }

    static SetRoutes(router: express.Router) {
        router.post("/shopcard/add", Route.BindRequest(this.prototype.addRoute));
        router.post("/shopcard/update", Route.BindRequest(this.prototype.updateRoute));
        router.post("/shopcard/remove", Route.BindRequest(this.prototype.removeRoute));
    }
}


