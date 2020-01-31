import * as express from "express";
import { ViewRouter } from '../../lib/router';
import moment = require('moment');
import { CacheManager } from "../../lib/cache";
import Butcher from "../../db/models/butcher";
import { Auth } from "../../lib/common";
import ButcherProduct from "../../db/models/butcherproduct";
import Product from "../../db/models/product";
import Area from "../../db/models/area";

export class ButcherRouter extends ViewRouter {
    butcher: Butcher;
    adminButchers: Butcher[];

    async loadButcher(id: number) {
        let butcher = await Butcher.findOne({
            include: [{
                model: ButcherProduct,
                include: [Product],
                                    
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
}

export default class Route extends ButcherRouter {

    async viewRoute() {
        await this.setButcher();   
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
        this.res.redirect("/pages/butcher");
    }

    static SetRoutes(router: express.Router) {
        router.get("/", Route.BindRequest(this.prototype.viewRoute));        
        router.post("/setbutcher", Route.BindRequest(this.prototype.setButcherRoute));        
    }
}

