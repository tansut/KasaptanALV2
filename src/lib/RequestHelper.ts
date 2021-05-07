import { AppRequest } from "./http";
import { PreferredAddressQuery } from "../db/models/user";
import Area from "../db/models/area";
import * as express from 'express';
import { ResourceCacheItem } from "./cache";
import config from "../config";
import Helper from "./helper";
import { GeoLocation } from "../models/geo";

export class RequestHelper {

    constructor(public req: AppRequest, public res: express.Response) {

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

    async setPreferredAddressByArea(area: Area, save: boolean = true, loc: GeoLocation) {
        let adr = await area.getPreferredAddress();
        this.req.prefAddr = adr;
        if (save) {
            if (this.req.user) {
                this.req.user.lastLevel1Id = adr.level1Id;
                this.req.user.lastLevel2Id = adr.level2Id;
                this.req.user.lastLevel3Id = adr.level3Id;
                this.req.user.lastLevel4Id = adr.level4Id;
                this.req.user.lastLocation = loc || {
                    type: 'Point',
                    coordinates: [adr.lat, adr.lng]
                }
                await this.req.user.save();
            } 
            this.res.cookie('prefAddr', JSON.stringify(Helper.serializePrefAddr(adr)), { maxAge: 60 * 24 * 60 * 60 * 1000, httpOnly: false});
        } 
    }

    async setPreferredAddress(adr: PreferredAddressQuery, save: boolean = false) {
        let area = await Area.findByPk(adr.level4Id || adr.level3Id, {
            include: [
                { all: true }
            ]
        })
        
        area && await this.setPreferredAddressByArea(area, save, adr.lat ? {
            type: 'Point',
            coordinates: [adr.lat, adr.lng] }: null
        );
    }

    static use(app: express.Application) {
        app.use((req: AppRequest, res, next) => {
            req.helper = new RequestHelper(req, res);
            req.helper.fillPreferredAddress().then(r => next()).catch(next)
        })
    }

    async fillPreferredAddress() {
        let req = this.req, list = [];

        var adr: PreferredAddressQuery = null;

        if (req.cookies['prefAddr']) {
            adr = JSON.parse(req.cookies['prefAddr']);
        }
        
        if (!req.user && !adr) return;

        if (req.user && !req.user.hasSavedLocation() && adr != null)  {
            req.user.lastLevel1Id = adr.level1Id; 
            req.user.lastLevel2Id = adr.level2Id;
            req.user.lastLevel3Id = adr.level3Id;
            req.user.lastLevel4Id = adr.level4Id;
            req.user.lastLocation = adr.lat ? {
                type: 'Point',
                coordinates: [adr.lat, adr.lng]
            }: null
            await req.user.save();
        }

        if (req.user && req.user.hasSavedLocation()) {
            if (adr) {
                if ((req.user.lastLevel1Id != adr.level1Id) ||
                (req.user.lastLevel2Id != adr.level2Id) ||
                (req.user.lastLevel3Id != adr.level3Id) ||
                (req.user.lastLevel4Id != adr.level4Id) || (
                    !req.user.hasSameLatLng({lat: adr.lat, lng: adr.lng})
                )  ) {
                    req.user.lastLevel1Id = adr.level1Id;
                    req.user.lastLevel2Id = adr.level2Id;
                    req.user.lastLevel3Id = adr.level3Id;
                    req.user.lastLevel4Id = adr.level4Id;
                    req.user.lastLocation = adr.lat ? {
                        type: 'Point',
                        coordinates: [adr.lat, adr.lng]
                    }: null
                    await req.user.save()
                }
            } else {
                adr = {}                
                adr.level1Id = req.user.lastLevel1Id;
                adr.level2Id = req.user.lastLevel2Id;
                adr.level3Id = req.user.lastLevel3Id;
                adr.level4Id = req.user.lastLevel4Id;
                if (req.user.lastLocation) {
                    adr.lat = req.user.lastLocation.coordinates[0];
                    adr.lng = req.user.lastLocation.coordinates[1];
                } else {
                    adr.lat = null;
                    adr.lng = null;
                }
            }            
        } 

        adr && await this.setPreferredAddress(adr);        
    }
}