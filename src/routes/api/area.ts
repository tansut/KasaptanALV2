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
const Jimp = <Jimp2.default>require('jimp');
import * as path from "path"
import { parse } from 'querystring';

export default class Route extends ApiRouter {




    @Auth.Anonymous()
    getAreas() {

        let promise: Promise<any>;

        if (this.req.query.parentLevel) {
            promise = Area.findAll({
                where: {
                    parentid: parseInt(this.req.params.parentid),
                    level: parseInt(this.req.query.parentLevel) + 1,
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
            this.req.query.level ? (where["level"] = parseInt(this.req.query.level)) : where["level"] = 1;
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

