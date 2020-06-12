import { AppRequest } from "./http";
import { PreferredAddress } from "../db/models/user";
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

                adr.level1Status = pa.parent.status;
                adr.level2Status = pa.status;
                adr.level3Status = area.status;

                adr.display = `${adr.level3Text}, ${adr.level2Text}/${adr.level1Text}`;

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
                            this.req.session.save(err => (err ? reject(err) : resolve()))
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
            req.helper.fillPreferredAddress().then(r => next()).catch(next)
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