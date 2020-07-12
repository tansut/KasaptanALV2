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
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("../../lib/common");
const router_1 = require("../../lib/router");
const area_1 = require("../../db/models/area");
const Jimp = require('jimp');
class Route extends router_1.ApiRouter {
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
                where["status"] = "active";
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

//# sourceMappingURL=area.js.map
