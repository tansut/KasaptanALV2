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
import { Google } from '../../lib/google';


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
    //@Auth.RequireCatcpha()    
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
        if (this.req.body.userSelectedButcher) {
            for(var bi in shopcard.butchers) {
                if (shopcard.butchers[bi].slug == this.req.body.userSelectedButcher) {
                    shopcard.butchers[bi].userSelected = true;
                }
            }
        }
        await shopcard.saveToRequest(this.req);
        let l = this.generateUserLog('shopcard', 'add');
        if (l) {
            l.productid = product.id;
            l.productName = product.name;
            l.butcherid = butcher ? butcher.id: undefined;
            l.butcherName = butcher ? butcher.name: undefined;
            await this.saveUserLog(l);
        }
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
        let l = this.generateUserLog('shopcard', 'update');
        if (l) {
            l.productid = product.id;
            l.productName = product.name;
            l.butcherid = butcher ? butcher.id: undefined;
            l.butcherName = butcher ? butcher.name: undefined;
            await this.saveUserLog(l);
        }
        this.res.send(shopcard);
    }    

    @Auth.Anonymous()
    async removeRoute() {
        let item = this.req.body;
        let shopcard = await ShopCard.createFromRequest(this.req);
        let scItem = shopcard.items[item.order]
        shopcard.remove(item.order);
        await shopcard.saveToRequest(this.req);
        let l = this.generateUserLog('shopcard', 'remove');
        if (l) {
            l.productid = scItem.product.id;
            l.productName = scItem.product.name;
            l.butcherid = scItem.product.butcher.id;
            l.butcherName = scItem.product.butcher.name;
            await this.saveUserLog(l);
        }        
        this.res.send(shopcard);
    }

    
    @Auth.Anonymous()
    //@Auth.RequireCatcpha()
    async geocode() {
        if(!this.req.body.address)
            return this.next();
        let semt = this.req.prefAddr.display;
        let coded = await Google.getLocation(this.req.body.address + ' ' + semt)
        this.res.send(coded)
    }

    //@Auth.RequireCatcpha()
    async revgeocode() {
        if(!this.req.body.lat || !this.req.body.lng)
            return this.next();
        let semt = this.req.prefAddr.display;
        let address = await Google.reverse(parseFloat(this.req.body.lat), parseFloat(this.req.body.lng))
        this.res.send(address);
    }



    static SetRoutes(router: express.Router) {
        router.post("/shopcard/geocode", Route.BindRequest(this.prototype.geocode));        
        router.post("/shopcard/reversegeocode", Route.BindRequest(this.prototype.revgeocode));        
        router.post("/shopcard/add", Route.BindRequest(this.prototype.addRoute));
        router.post("/shopcard/update", Route.BindRequest(this.prototype.updateRoute));
        router.post("/shopcard/remove", Route.BindRequest(this.prototype.removeRoute));

    }
}


