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
const email_1 = require("../../lib/email");
const butcher_1 = require("../../db/models/butcher");
const area_1 = require("../../db/models/area");
const dispatcher_1 = require("../../db/models/dispatcher");
const butcherproduct_1 = require("../../db/models/butcherproduct");
const sequelize_1 = require("sequelize");
const core_1 = require("../../lib/logistic/core");
const helper_1 = require("../../lib/helper");
class Route extends router_1.ApiRouter {
    _where(where, address) {
        return __awaiter(this, void 0, void 0, function* () {
            where['enabled'] = true;
            where[sequelize_1.Op.or] = where[sequelize_1.Op.or] || [];
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
            return where;
        });
    }
    getDispatcher(butcher, address) {
        return __awaiter(this, void 0, void 0, function* () {
            if (butcher.defaultDispatcher == "butcher") {
                return core_1.LogisticFactory.getInstance("butcher");
            }
            else if (butcher.defaultDispatcher == "butcher/auto")
                return core_1.LogisticFactory.getInstance("butcher/auto");
            else {
                return core_1.LogisticFactory.getInstance(butcher.defaultDispatcher);
            }
        });
    }
    bestDispatcher2(butcher, address, basedOn) {
        return __awaiter(this, void 0, void 0, function* () {
            butcher = typeof (butcher) == 'string' ? yield butcher_1.default.findByPk(butcher) : butcher;
            let where = {
                type: 'butcher',
                butcherid: butcher.id,
                [sequelize_1.Op.or]: []
            };
            where = yield this._where(where, address);
            let res = yield dispatcher_1.default.findOne({
                where: where,
                include: [
                    {
                        model: butcher_1.default,
                        as: 'butcher'
                    },
                ],
                order: [["toarealevel", "DESC"]],
            });
            let provider = null;
            if (res) {
                let usage = res.logisticProviderUsage == "default" ? butcher.logisticProviderUsage : res.logisticProviderUsage;
                if (usage != "none" && butcher.logisticProviderUsage != "disabled" && butcher.logisticProvider) {
                    provider = core_1.LogisticFactory.getInstance(butcher.logisticProvider, {
                        dispatcher: res
                    });
                }
                else {
                    provider = core_1.LogisticFactory.getInstance(butcher.defaultDispatcher, {
                        dispatcher: res
                    });
                }
            }
            return provider;
        });
    }
    bestDispatcher(butcherId, address, basedOn) {
        return __awaiter(this, void 0, void 0, function* () {
            let where = {
                type: 'butcher',
                butcherid: butcherId,
                [sequelize_1.Op.or]: []
            };
            where = yield this._where(where, address);
            let res = yield dispatcher_1.default.findOne({
                where: where,
                include: [
                    {
                        model: butcher_1.default,
                        as: 'butcher'
                    },
                ],
                order: [["toarealevel", "DESC"]],
            });
            if (res && res.logisticProviderUsage != "none" && basedOn && basedOn.orderType != "kurban") {
                let butcher = yield butcher_1.default.findByPk(butcherId);
                let usage = res.logisticProviderUsage == "default" ? butcher.logisticProviderUsage : res.logisticProviderUsage;
                if (usage != "none" && butcher.logisticProviderUsage != "disabled" && butcher.logisticProvider) {
                    let provider = core_1.LogisticFactory.getInstance(butcher.logisticProvider);
                    res.name = provider.providerKey;
                    res.min = 0.00;
                    res.totalForFree = 0.00;
                    res.type = "kasaptanal/motokurye";
                    res.name = dispatcher_1.DispatcherTypeDesc[res.type];
                    res.fee = 0.00;
                    res.feeOffer = 0.00;
                    if (basedOn && basedOn.shipLocation) {
                        try {
                            let request = provider.offerFromOrder(basedOn);
                            let offer = yield provider.requestOffer(request);
                            res.feeOffer = offer.totalFee;
                            res.fee = offer.totalFee;
                        }
                        catch (err) {
                            email_1.default.send('tansut@gmail.com', 'hata: get offer from dispatcher', "error.ejs", {
                                text: err + '/' + err.message,
                                stack: err.stack
                            });
                        }
                    }
                }
            }
            return res;
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
            let where = {
                type: 'butcher'
            };
            where = yield this._where(where, address);
            where["toarealevel"] = address.level3Id ? 3 : (address.level2Id ? 2 : 1);
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
    getButchersSelingAndDispatches(address, product, useLevel1) {
        return __awaiter(this, void 0, void 0, function* () {
            let where = {
                type: 'butcher'
            };
            where = yield this._where(where, address);
            where['$butcher.products.productid$'] = product.id;
            where['$butcher.products.enabled$'] = true;
            let w = [{
                    '$butcher.products.kgPrice$': {
                        [sequelize_1.Op.gt]: 0.0
                    }
                },
                {
                    [sequelize_1.Op.and]: [
                        {
                            '$butcher.products.unit1price$': {
                                [sequelize_1.Op.gt]: 0.0
                            }
                        },
                        {
                            '$butcher.products.unit1enabled$': true
                        }
                    ]
                },
                {
                    [sequelize_1.Op.and]: [
                        {
                            '$butcher.products.unit2price$': {
                                [sequelize_1.Op.gt]: 0.0
                            }
                        },
                        {
                            '$butcher.products.unit2enabled$': true
                        }
                    ]
                },
                {
                    [sequelize_1.Op.and]: [
                        {
                            '$butcher.products.unit3price$': {
                                [sequelize_1.Op.gt]: 0.0
                            }
                        },
                        {
                            '$butcher.products.unit3enabled$': true
                        }
                    ]
                }
            ];
            where[sequelize_1.Op.or].push(w);
            // if (!useLevel1) {
            //     where[Op.and] = where[Op.and] || []
            //     where[Op.and].push({
            //         toarealevel: {
            //             [Op.ne]: 1
            //         }
            //     })
            // }
            let res = yield dispatcher_1.default.findAll({
                where: where,
                include: [
                    {
                        model: butcher_1.default,
                        as: 'butcher',
                        include: [{
                                model: butcherproduct_1.default
                            }
                        ]
                    },
                ],
                order: [["toarealevel", "DESC"]]
            });
            let ugly = {}, result = [];
            for (let i = 0; i < res.length; i++) {
                let r = res[i];
                let butcherAvail = r.toarealevel > 1 || useLevel1;
                if (!useLevel1 && r.toarealevel == 1) {
                    let forceL1 = r.butcher.dispatchArea == "citywide" || r.butcher.dispatchArea == "radius";
                    if (r.butcher.dispatchArea == "radius") {
                        let l3 = yield area_1.default.findByPk(address.level3Id);
                        let distance = helper_1.default.distance(r.butcher.location, l3.location);
                        butcherAvail = r.butcher.radiusAsKm >= distance;
                    }
                    else
                        butcherAvail = forceL1;
                    if (butcherAvail && r.areaTag) {
                        let area = yield area_1.default.findByPk(address.level3Id);
                        butcherAvail = r.areaTag == area.dispatchTag;
                    }
                }
                if (butcherAvail && !ugly[r.butcherid]) {
                    ugly[r.butcherid] = r;
                    result.push(r);
                }
            }
            return result;
        });
    }
    static SetRoutes(router) {
    }
}
exports.default = Route;

//# sourceMappingURL=dispatcher.js.map
