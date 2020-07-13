"use strict";
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
exports.ButcherRouter = void 0;
const router_1 = require("../../lib/router");
const butcher_1 = require("../../db/models/butcher");
const butcherproduct_1 = require("../../db/models/butcherproduct");
const product_1 = require("../../db/models/product");
const area_1 = require("../../db/models/area");
class ButcherRouter extends router_1.ViewRouter {
    loadButcher(id) {
        return __awaiter(this, void 0, void 0, function* () {
            let butcher = yield butcher_1.default.findOne({
                include: [{
                        model: butcherproduct_1.default,
                        include: [product_1.default],
                        order: [['id', "DESC"]]
                    },
                    {
                        model: area_1.default,
                        all: true,
                        as: "areaLevel1Id"
                    }], where: { id: id
                }
            });
            return butcher;
        });
    }
    setButcher() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.req.session.__butcherid) {
                this.butcher = yield this.loadButcher(this.req.session.__butcherid);
            }
            else if (this.req.user.butcherid) {
                this.butcher = yield this.loadButcher(this.req.user.butcherid);
            }
        });
    }
}
exports.ButcherRouter = ButcherRouter;
class Route extends ButcherRouter {
    viewRoute() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.setButcher();
            if (this.req.user.hasRole("admin")) {
                this.adminButchers = yield butcher_1.default.findAll({
                    where: {
                        approved: true
                    }
                });
            }
            this.res.render("pages/butcher.home.ejs", this.viewData({}));
        });
    }
    setButcherRoute() {
        return __awaiter(this, void 0, void 0, function* () {
            let id = parseInt(this.req.body.butcherid);
            this.req.session.__butcherid = id;
            this.res.redirect("/kasapsayfam");
        });
    }
    static SetRoutes(router) {
        router.get("/", Route.BindRequest(this.prototype.viewRoute));
        router.post("/setbutcher", Route.BindRequest(this.prototype.setButcherRoute));
    }
}
exports.default = Route;
