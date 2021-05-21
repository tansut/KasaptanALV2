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
const product_1 = require("../../db/models/product");
const butcher_1 = require("../../db/models/butcher");
const dispatcher_1 = require("../../db/models/dispatcher");
const butcherproduct_1 = require("../../db/models/butcherproduct");
const sequelize_1 = require("sequelize");
const helper_1 = require("../../lib/helper");
const area_1 = require("./area");
const _ = require("lodash");
class Route extends router_1.ApiRouter {
    _where(where, address) {
        return __awaiter(this, void 0, void 0, function* () {
            where['enabled'] = true;
            where[sequelize_1.Op.or] = where[sequelize_1.Op.or] || [];
            where[sequelize_1.Op.or].push({
                toarealevel: [0]
            });
            if (address && address.level1Id) {
                where[sequelize_1.Op.or].push({
                    toareaid: [address.level1Id]
                });
            }
            if (address && address.level2Id) {
                where[sequelize_1.Op.or].push({
                    toareaid: [address.level2Id]
                });
            }
            if (address && address.level3Id) {
                where[sequelize_1.Op.or].push({
                    toareaid: address.level3Id
                });
            }
            if (address && address.level4Id) {
                where[sequelize_1.Op.or].push({
                    toareaid: address.level4Id
                });
            }
            return where;
        });
    }
    getDispatchers(q) {
        return __awaiter(this, void 0, void 0, function* () {
            let where = {
                enabled: true
            };
            let include = [
                {
                    model: butcher_1.default,
                    as: 'butcher'
                }
            ];
            where = yield this._where(where, q.adr);
            if (q.excludeCitywide) {
                where['toareaid'] = {
                    [sequelize_1.Op.ne]: null
                };
            }
            if (q.product) {
                include[0]['include'] = [{
                        model: butcherproduct_1.default
                    }];
                where[`$butcher.shipday${helper_1.default.Now().getDay()}$`] = true;
                where['$butcher.status$'] = "open";
                where['$butcher.approved$'] = true;
                where['$butcher.products.productid$'] = q.product.id;
                where['$butcher.products.enabled$'] = true;
                let w = [
                    {
                        [sequelize_1.Op.or]: [
                            {
                                '$butcher.products.kgPrice$': {
                                    [sequelize_1.Op.gt]: 0.0
                                }
                            }
                        ]
                    },
                    {
                        [sequelize_1.Op.or]: [
                            {
                                '$butcher.products.unit1price$': {
                                    [sequelize_1.Op.gt]: 0.0
                                }
                            }
                        ]
                    },
                    {
                        [sequelize_1.Op.or]: [
                            {
                                '$butcher.products.unit2price$': {
                                    [sequelize_1.Op.gt]: 0.0
                                }
                            }
                        ]
                    },
                    {
                        [sequelize_1.Op.or]: [
                            {
                                '$butcher.products.unit3price$': {
                                    [sequelize_1.Op.gt]: 0.0
                                }
                            }
                        ]
                    }
                ];
                // if (productdispatch == ProductDispatch.countrywide) {
                //     where[Op.or].push({
                //         toarealevel: [0]
                //     })
                // }
                where[sequelize_1.Op.and] = {
                    [sequelize_1.Op.or]: w
                };
            }
            if (q.butcher) {
                let butcher = typeof (q.butcher) == 'number' ? yield butcher_1.default.findByPk(q.butcher) : q.butcher;
                where['butcherid'] = butcher.id;
            }
            let res = yield dispatcher_1.default.findAll({
                where: where,
                include: include,
                order: [["toarealevel", "DESC"]],
            });
            let ugly = {}, result = [];
            let areaApi = new area_1.default(this.constructorParams);
            let butcherAreaData = yield areaApi.ensureDistances(res.map(s => s.butcher), q.adr.based);
            for (let i = 0; i < res.length; i++) {
                if (q.product && res[i].toarealevel == 0 && q.product.dispatch != product_1.ProductDispatch.countrywide)
                    continue;
                let areaData = butcherAreaData.find(ad => ad.butcherid == res[i].butcherid);
                let provider = res[i].setProvider(q.useLevel1, q.adr.based, q.orderType, areaData.bestKm);
                if (provider && !ugly[res[i].butcherid]) {
                    res[i].butcherArea = areaData;
                    ugly[res[i].butcherid] = res[i];
                    result.push(res[i]);
                }
            }
            result = _.sortBy(result, ["butcherArea.kmActive"]);
            return result;
        });
    }
    getButchersDispatchesForAll(areaids) {
        return __awaiter(this, void 0, void 0, function* () {
            let where = {
                type: 'butcher'
            };
            where["toareaid"] = areaids;
            let res = yield dispatcher_1.default.findAll({
                where: where,
                include: [
                    {
                        model: butcher_1.default,
                        as: 'butcher'
                    },
                ],
                order: [["toarealevel", "DESC"]]
            });
            return res;
        });
    }
    getButchersDispatches(address) {
        return __awaiter(this, void 0, void 0, function* () {
            let d = yield this.getDispatchers({
                adr: address
            });
            return d;
        });
    }
    dispatchingAvailable(address, useLevel1) {
        return __awaiter(this, void 0, void 0, function* () {
            let where = {
                type: 'butcher'
            };
            where = yield this._where(where, address);
            // if (!useLevel1) {
            //     where[Op.and] = where[Op.and] || []
            //     where[Op.and].push({
            //         toarealevel: {
            //             [Op.ne]: 1
            //         }
            //     })
            // }        
            let res = yield dispatcher_1.default.findOne({
                where: where,
                include: [
                    {
                        model: butcher_1.default,
                        as: 'butcher'
                    }
                ],
            });
            if (res && res.toarealevel == 1) {
                if (!useLevel1) {
                    let forceL1 = res.butcher.dispatchArea == "citywide" || res.butcher.dispatchArea == "radius";
                    res = forceL1 ? res : null;
                }
            }
            return res != null;
        });
    }
    static SetRoutes(router) {
    }
}
exports.default = Route;
