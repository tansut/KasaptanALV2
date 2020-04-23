import * as express from "express";
import { ViewRouter, ApiRouter } from '../../lib/router';
import moment = require('moment');
import { CacheManager } from "../../lib/cache";
import Butcher from "../../db/models/butcher";
import { Auth } from "../../lib/common";
import ButcherProduct from "../../db/models/butcherproduct";
import Product from "../../db/models/product";
import Area from "../../db/models/area";
import Helper from "../../lib/helper";
import OrderApi from "./../api/order"
import { Order } from "../../db/models/order";
import { OrderItemStatus } from "../../models/order";
import { Sms } from "../../lib/sms";
import SiteLogRoute from "./sitelog";
import User from "../../db/models/user";
import UserRoute from "./user";



export default class Route extends ApiRouter {

    butcher: Butcher;
    adminButchers: Butcher[];
    api: OrderApi;

    async loadButcher(id: number) {
        let butcher = await Butcher.findOne({
            include: [{
                model: ButcherProduct,
                include: [Product],
                order: [['id', "DESC"]]
                                    
            },
            {
                model: Area,
                all: true,
                as: "areaLevel1Id"

            }], where: { id: id
            
            
            }
        });
        return butcher;
    }

    async setButcher() {
        if (this.req.session.__butcherid) {
            this.butcher = await this.loadButcher(this.req.session.__butcherid)
        } else if (this.req.user.butcherid) {
            this.butcher = await this.loadButcher(this.req.user.butcherid)
        }
    }


    async sendPayment() {
        await this.setButcher();
        this.req.body.phone = this.req.body.phone || "";
        this.req.body.name = this.req.body.name || ""
        let phone = this.req.body.phone.trim();
        let name = this.req.body.name.trim();
        let tutar = Helper.parseFloat(this.req.body.pay);

        let user = await User.retrieveByEMailOrPhone(phone)
        if (!user) {
            user = await new UserRoute(this.constructorParams).createAsButcherCustomer({
                phone: phone,
                name: name
            }, this.butcher.id)
        }

        this.api = new OrderApi(this.constructorParams);

        let o = new Order();
        o.total = tutar;
        o.subTotal = tutar;
        o.phone = user.mphone;
        o.name = name;
        o.note = this.req.body.desc;
        o.paymentType = "onlinepayment"
        o.paymentTypeText = "Online Ödeme";
        o.status = OrderItemStatus.shipping;
        o.userId = user.id;
        o.discountTotal = 0;
        o.shippingTotal = 0;
        o.butcherid = this.butcher.id;
        o.butcherName = this.butcher.name;
        o.dispatcherType = "butcher";
        o.dispatcherName = this.butcher.name;
        o.email = this.butcher.email || `${this.butcher.slug}@kasaptanal.com`
        o.address = "sipariş adresi";
        o.areaLevel1Id = this.butcher.areaLevel1Id;
        o.areaLevel1Text = this.butcher.areaLevel1.name;
        await this.api.createAsButcherOrder(o);
        let payUrl = `${this.url}/pay/${o.ordernum}`;
        let text = `${this.butcher.name} ${ Helper.formattedCurrency(tutar)} siparişiniz güvenli ödeme yapmak için lütfen ${payUrl} adresini ziyaret edin. ${this.req.body.desc}`
        let log = new SiteLogRoute(this.constructorParams)
        await Sms.send('90' + o.phone, text, true, log);
        this.res.send({
            text: text,
            url: payUrl
        })        
    }

    async getPaymentSmsTextRoute() {
        await this.setButcher();
        let tutar = Helper.parseFloat(this.req.body.pay);
        let text = `${this.butcher.name} ${ Helper.formattedCurrency(tutar)} siparişiniz güvenli ödeme yapmak için lütfen adresini ziyaret edin. ${this.req.body.desc}`
        this.res.send({text:text})
    }



    static SetRoutes(router: express.Router) {
        router.post("/payment/send", Route.BindRequest(this.prototype.sendPayment));        
        router.post("/payment/getsms", Route.BindRequest(this.prototype.getPaymentSmsTextRoute));        
    }
}