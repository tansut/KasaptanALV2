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
import {Op}  from "sequelize";
import { PreferredAddress } from '../../db/models/user';

export default class Route extends ApiRouter {

    _where(where: any, address: PreferredAddress) {
        where[Op.or] =  where[Op.or] || [];
        if (address.level1Id) {
            where[Op.or].push({
                toareaid: address.level1Id
            })
        }
        if (address.level2Id) {
            where[Op.or].push({
                toareaid: address.level2Id
            })
        }
        if (address.level3Id) {
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
        where = this._where(where, address);
                     
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

    async getButchersSelingAndDispatches(address: PreferredAddress, pid) {
        let where = {
            type: 'butcher'       
        }
        where = this._where(where, address);
        where['$butcher.products.productid$'] = pid;
        where['$butcher.products.kgPrice$'] = {[Op.gt]: 0.0 }
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
            order: [['lastorderitemid', 'DESC']]
            //limit: 10
        })
        return res;
    }    



    static SetRoutes(router: express.Router) {
    }
}


