import { Auth } from '../../lib/common';
import { ApiRouter } from '../../lib/router';
import * as express from "express";
import SiteLog from '../../db/models/sitelog';
import email from '../../lib/email';
import { ShopCard } from '../../models/shopcard';
import Product, { ProductType } from '../../db/models/product';
import ProductApi from './product'
import Butcher from '../../db/models/butcher';
import Area from '../../db/models/area';
import Dispatcher, { DispatcherTypeDesc } from '../../db/models/dispatcher';
import ButcherProduct from '../../db/models/butcherproduct';
import { Op, Sequelize } from "sequelize";
import { PreferredAddress } from '../../db/models/user';
import { LogisticFactory } from '../../lib/logistic/core';
import { Order } from '../../db/models/order';
import { off } from 'process';
import Helper from '../../lib/helper';

export default class Route extends ApiRouter {
    async _where(where: any, address: PreferredAddress) {
        where['enabled'] = true;
        where[Op.or] = where[Op.or] || [];
        if (address && address.level1Id) {
            where[Op.or].push({
                toareaid: [address.level1Id]
            })
        }
        if (address && address.level2Id) {
            where[Op.or].push({
                toareaid: [address.level2Id]
            })
        }
        if (address && address.level3Id) {
            where[Op.or].push({
                toareaid: address.level3Id
            })
        }
        return where
    }

    async bestDispatcher(butcherId, address: PreferredAddress, basedOn: Order) {
        let where = {
            type: 'butcher',
            butcherid: butcherId,
            [Op.or]: []
        };
        where = await this._where(where, address);
        let res = await Dispatcher.findOne({
            where: where,
            include: [
                {
                    model: Butcher,
                    as: 'butcher'
                },
            ],            
            order: [["toarealevel", "DESC"]],
        })
        if (res && res.logisticProviderUsage != "none" && basedOn && basedOn.orderType != "kurban") {
            let butcher = await Butcher.findByPk(butcherId);
            let usage = res.logisticProviderUsage == "default" ? butcher.logisticProviderUsage: res.logisticProviderUsage;
            if (usage != "none" && butcher.logisticProviderUsage != "disabled" && butcher.logisticProvider) {
                let provider = LogisticFactory.getInstance(butcher.logisticProvider);
                res.name = provider.providerKey;
                res.min = 0.00;
                res.totalForFree = 0.00;
                res.type = "kasaptanal/motokurye";
                res.name = DispatcherTypeDesc[res.type]
                res.fee = 0.00;
                res.feeOffer = 0.00;
                if (basedOn && basedOn.shipLocation) {
                    try {
                        let request = provider.offerFromOrder(basedOn);
                        let offer = await provider.requestOffer(request);
                        res.feeOffer = offer.totalFee;
                        res.fee = offer.totalFee;
                    } catch(err) {
                        email.send('tansut@gmail.com', 'hata: get offer from dispatcher', "error.ejs", {
                            text: err + '/' + err.message,
                            stack: err.stack
                        })                        
                    }
                }                
            }
        }
        return res;
    }

    // async bestDispatcher(butcherId, toAreaId, tolevel) {
    //     let res = await Dispatcher.findOne({
    //         where: {
    //             toareaid: toAreaId,
    //             type: 'butcher'      ,
    //             butcherid: butcherId 
    //         }
    //     })
    //     return res;
    // }

    // async getDispatchers(toid, include=[]) {
    //     let res = await Dispatcher.findAll({
    //         where: {
    //             toareaid: toid,
    //             type: 'butcher'              
    //         },
    //         include:include
    //     })
    //     return res;
    // }

    // async getButchersSeling(address: PreferredAddress) {
    //     let where = {
    //         type: 'butcher'
    //     }
    //     where['$butcher.approved$'] = true;
    //     where = await this._where(where, address);
    //     let res = await Dispatcher.findAll({
    //         where: where,
    //         include: [
    //             {
    //                 model: Butcher,
    //                 as: 'butcher'
    //             },
    //         ],
    //         order: [["toarealevel", "DESC"]]
    //         //limit: 10
    //     })
    //     let ugly = {}, result = [];
    //     res.forEach(r => {
    //         if (!ugly[r.butcherid]) {
    //             ugly[r.butcherid] = r;
    //             result.push(r)
    //         }
    //     })
    //     return result;
    // }

    async getButchersDispatchesForAll(areaids: number[]) {
        let where = {
            type: 'butcher'
        }

        where["toareaid"] = areaids
        let res = await Dispatcher.findAll({
            where: where,
            include: [
                {
                    model: Butcher,
                    as: 'butcher'
                },
            ],
            order: [["toarealevel", "DESC"]]
        })

        return res;
    }


    async getButchersDispatches(address: PreferredAddress) {
        let where = {
            type: 'butcher'
        }

        where = await this._where(where, address);
        where["toarealevel"] = address.level3Id ? 3: (address.level2Id ? 2: 1)
        let res = await Dispatcher.findAll({
            where: where,
            include: [
                {
                    model: Butcher,
                    as: 'butcher'
                },
            ],
            order: [["toarealevel", "DESC"]]
        })

        return res;
    }



    async getButchersSelingAndDispatches(address: PreferredAddress, product: Product, useLevel1: boolean) {
        let where = {
            type: 'butcher'
        }
        where = await this._where(where, address);

        where['$butcher.products.productid$'] = product.id;
        where['$butcher.products.enabled$'] = true;
        let w = [{
            '$butcher.products.kgPrice$': {
                [Op.gt]: 0.0
            }
        },
        {
            [Op.and]: [
                {
                    '$butcher.products.unit1price$': {
                        [Op.gt]: 0.0
                    }
                },
                {
                    '$butcher.products.unit1enabled$': true
                }
            ]
        },
        {
            [Op.and]: [
                {
                    '$butcher.products.unit2price$': {
                        [Op.gt]: 0.0
                    }
                },
                {
                    '$butcher.products.unit2enabled$': true
                }
            ]
        },
        {
            [Op.and]: [
                {
                    '$butcher.products.unit3price$': {
                        [Op.gt]: 0.0
                    }
                },
                {
                    '$butcher.products.unit3enabled$': true
                }
            ]
        }
        ]
        where[Op.or].push(w);
        // if (!useLevel1) {
        //     where[Op.and] = where[Op.and] || []
        //     where[Op.and].push({
        //         toarealevel: {
        //             [Op.ne]: 1
        //         }
        //     })
        // }

        let res = await Dispatcher.findAll({
            where: where,
            include: [
                {
                    model: Butcher,
                    as: 'butcher',
                    include: [{
                        model: ButcherProduct
                    }
                    ]
                },
            ],
            order: [["toarealevel", "DESC"]]
        });
        let ugly = {}, result = [];
        for(let i = 0; i < res.length; i++) {
           let r = res[i]
            let butcherAvail = r.toarealevel > 1  || useLevel1;
            if (!useLevel1 && r.toarealevel == 1) {
                let forceL1 = r.butcher.dispatchArea == "citywide" || r.butcher.dispatchArea == "radius";
                if (r.butcher.dispatchArea == "radius") {
                    let l3 = await Area.findByPk(address.level3Id)
                    let distance = Helper.distance(r.butcher.location, l3.location);
                    butcherAvail = r.butcher.radiusAsKm >= distance
                } else butcherAvail = forceL1;
                if (butcherAvail && r.areaTag) {
                    let area = await Area.findByPk(address.level3Id);
                    butcherAvail = r.areaTag == area.dispatchTag;
                }                
            }        

            if (butcherAvail && !ugly[r.butcherid]) {
                ugly[r.butcherid] = r;
                result.push(r);
            }
        }
        return result;
    }

    static SetRoutes(router: express.Router) {
    }
}


