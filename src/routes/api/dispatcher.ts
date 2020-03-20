import { Auth } from '../../lib/common';
import { ApiRouter } from '../../lib/router';
import * as express from "express";
import SiteLog from '../../db/models/sitelog';
import email from '../../lib/email';
import { ShopCard } from '../../models/shopcard';
import Product from '../../db/models/product';
import ProductApi from './product'
import Butcher from '../../db/models/butcher';
import Area from '../../db/models/area';
import Dispatcher from '../../db/models/dispatcher';
import ButcherProduct from '../../db/models/butcherproduct';
import { Op, Sequelize } from "sequelize";
import { PreferredAddress } from '../../db/models/user';

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

    async bestDispatcher(butcherId, address: PreferredAddress) {
        let where = {
            type: 'butcher',
            butcherid: butcherId,
            [Op.or]: []
        };
        where = await this._where(where, address);

        let res = await Dispatcher.findOne({
            where: where,
            order: [["toarealevel", "DESC"]]
        })
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


    async  getButchersSelingAndDispatches(address: PreferredAddress, pid) {
        let where = {
            type: 'butcher'
        }
        where = await this._where(where, address);
        where['$butcher.products.productid$'] = pid;
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
            //limit: 10
        })
        let ugly = {}, result = [];
        res.forEach(r => {
            if (!ugly[r.butcherid]) {
                ugly[r.butcherid] = r;
                result.push(r)
            }
        })
        return result;
    }



    static SetRoutes(router: express.Router) {
    }
}


