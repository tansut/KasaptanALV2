import { AppRequest } from "./http";
import { PreferredAddress } from "../db/models/user";
import Area from "../db/models/area";
import * as express from 'express';
import { reject, resolve } from "bluebird";
import { ResourceCacheItem } from "./cache";

export class RequestHelper {
    constructor(public req: AppRequest) {

    }

    getResourcesOfType(type: string): ResourceCacheItem [] {
        return this.req.__resources[type] || [];
    }

    async setPreferredAddress(adr: PreferredAddress, save: boolean = false) {
        if (adr && adr.level3Id) {
            if (adr.level3Id) {
                let area = await Area.findByPk(adr.level3Id, {
                    include: [
                        { all: true }
                    ]
                })

                let pa = await Area.findByPk(area.parent.id, {
                    include: [
                        { all: true }
                    ]
                });

                adr.level1Id = pa.parent.id;
                adr.level2Id = pa.id;
                adr.level3Id = area.id;

                adr.level1Text = pa.parent.name;
                adr.level2Text = pa.name;
                adr.level3Text = area.name;

                adr.level1Slug = pa.parent.slug;
                adr.level2Slug = pa.slug;
                adr.level3Slug = area.slug;

                this.req.prefAddr = adr;

                if (save) {
                    if (this.req.user) {
                        this.req.user.lastLevel1Id = adr.level1Id;
                        this.req.user.lastLevel2Id = adr.level2Id;
                        this.req.user.lastLevel3Id = adr.level3Id;
                        await this.req.user.save();
                    } else {
                        this.req.session.prefAddr = adr;
                        await new Promise((resolve, reject) => {
                            this.req.session.save(err=> (err ? reject(err): resolve()))
                        })
                    }
                }

            }
        }
        else delete this.req.prefAddr;
    }

    static use(app: express.Application) {
        app.use((req: AppRequest, res, next) => {
            req.helper = new RequestHelper(req);
            req.helper.fillPreferredAddress().then(r=>next()).catch(next)
        })        
    }

    async fillPreferredAddress() {
        let req = this.req, list = [];
        if (req.user && req.session.prefAddr != null) {
            req.user.lastLevel1Id = req.session.prefAddr.level1Id;
            req.user.lastLevel2Id = req.session.prefAddr.level2Id;
            req.user.lastLevel3Id = req.session.prefAddr.level3Id;
            req.session.prefAddr = null;
            await req.user.save();
        }
        var adr: PreferredAddress = {
            level1Id: null,
            level2Id: null,
            level3Id: null
        };
        if (req.user) {
            adr.level1Id = req.user.lastLevel1Id;
            adr.level2Id = req.user.lastLevel2Id;
            adr.level3Id = req.user.lastLevel3Id;
        } else if (req.session.prefAddr) {
            adr = req.session.prefAddr
        }
        await this.setPreferredAddress(adr)        
    }
}