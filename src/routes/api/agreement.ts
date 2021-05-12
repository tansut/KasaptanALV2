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
import OrderApi from "./order"
import { Order } from "../../db/models/order";
import { OrderItemStatus } from "../../models/order";
import { Sms } from "../../lib/sms";
import SiteLogRoute from "./sitelog";
import User from "../../db/models/user";
import UserRoute from "./user";
import * as ejs from 'ejs';
import config from '../../config';
import * as path from 'path';
import { auth } from "../../middleware/auth";


export default class Route extends ApiRouter {

    async getFile(template: string, data: any) {
        return new Promise<string>((resolve, reject) => {
            ejs.renderFile(path.join(config.projectDir, 'src/views/legal/' + template), data, {
            }, (err, res) => {
                err ? reject(err): resolve(res)
            });
        })
    }

    async butchersales() {
        if (!this.req.query.butcherid) return this.next();
        let butcher = await Butcher.findByPk(parseInt(<string>this.req.query.butcherid), {
            include: [{
                model: Area,
                all: true,
                as: "areaLevel1Id"
            }]
        });
        if (!butcher) return this.next();
        let file = await this.getFile("seller.sales-agreement.ejs", {
            butcher: butcher
        } )
        let content =  this.Markdown.render(file);
        this.res.send({
            title: 'Satış Sözleşmesi',
            content: content
        })
    }

    async butcherkvkk() {
        if (!this.req.query.butcherid) return this.next();
        let butcher = await Butcher.findByPk(parseInt(<string>this.req.query.butcherid), {
            include: [{
                model: Area,
                all: true,
                as: "areaLevel1Id"
            }]
        });
        if (!butcher) return this.next();
        let file = await this.getFile("seller.kvkkaydinlatma.ejs", {
            butcher: butcher
        } )
        let content =  this.Markdown.render(file);
        this.res.send({
            title: 'KVKK Aydınlatma Metni',
            content: content
        })
    }    

    async butcherriza() {
        if (!this.req.query.butcherid) return this.next();
        let butcher = await Butcher.findByPk(parseInt(<string>this.req.query.butcherid), {
            include: [{
                model: Area,
                all: true,
                as: "areaLevel1Id"
            }]
        });
        if (!butcher) return this.next();
        let file = await this.getFile("seller.rizametni.ejs", {
            butcher: butcher
        } )
        let content =  this.Markdown.render(file);
        this.res.send({
            title: 'KVKK Açık Rıza Metni',
            content: content
        })
    }    

    @Auth.Anonymous()
    async customerMss() {
        if (!this.req.query.butcherid) return this.next();
        let butcher = await Butcher.findByPk(parseInt(<string>this.req.query.butcherid), {
            include: [{
                model: Area,
                all: true,
                as: "areaLevel1Id"
            }]
        });
        if (!butcher) return this.next();
        let file = await this.getFile("customer.butcher-seller-agreement.ejs", {
            butcher: butcher,
            user: this.req.shopCard
        } )
        let content =  this.Markdown.render(file);
        this.res.send({
            title: 'Mesafeli Satış Sözleşmesi',
            content: content
        })
    }  

    @Auth.Anonymous()
    async customerObf() {
        if (!this.req.query.butcherid) return this.next();
        let butcher = await Butcher.findByPk(parseInt(<string>this.req.query.butcherid), {
            include: [{
                model: Area,
                all: true,
                as: "areaLevel1Id"
            }]
        });
        if (!butcher) return this.next();
        let file = await this.getFile("customer.butcher-obf.ejs", {
            butcher: butcher,
            user: this.req.shopCard
        } )
        let content =  this.Markdown.render(file);
        this.res.send({
            title: 'Ön Bilgilendirme Formu',
            content: content
        })
    }  

    @Auth.Anonymous()
    async customerAym() {
        let file = await this.getFile("customer.aydinlatma.ejs", {
      
        } )
        let content =  this.Markdown.render(file);
        this.res.send({
            title: 'Aydınlatma Metni',
            content: content
        })
    }  


    @Auth.Anonymous()
    async customerKvkk() {
        let file = await this.getFile("customer.kvkk.ejs", {
      
        } )
        let content =  this.Markdown.render(file);
        this.res.send({
            title: 'KVKK Metni',
            content: content
        })
    }  
 

    static SetRoutes(router: express.Router) {
        router.get("/agreement/content/butchersales", Route.BindRequest(this.prototype.butchersales));        
        router.get("/agreement/content/butcherkvkk", Route.BindRequest(this.prototype.butcherkvkk));        
        router.get("/agreement/content/butcherriza", Route.BindRequest(this.prototype.butcherriza));     
        router.get("/agreement/content/customerobf", Route.BindRequest(this.prototype.customerObf));
        router.get("/agreement/content/customermss", Route.BindRequest(this.prototype.customerMss));
        router.get("/agreement/content/customeraym", Route.BindRequest(this.prototype.customerAym));
        router.get("/agreement/content/customerkvkk", Route.BindRequest(this.prototype.customerKvkk));

    }
}