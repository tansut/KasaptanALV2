import * as express from "express";
import { AgreementAcceptStatus } from '../../models/common';
import { ViewRouter } from '../../lib/router';
import moment = require('moment');
import { CacheManager } from "../../lib/cache";
import Butcher from "../../db/models/butcher";
import { Auth } from "../../lib/common";
import ButcherProduct from "../../db/models/butcherproduct";
import Product from "../../db/models/product";
import Area from "../../db/models/area";
import AgreementLog from "../../db/models/agreement";

export class ButcherRouter extends ViewRouter {
    butcher: Butcher;
    adminButchers: Butcher[];

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

    get needsAgreementSign() {
        return this.butcher.agreementStatus ==  'waiting' ||
        this.butcher.agreementStatus == 'reaprovement'
    }

    async setButcher(checkOk: boolean = true) {

        if (this.req.session.__butcherid) {
            this.butcher = await this.loadButcher(this.req.session.__butcherid)
        } else if (this.req.user.butcherid) {
            this.butcher = await this.loadButcher(this.req.user.butcherid)
        }
        if (this.req.user.hasRole("butcher") && checkOk && this.needsAgreementSign) {
            this.res.redirect('/kasapsayfam');
           return false;
        }  
        return true;
    }
}

export default class Route extends ButcherRouter {



    

    async acceptAgreements() {
        await this.setButcher(false);   
        await AgreementLog.create({
            ip: this.userIp,
            type: 'butchersales',
            title: 'Kasap Satış Sözleşmesi',
            userid: this.req.user.id,
            name: this.req.user.name,
            sessionid: this.req.session.id
        });
        this.butcher.agreementStatus = 'approved';
        await this.butcher.save();
        this.res.redirect('/kasapsayfam?accepted=1')
    }

    async viewRoute() {

        
        await this.setButcher(false);   
        if (this.req.user.hasRole("admin")) {
            this.adminButchers = await Butcher.findAll({
                where: {
                    approved: true
                }
            })
        }     
        this.res.render("pages/butcher.home.ejs", this.viewData({

        }))
    }


    async setButcherRoute() {
        let id = parseInt(this.req.body.butcherid);
        this.req.session.__butcherid = id;
        this.res.redirect("/kasapsayfam");
    }

    static SetRoutes(router: express.Router) {
        router.get("/", Route.BindRequest(this.prototype.viewRoute));        
        router.post("/acceptAgreement", Route.BindRequest(this.prototype.acceptAgreements));        
        router.post("/setbutcher", Route.BindRequest(this.prototype.setButcherRoute));        
    }
}

