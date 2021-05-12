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
const router_1 = require("../../lib/router");
const helper_1 = require("../../lib/helper");
const review_1 = require("../../db/models/review");
class Route extends router_1.ApiRouter {
    listReviews() {
        return __awaiter(this, void 0, void 0, function* () {
            let result = yield review_1.default.findAll({
                where: {
                    published: false
                }
            });
            this.res.send(result);
        });
    }
    saveReview() {
        return __awaiter(this, void 0, void 0, function* () {
            let r = yield review_1.default.findByPk(parseInt(this.req.body.id));
            r.published = true;
            r.userRating1 = helper_1.default.parseFloat(this.req.body.star);
            r.content = this.req.body.content;
            yield r.save();
            this.res.send(r);
        });
    }
    static SetRoutes(router) {
        router.post("/reviews/list", Route.BindRequest(this.prototype.listReviews));
        router.post("/reviews/save", Route.BindRequest(this.prototype.saveReview));
    }
}
exports.default = Route;
