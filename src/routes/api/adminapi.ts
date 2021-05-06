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
import { Op, Sequelize } from "sequelize";



export default class Route extends ApiRouter {

    async listButcherProducts() {
        let where = {};
        if (this.req.body.butcher) {
            where["butcherid"] = this.req.body.butcher
        }
        if (this.req.body.hasButcherNote) {
            where["fromButcherDesc"] = {
                [Op.and]:  {
                    [Op.ne]: '',
                }
            }
        }

        if (this.req.body.managerApproved == "") {
            
        } else {
            where["managerApproved"] = this.req.body.managerApproved == "false" ? false: true
        }
        
        

        let result = await ButcherProduct.findAll(
            {
                where: where,
                limit: 500,
                order: [['updatedon', 'desc']],
                include: [
                    {
                        model: Product
                    },
                    {
                        model: Butcher
                    }
                ]
            }
        ).map(b=> {
            return {
                id: b.id,
                productId: b.productid,
                productName: b.product.name,
                toButcherNote: b.product.butcherNote,
                fromButcherNote: b.fromButcherDesc,
                customerNote: b.mddesc,
                customerLongNote: b.longdesc,
                butcherName: b.butcher.name,
                butcherSlug: b.butcher.slug,
                updatedOn: b.updatedOn
            }
        })

        this.res.send(result)

    }

    async saveButcherProducts() {
        let item = await ButcherProduct.findByPk(this.req.body.id);
        item.mddesc = this.req.body.customerNote;
        item.longdesc = this.req.body.customerLongNote;
        item.managerApproved = true;
        await item.save();
        this.res.sendStatus(200)
    }

    async listButchers() {
        let butchers = await Butcher.findAll(
            {
                where: {
                    approved:1
                },
                order: [['name', 'asc']],
                raw: true
            }
        )
        this.res.send(butchers);
    }

    static SetRoutes(router: express.Router) {
        router.post("/butcherproducts/list", Route.BindRequest(this.prototype.listButcherProducts));        
        router.post("/butcherproducts/save", Route.BindRequest(this.prototype.saveButcherProducts));        
        router.get("/butchers", Route.BindRequest(this.prototype.listButchers));        
    }
}