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
import Dispatcher from '../db/models/dispatcher';
import * as _ from "lodash";
import * as sq from 'sequelize';

import DispatcherApi from './api/dispatcher';

let ellipsis = require('text-ellipsis');


export default class Route extends ViewRouter {

    address: PreferredAddress;

    async checkSave(area: AreaModel) {
        if (this.req.query.save) {
            var adr: PreferredAddress = {
                level1Id: null,
                level2Id: null,
                level3Id: null
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

        this.res.render('pages/areal1.ejs', this.viewData({
            subs: subs, ellipsis: ellipsis,
            pageDescription: `${this.address.display} Kasaplar, KasaptanAl.com güvenli kasap kriterlerini karşılayan güvenilir kasap iş ortaklarımızdır. ${this.address.display} bölgesinden güvenle et siparişi verebilirsiniz.`,
            pageTitle: `${this.address.display} Kasaplar | Online Kasap Alışverişi & Et Siparişi`, area: area, butchers: butchers
        }))
    }

    @Auth.Anonymous()
    async arealRouteOld() {
        if (!this.req.params.area) {
            return this.next();
        }
        let areaSlug = this.req.params.area;
        let area = await AreaModel.findOne({
            where: { slug: areaSlug }, include: [{
                all: true
            }]
        });
        if (!area) return this.next();
        this.res.redirect('/' + areaSlug + '-kasap', 301);
    }

    @Auth.Anonymous()
    async arealRoute(back: boolean = false) {
        if (!this.req.params.area) {
            return this.next();
        }
        let areas = this.req.params.area.split("-");
        let areaSlug = this.req.params.area;

        let area = await AreaModel.findOne({
            where: { slug: areaSlug }, include: [{
                all: true
            }]
        });
        if (!area) return this.next();

        await this.checkSave(area);
        this.address = await area.getPreferredAddress();

        let butchers: ButcherModel[] = [];

        let subs: AreaModel[] = [];

        if (area.level == 1) {
            let field = `areaLevel1Id`;
            let where = (<any>{})
            where[field] = area.id;
            where["approved"] = true;

            butchers = await ButcherModel.findAll({
                where: where,
                order: [["updatedon", "DESC"]],
                include: [{
                    all: true
                }]
            })

            subs = await AreaModel.sequelize.query(`select * from Areas ap where ap.level=2 and ap.parentid=:id and ( ap.id in 
                (
                SELECT distinct a.parentid FROM  Areas a where 
                (a.id in (SELECT distinct d.toareaid FROM Dispatchers d where d.toarealevel=3))
                ) or 
                (ap.id in (SELECT distinct d.toareaid FROM Dispatchers d where d.toarealevel=2))
                )`,
                {
                replacements: { id: area.id },

                    type: sq.QueryTypes.SELECT,
                    mapToModel: true,
                })



        } else {
            let dp = new DispatcherApi(this.constructorParams);
            let dispatchers = await dp.getButchersDispatches(this.address);
            butchers = dispatchers.map(b => b.butcher);
            if (butchers.length == 0 && area.level == 3) {
                let parent = area.parent;
                let address = await parent.getPreferredAddress();
                dispatchers = await dp.getButchersDispatches(address);
                butchers = dispatchers.map(b => b.butcher);
                butchers = _.uniqBy(butchers, 'id');
            } else if (butchers.length == 0 && area.level == 2) {
                let children = await Area.findAll({
                    attributes: ['id'],
                    where: {
                        parentid: area.id
                    }
                }).map(a => a.id)
                dispatchers = await dp.getButchersDispatchesForAll(children);
                butchers = dispatchers.map(b => b.butcher);
                butchers = _.uniqBy(butchers, 'id');


            }


            if (area.level == 2) {
                subs = await AreaModel.sequelize.query(`
            SELECT a.* FROM  Areas a where a.parentid=:id and
(a.id in (SELECT distinct d.toareaid FROM Dispatchers d where d.toarealevel=3))
            `,
                    {
                replacements: { id: area.id },

                        type: sq.QueryTypes.SELECT,
                        mapToModel: true,
                    })
            }
        }

        if (this.req.query.save && butchers.length == 0) {
            this.res.redirect('/kasap-urunleri');
            return;
        }

        await this.renderPage(area, butchers, subs)
    }

    @Auth.Anonymous()
    async allRoute() {
        let where = (<any>{})
        where["approved"] = true;

        let butchers = await ButcherModel.findAll({
            where: where,
            limit: 25,
            order: [["updatedon", "DESC"]],
            include: [{
                all: true
            }]
        })

        let subs = await AreaModel.findAll({
            where: {
                level: 1,
                status: "active"
            },
            order: [['displayOrder', 'desc']]
        })

        this.res.render('pages/butchers.ejs', this.viewData({

            subs: subs, ellipsis: ellipsis,
            pageDescription: `Kasaplar, kasaptanAl.com güvenilir kasap kriterlerini karşılayan konusunda usta kasap iş ortaklarımızdır. Güvenle online et siparişi verebilirsiniz.`,
            pageTitle: 'Kasaplar',
            butchers: butchers
        }))
    }

    static SetRoutes(router: express.Router) {
        // router.get("/:areal1-:areal2-:area3", Route.BindRequest(Route.prototype.areal3Route));
        // router.get("/:areal1-:areal2", Route.BindRequest(Route.prototype.areal2Route));
        router.get("/:area-kasap", Route.BindRequest(Route.prototype.arealRoute));
        router.get("/:area", Route.BindRequest(Route.prototype.arealRouteOld));
        router.get("/kasaplar", Route.BindRequest(Route.prototype.allRoute));
    }
}