"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const router_1 = require("../lib/router");
const butcher_1 = require("../db/models/butcher");
const common_1 = require("../lib/common");
const area_1 = require("../db/models/area");
const area_2 = require("../db/models/area");
const _ = require("lodash");
const sq = require("sequelize");
const dispatcher_1 = require("./api/dispatcher");
let ellipsis = require('text-ellipsis');
class Route extends router_1.ViewRouter {
    checkSave(area) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.req.query.save) {
                yield this.req.helper.setPreferredAddressByArea(area, true);
            }
        });
    }
    renderPage(area, butchers, subs) {
        return __awaiter(this, void 0, void 0, function* () {
            {
                this.res.render('pages/areal1.ejs', this.viewData({
                    subs: subs, ellipsis: ellipsis,
                    pageDescription: `${this.address.display} Kasaplar, KasaptanAl.com güvenli kasap kriterlerini karşılayan güvenilir kasap iş ortaklarımızdır. ${this.address.display} bölgesinden güvenle et siparişi verebilirsiniz.`,
                    pageTitle: `${this.address.display} Kasaplar | Online Kasap Alışverişi & Et Siparişi`, area: area, butchers: butchers
                }));
            }
        });
    }
    arealRouteOld() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.req.params.area) {
                return this.next();
            }
            let areaSlug = this.req.params.area;
            let area = yield area_1.default.findOne({
                where: { slug: areaSlug }, include: [{
                        all: true
                    }]
            });
            if (!area)
                return this.next();
            this.res.redirect('/' + areaSlug + '-kasap', 301);
        });
    }
    arealRoute(back = false) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.req.params.area) {
                return this.next();
            }
            let areas = this.req.params.area.split("-");
            let areaSlug = this.req.params.area;
            let area = yield area_1.default.findOne({
                where: { slug: areaSlug }, include: [{
                        all: true
                    }]
            });
            if (!area)
                return this.next();
            yield this.checkSave(area);
            this.address = yield area.getPreferredAddress();
            let butchers = [];
            let subs = [];
            if (area.level == 1) {
                let field = `areaLevel1Id`;
                let where = {};
                where[field] = area.id;
                where["approved"] = true;
                butchers = yield butcher_1.default.findAll({
                    where: where,
                    order: [["displayOrder", "DESC"]],
                });
                subs = yield area_1.default.sequelize.query(`select * from Areas ap where ap.level=2 and ap.parentid=:id and ( ap.id in 
                (
                SELECT distinct a.parentid FROM  Areas a where 
                (a.id in (SELECT distinct d.toareaid FROM Dispatchers d where d.toarealevel=3))
                ) or 
                (ap.id in (SELECT distinct d.toareaid FROM Dispatchers d where d.toarealevel=2))
                )`, {
                    replacements: { id: area.id },
                    type: sq.QueryTypes.SELECT,
                    mapToModel: true,
                });
            }
            else if (area.level == 2) {
                let dp = new dispatcher_1.default(this.constructorParams);
                let dispatchers = yield dp.getButchersDispatches(this.address);
                butchers = dispatchers.map(b => b.butcher);
                let children = yield area_2.default.findAll({
                    attributes: ['id'],
                    where: {
                        parentid: area.id
                    }
                }).map(a => a.id);
                dispatchers = yield dp.getButchersDispatchesForAll(children);
                butchers = butchers.concat(dispatchers.map(b => b.butcher));
                butchers = _.uniqBy(butchers, 'id');
            }
            else {
                let dp = new dispatcher_1.default(this.constructorParams);
                let dispatchers = yield dp.getButchersDispatches(this.address);
                butchers = dispatchers.map(b => b.butcher);
            }
            // if (butchers.length == 0 && area.level == 3) {
            //     let parent = area.parent;
            //     let address = await parent.getPreferredAddress();
            //     dispatchers = await dp.getButchersDispatches(address);
            //     butchers = dispatchers.map(b => b.butcher);
            //     butchers = _.uniqBy(butchers, 'id');
            // } else if (butchers.length == 0 && area.level == 2) {
            //     let children = await Area.findAll({
            //         attributes: ['id'],
            //         where: {
            //             parentid: area.id
            //         }
            //     }).map(a => a.id)
            //     dispatchers = await dp.getButchersDispatchesForAll(children);
            //     butchers = dispatchers.map(b => b.butcher);
            //     butchers = _.uniqBy(butchers, 'id');
            // }
            if (area.level == 2) {
                subs = yield area_1.default.sequelize.query(`
            SELECT a.* FROM  Areas a where a.parentid=:id and a.status = 'active'`, {
                    replacements: { id: area.id },
                    type: sq.QueryTypes.SELECT,
                    mapToModel: true,
                });
            }
            if (this.req.query.save && butchers.length == 0) {
                this.res.redirect('/kasap-urunleri');
                return;
            }
            yield this.renderPage(area, butchers, subs);
        });
    }
    allRoute() {
        return __awaiter(this, void 0, void 0, function* () {
            let where = {};
            let subs = [];
            where["approved"] = true;
            where["showListing"] = true;
            if (this.req.query.g) {
                where["parentButcher"] = this.req.query.g;
            }
            else {
                subs = yield area_1.default.findAll({
                    where: {
                        level: 1,
                        status: "active"
                    },
                    order: [['displayOrder', 'desc']]
                });
            }
            let butchers = yield butcher_1.default.findAll({
                where: where,
                limit: 100,
                order: [["displayOrder", "DESC"]],
                include: [{
                        model: area_2.default,
                        as: "areaLevel1"
                    }]
            });
            this.res.render('pages/butchers.ejs', this.viewData({
                subs: subs, ellipsis: ellipsis,
                pageDescription: `Kasaplar, kasaptanAl.com güvenilir kasap kriterlerini karşılayan konusunda usta kasap iş ortaklarımızdır. Güvenle online et siparişi verebilirsiniz.`,
                pageTitle: 'Kasaplar',
                butchers: butchers
            }));
        });
    }
    static SetRoutes(router) {
        // router.get("/:areal1-:areal2-:area3", Route.BindRequest(Route.prototype.areal3Route));
        // router.get("/:areal1-:areal2", Route.BindRequest(Route.prototype.areal2Route));
        router.get("/:area-kasap", Route.BindRequest(Route.prototype.arealRoute));
        router.get("/:area", Route.BindRequest(Route.prototype.arealRouteOld));
        router.get("/kasaplar", Route.BindRequest(Route.prototype.allRoute));
    }
}
__decorate([
    common_1.Auth.Anonymous(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], Route.prototype, "arealRouteOld", null);
__decorate([
    common_1.Auth.Anonymous(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Boolean]),
    __metadata("design:returntype", Promise)
], Route.prototype, "arealRoute", null);
__decorate([
    common_1.Auth.Anonymous(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], Route.prototype, "allRoute", null);
exports.default = Route;
