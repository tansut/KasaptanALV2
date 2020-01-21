import { ApiRouter, ViewRouter } from '../lib/router';
import * as express from "express";
import * as maps from "@google/maps"
import ButcherModel from '../db/models/butcher';
import moment = require('moment');
import { Auth } from '../lib/common';
import AreaModel from '../db/models/area';
import Helper from '../lib/helper';
import Area from '../db/models/area';
import { PreferredAddress } from '../db/models/user';
let ellipsis = require('text-ellipsis');


export default class Route extends ViewRouter {

    async checkSave(area: AreaModel) {
        if (this.req.query.save) {
            var adr: PreferredAddress = {
                level1Id:null,
                level2Id:null,
                level3Id:null
            };
            switch (area.level) {
                case 3: {
                    adr.level1Id = area.parent.parentid;
                    adr.level2Id = area.parentid;
                    adr.level3Id = area.id;
                    await this.req.helper.setPreferredAddress(adr, true);
                    break;
                }
            }
        
        }        
    }

    async renderPage(area: AreaModel, butchers: ButcherModel[], subs?: AreaModel[]) {
        

        this.res.render('pages/areal1.ejs', this.viewData({ subs: subs, ellipsis: ellipsis, pageTitle: `${area.name} kasapları`, area: area, butchers: butchers }))
    }

    @Auth.Anonymous()
    async arealRoute(back: boolean = false) {
        if (!this.req.params.area) {
            return this.next();
        }
        let areas = this.req.params.area.split("-");
        let areaSlug = this.req.params.area;
        if (back) {
            areas.splice(areas.length - 1, 1);
            areaSlug = areas.join("-");
            this.req.params.area = areaSlug;
        }
        let area = await AreaModel.findOne({ where: { slug: areaSlug }, include: [{
            all:true
        }] });
        if (!area) return this.next();

        await this.checkSave(area);

        let field = `areaLevel${areas.length}Id`;
        let where = (<any>{})
        where[field] = area.id;
        where["approved"] = true;

        let butchers = await ButcherModel.findAll({
            where: where,
            order: [["updatedon", "DESC"]],
            include: [{
                all: true
            }]
        })

        if (butchers.length == 0 && (area.level != 1)) {
            return this.arealRoute(true)
        } else
            if (area.level != 3) {
                return Area.findAll({
                    where: {
                        parentid: area.id
                    }
                }).then(subs => this.renderPage(area, butchers, subs))
            }
            else return this.renderPage(area, butchers)        
    }

    static SetRoutes(router: express.Router) {
        // router.get("/:areal1-:areal2-:area3", Route.BindRequest(Route.prototype.areal3Route));
        // router.get("/:areal1-:areal2", Route.BindRequest(Route.prototype.areal2Route));
        router.get("/:area-kasap", Route.BindRequest(Route.prototype.arealRoute));
    }
}