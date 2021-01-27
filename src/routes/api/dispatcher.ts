import { Auth } from '../../lib/common';
import { ApiRouter } from '../../lib/router';
import * as express from "express";
import SiteLog from '../../db/models/sitelog';
import email from '../../lib/email';
import { ShopCard } from '../../models/shopcard';
import Product, { ProductDispatch, ProductType } from '../../db/models/product';
import ProductApi from './product'
import Butcher from '../../db/models/butcher';
import Area from '../../db/models/area';
import Dispatcher, { DispatcherTypeDesc } from '../../db/models/dispatcher';
import ButcherProduct from '../../db/models/butcherproduct';
import { Op, Sequelize } from "sequelize";
import { PreferredAddress } from '../../db/models/user';
import { LogisticFactory, LogisticProvider, OfferResponse } from '../../lib/logistic/core';
import { Order } from '../../db/models/order';
import { off } from 'process';
import Helper from '../../lib/helper';
import { ButcherManualLogistics, ButcherAutoLogistics } from '../../lib/logistic/butcher';
import AreaApi from './area'
import * as _ from "lodash"
import { add } from 'lodash';

export interface DispatcherQuery {
    adr: PreferredAddress,
    product?: Product,
    useLevel1?: boolean;
    butcher?: number | Butcher,
    orderType?: string;
    excludeCitywide?: boolean;
}

export default class Route extends ApiRouter {
    async _where(where: any, address: PreferredAddress) {
        where['enabled'] = true;
        where[Op.or] = where[Op.or] || [];
        where[Op.or].push({
            toarealevel: [0]
        })
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



    async getDispatchers(q: DispatcherQuery) { 
        let where = {
            enabled: true
        }
        let include = [
            {
                model: Butcher,
                as: 'butcher'             
            }           
        ]
        where = await this._where(where, q.adr);
        
        if (q.excludeCitywide) {
            where['toareaid'] = {
                [Op.ne]: null
            };
        }

        if (q.product) {
            include[0]['include'] = [{
                model: ButcherProduct
            }]      
            
            
            where[`$butcher.shipday${Helper.Now().getDay()}$`] = true;
            where['$butcher.status$'] = "open";    
            where['$butcher.approved$'] = true;    
            where['$butcher.products.productid$'] = q.product.id;
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
            // if (productdispatch == ProductDispatch.countrywide) {
            //     where[Op.or].push({
            //         toarealevel: [0]
            //     })
            // }

            where[Op.or].push(w);
        }

        if (q.butcher) {
            let butcher = typeof (q.butcher) == 'number' ? await Butcher.findByPk(q.butcher) : q.butcher;
            where['butcherid'] = butcher.id                        
        }
       
        let res = await Dispatcher.findAll({
            where: where,
            include: include,
            order: [["toarealevel", "DESC"]],
        })

        let ugly = {}, result: Dispatcher [] = [];
     
        let l3 = await Area.findByPk(q.adr.level3Id || q.adr.level2Id);
        let areaApi = new AreaApi(this.constructorParams);
        let butcherAreaData = await areaApi.ensureDistances(res.map(s=>s.butcher), l3);
        for (let i = 0; i < res.length; i++) {         
            if (q.product && res[i].toarealevel == 0 && q.product.dispatch != ProductDispatch.countrywide)
                continue; 
            let areaData = butcherAreaData.find(ad=>ad.butcherid == res[i].butcherid)
            let provider = res[i].setProvider(q.useLevel1, l3, q.orderType, areaData.bestKm);

            if (provider && !ugly[res[i].butcherid]) {
                res[i].butcherArea = areaData;
                ugly[res[i].butcherid] = res[i];
                result.push(res[i]);
            }
        }
    
        result = _.sortBy(result, ["butcherArea.kmActive"])

        return result;        
    }




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

        let d = await this.getDispatchers({
            adr: address
        })

        return d;
    }

    async dispatchingAvailable(address: PreferredAddress, useLevel1: boolean) {
        let where = {
            type: 'butcher'
        }
        where = await this._where(where, address);

        // if (!useLevel1) {
        //     where[Op.and] = where[Op.and] || []
        //     where[Op.and].push({
        //         toarealevel: {
        //             [Op.ne]: 1
        //         }
        //     })
        // }        

        let res = await Dispatcher.findOne({
            where: where,
            include: [
                {
                    model: Butcher,
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
    }




    static SetRoutes(router: express.Router) {
    }
}


