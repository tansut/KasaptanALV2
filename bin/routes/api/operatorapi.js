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
const moment = require("moment");
const helper_1 = require("../../lib/helper");
const sequelize_1 = require("sequelize");
const review_1 = require("../../db/models/review");
const sitelog_1 = require("../../db/models/sitelog");
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
    listButcherApplicationsRoute() {
        return __awaiter(this, void 0, void 0, function* () {
            //if (!this.req.user.hasRole('admin')) return this.next();
            let sdate = helper_1.default.newDate2(2000, 1, 1);
            let fdate = moment().endOf("month").toDate();
            let q = this.req.query.q || '3days';
            if (q == '3days') {
                sdate = moment().startOf('day').subtract(3, "days").toDate();
            }
            else if (q == '7days') {
                sdate = moment().startOf('day').subtract(7, "days").toDate();
            }
            else if (q == 'thismonth') {
                sdate = moment().startOf("month").toDate();
                fdate = moment().endOf("month").toDate();
            }
            else if (q == 'all') {
                sdate = moment().startOf('day').subtract(10, "month").toDate();
            }
            else {
                sdate = moment().subtract(1, "month").startOf("month").toDate();
                fdate = moment(sdate).endOf("month").toDate();
            }
            let where = {
                logtype: 'BAS',
                creationDate: {
                    [sequelize_1.Op.and]: [
                        {
                            [sequelize_1.Op.gte]: sdate
                        },
                        {
                            [sequelize_1.Op.lte]: fdate
                        }
                    ]
                }
            };
            let orders = yield sitelog_1.default.findAll({
                where: where,
                order: [['id', 'desc']]
            });
            let result = orders.map(o => {
                let data = JSON.parse(o.logData);
                return {
                    date: o.creationDate,
                    name: data.name,
                    tel: data.tel,
                    city: data.city,
                    butcherAddress: data.butcherAddress,
                    butcher: data.butcher
                };
            });
            this.res.send(result);
        });
    }
    static SetRoutes(router) {
        router.post("/reviews/list", Route.BindRequest(this.prototype.listReviews));
        router.post("/reviews/save", Route.BindRequest(this.prototype.saveReview));
        router.get("/butcherapplications/list", Route.BindRequest(this.prototype.listButcherApplicationsRoute));
    }
}
exports.default = Route;
