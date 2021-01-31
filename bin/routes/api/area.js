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
const common_1 = require("../../lib/common");
const router_1 = require("../../lib/router");
const helper_1 = require("../../lib/helper");
const area_1 = require("../../db/models/area");
const Jimp = require('jimp');
const butcherarea_1 = require("../../db/models/butcherarea");
const google_1 = require("../../lib/google");
const email_1 = require("../../lib/email");
class Route extends router_1.ApiRouter {
    ensureDistances(butchers, area) {
        return __awaiter(this, void 0, void 0, function* () {
            yield area.ensureLocation();
            let list = yield butcherarea_1.default.findAll({
                where: {
                    areaid: area.id,
                    butcherid: butchers.map(p => p.id)
                }
            });
            if (list.length == butchers.length)
                return list;
            for (let i = 0; i < butchers.length; i++) {
                let found = list.find(o => o.butcherid == butchers[i].id);
                if (!found) {
                    try {
                        list.push(yield this.create(butchers[i], area));
                    }
                    catch (err) {
                        email_1.default.send('tansut@gmail.com', 'hata/ensureDistances', "error.ejs", {
                            text: err.message + butchers[i].name + ' ' + area.slug,
                            stack: err.stack
                        });
                    }
                }
            }
            return list;
        });
    }
    create(butcher, area) {
        return __awaiter(this, void 0, void 0, function* () {
            let itemToAdd = new butcherarea_1.default();
            itemToAdd.butcherid = butcher.id;
            itemToAdd.areaid = area.id;
            itemToAdd.kmDirect = helper_1.default.distance(butcher.location, area.location);
            let googleResult = yield google_1.Google.distanceMatrix(butcher.location, area.location);
            itemToAdd.googleData = JSON.stringify(googleResult || {});
            let result = yield google_1.Google.distanceInKM(googleResult);
            itemToAdd.kmGoogle = result.val / 1000;
            itemToAdd.kmActive = itemToAdd.kmGoogle || (itemToAdd.kmDirect * 1.5);
            itemToAdd.name = butcher.name + '/' + area.slug;
            return yield itemToAdd.save();
        });
    }
    ensureDistance(butcher, area) {
        return __awaiter(this, void 0, void 0, function* () {
            let existing = yield butcherarea_1.default.findOne({
                where: {
                    areaid: area.id,
                    butcherid: butcher.id
                }
            });
            if (!existing) {
                try {
                    existing = yield this.create(butcher, area);
                }
                catch (err) {
                    email_1.default.send('tansut@gmail.com', 'hata/ensureDistance', "error.ejs", {
                        text: err.message,
                        stack: err.stack
                    });
                    return null;
                    // return {
                    //     val: Helper.distance(butcher.location, area.location) * 1.5,
                    //     max: Helper.distance(butcher.location, area.location) * 2,
                    //     min: Helper.distance(butcher.location, area.location),
                    // }               
                }
            }
            return existing;
        });
    }
    getAreas() {
        let promise;
        if (this.req.query.parentLevel) {
            promise = area_1.default.findAll({
                where: {
                    parentid: parseInt(this.req.params.parentid),
                    level: parseInt(this.req.query.parentLevel) + 1,
                },
                order: [["displayOrder", "DESC"], ["Name", "ASC"]]
            }).then((parentSubs => {
                let ids = parentSubs.map(i => i.id);
                return {
                    parentid: ids
                };
            }));
        }
        else {
            let where = {};
            this.req.query.level ? (where["level"] = parseInt(this.req.query.level)) : where["level"] = 1;
            this.req.params.parentid ? (where["parentid"] = this.req.params.parentid) : null;
            if (where["level"] == 1) {
                //where["status"] = "active"
            }
            //where['status'] = 'generic';
            promise = Promise.resolve(where);
        }
        return promise.then(where => {
            return area_1.default.findAll({
                where: where,
                order: [["displayOrder", "DESC"], ["Name", "ASC"]]
            }).then(areas => areas.map(area => {
                if (where["level"] == 1) {
                }
                return {
                    id: area.id,
                    name: area.name,
                    slug: area.slug
                };
            })).then(data => this.res.send(data));
        });
    }
    static SetRoutes(router) {
        router.get("/area/children/:parentid?", Route.BindRequest(this.prototype.getAreas));
    }
}
__decorate([
    common_1.Auth.Anonymous(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], Route.prototype, "getAreas", null);
exports.default = Route;
