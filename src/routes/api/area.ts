import { Auth } from '../../lib/common';
import { ApiRouter } from '../../lib/router';
import * as express from "express";
import * as maps from "@google/maps"
import ButcherModel from '../../db/models/butcher';
import moment = require('moment');
import { ValidationError } from '../../lib/http';
import Helper from '../../lib/helper';
import Resource from '../../db/models/resource';
import Area from '../../db/models/area';
import * as fs from "fs";
import * as mime from "mime-types"
import Butcher from '../../db/models/butcher';
import * as Jimp2 from 'jimp'
const Jimp = <Jimp2>require('jimp');
import * as path from "path"
import { parse } from 'querystring';
import ButcherArea from '../../db/models/butcherarea';
import { Google } from '../../lib/google';
import email from '../../lib/email';

export default class Route extends ApiRouter {

    async ensureDistances(butchers: Butcher [], area: Area) {    
        await area.ensureLocation();
        let list = await ButcherArea.findAll({
            where: {
                areaid: area.id,
                butcherid:butchers.map(p=>p.id)
            } 
        });
        if (list.length == butchers.length) return list;
        for(let i = 0; i < butchers.length;i++) {
            let found = list.find(o=>o.butcherid == butchers[i].id);
            if (!found) {     
                try {
                    list.push(await this.create(butchers[i], area));
                } catch(err){
                    email.send('tansut@gmail.com', 'hata/ensureDistances', "error.ejs", {
                        text: err.message,
                        stack: err.stack
                    });                     
                }                           
            }
        }   
        return list;     
    }

    async create(butcher: Butcher, area: Area) {
        let itemToAdd = new ButcherArea();
        itemToAdd.butcherid = butcher.id;
        itemToAdd.areaid = area.id;
        itemToAdd.kmDirect = Helper.distance(butcher.location, area.location);
        let googleResult = await Google.distanceMatrix(butcher.location, area.location);
        itemToAdd.googleData = JSON.stringify(googleResult || {});
        let result = await Google.distanceInKM(googleResult);
        itemToAdd.kmGoogle = result.val / 1000;
        itemToAdd.kmActive = itemToAdd.kmGoogle || (itemToAdd.kmDirect * 1.5);
        itemToAdd.name = butcher.name + '/' + area.slug;
        return await itemToAdd.save()
    }

    async ensureDistance(butcher: Butcher, area: Area) {
        let existing = await ButcherArea.findOne({
            where: {
                areaid: area.id,
                butcherid: butcher.id
            } 
        })
        if (!existing) {
            try {
                existing = await this.create(butcher, area)
            } catch(err) {
                email.send('tansut@gmail.com', 'hata/ensureDistance', "error.ejs", {
                    text: err.message,
                    stack: err.stack
                });   
                return null;  
                // return {
                //     val: Helper.distance(butcher.location, area.location) * 1.5,
                //     max: Helper.distance(butcher.location, area.location) * 2,
                //     min: Helper.distance(butcher.location, area.location),
                // }               
            }
        }  
        return existing;
    }


    @Auth.Anonymous()
    getAreas() {

        let promise: Promise<any>;

        if (this.req.query.parentLevel) {
            promise = Area.findAll({
                where: {
                    parentid: parseInt(this.req.params.parentid),
                    level: parseInt(this.req.query.parentLevel as string) + 1,
                    //status: 'generic'
                },
                order: [["displayOrder", "DESC"], ["Name", "ASC"]]
            }).then((parentSubs => {
                let ids = parentSubs.map(i => i.id);
                return {
                    parentid: ids
                }
            }))
        } else {
            let where = <any>{};
            this.req.query.level ? (where["level"] = parseInt(this.req.query.level as string)) : where["level"] = 1;
            this.req.params.parentid ? (where["parentid"] = this.req.params.parentid) : null;
            if (where["level"] == 1) { 
                where["status"] = "active"
            }
            //where['status'] = 'generic';
            promise = Promise.resolve(where)
        }
        return promise.then(where => {
            return Area.findAll({
                where: where,
                order: [["displayOrder", "DESC"], ["Name", "ASC"]]
            }
            ).then(areas => areas.map(area => {
                if (where["level"] == 1) {

                }
                return {
                    id: area.id,
                    name: area.name,
                    slug: area.slug
                }
            })).then(data => this.res.send(data))
        })
    }

    static SetRoutes(router: express.Router) {
        router.get("/area/children/:parentid?", Route.BindRequest(this.prototype.getAreas));
    }
}

