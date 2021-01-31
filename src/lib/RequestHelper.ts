import { AppRequest } from "./http";
import { PreferredAddress, PreferredAddressQuery } from "../db/models/user";
import Area from "../db/models/area";
import * as express from 'express';
import { reject, resolve } from "bluebird";
import { ResourceCacheItem } from "./cache";
import config from "../config";

export class RequestHelper {

    constructor(public req: AppRequest) {

    }

    _generateUrl(resource: ResourceCacheItem, thumbnail: boolean, defaultPath: string) {
        let pathprefix = resource ? resource.folder : "";
        if (!resource) {
            if (defaultPath) {
                return defaultPath
            }
        }
        let filePath = thumbnail ? `${pathprefix}/${resource.thumbnailUrl}` : `${pathprefix}/${resource.contentUrl}`

        return `${config.staticDomain}/${filePath}`;
    }

    imgUrl(resourceType: string, slug: string, filename: string = 'thumbnail', thumbnail: boolean = true, tag1: string = null) {
        let defaultFile = '';
        let ref1 = 0;
        if (resourceType == 'product-photos') {
            ref1 = this.req.__products[slug] ? this.req.__products[slug].id: 0;
            defaultFile = config.staticDomain + "/resource/img/product-default-thumbnail.jpg"

        } else if (resourceType == 'category-photos') {
            let category = this.req.__categories.find(p => p.slug == slug);
            ref1 = category ? category.id: 0;
            defaultFile = config.staticDomain + "/resource/img/category-default-thumbnail.jpg";
        } else if (resourceType == 'butcher-google-photos') {
            ref1 = this.req.__butchers[slug] ? this.req.__butchers[slug].id: 0;
            defaultFile = config.staticDomain + "/resource/img/butcher-default-thumbnail.jpg";
        }
        let photo: ResourceCacheItem;
        if (filename == "thumbnail") {
            photo = tag1 ? (this.req.helper.getResourcesOfType(resourceType + ref1).find(p => p.ref1 == ref1 && p.tag1 == tag1) || this.req.helper.getResourcesOfType(resourceType + ref1).find(p => p.ref1 == ref1 )) :
             this.req.helper.getResourcesOfType(resourceType + ref1).find(p => p.ref1 == ref1)
        } else {
            photo = this.req.helper.getResourcesOfType(resourceType + filename).find(p => p.contentUrl == filename);
        }
            
        return this._generateUrl(photo, thumbnail, defaultFile)
    }

    getResourcesOfType(type: string): ResourceCacheItem[] {
        return this.req.__resources[type] || [];
    }

    async setPreferredAddressByArea(area: Area, save: boolean = true) {
        let adr = await area.getPreferredAddress();
        this.req.prefAddr = adr;
        if (save) {
            if (this.req.user) {
                this.req.user.lastLevel1Id = adr.level1Id;
                this.req.user.lastLevel2Id = adr.level2Id;
                this.req.user.lastLevel3Id = adr.level3Id;
                this.req.user.lastLevel4Id = adr.level4Id;
                this.req.user.lastLocation = {
                    type: 'Point',
                    coordinates: [adr.lat, adr.lng]
                }
                await this.req.user.save();
            } else {
                this.req.session.prefAddr = { 
                    level1Id: adr.level1Id,
                    level2Id: adr.level2Id,
                    level3Id: adr.level3Id,
                    level4Id: adr.level4Id
                };
                await new Promise<void>((resolve, reject) => {
                    this.req.session.save(err => (err ? reject(err) : resolve()))
                })
            }
        } else {
            //delete this.req.prefAddr;
        }
    }

    async setPreferredAddress(adr: PreferredAddressQuery, save: boolean = false) {
        let area = await Area.findByPk(adr.level4Id || adr.level3Id, {
            include: [
                { all: true }
            ]
        })
        
        area && await this.setPreferredAddressByArea(area, save);
    }

    static use(app: express.Application) {
        app.use((req: AppRequest, res, next) => {
            req.helper = new RequestHelper(req);
            req.helper.fillPreferredAddress().then(r => next()).catch(next)
        })
    }

    async fillPreferredAddress() {
        let req = this.req, list = [];
        if (!req.user && !req.session.prefAddr) return;
        if (this.req.prefAddr) return;
        if (req.user && req.session.prefAddr != null) {
            req.user.lastLevel1Id = req.session.prefAddr.level1Id;
            req.user.lastLevel2Id = req.session.prefAddr.level2Id;
            req.user.lastLevel3Id = req.session.prefAddr.level3Id;
            req.user.lastLevel4Id = req.session.prefAddr.level4Id;
            req.session.prefAddr = null;
            await req.user.save();
        }
        var adr: PreferredAddressQuery = {
            level1Id: null,
            level2Id: null,
            level3Id: null,
            level4Id: null,
        };
        if (req.user) {
            adr.level1Id = req.user.lastLevel1Id;
            adr.level2Id = req.user.lastLevel2Id;
            adr.level3Id = req.user.lastLevel3Id;
            adr.level4Id = req.user.lastLevel4Id;
        } else if (req.session.prefAddr) {
            adr = req.session.prefAddr
        }
        await this.setPreferredAddress(adr);
        
    }
}