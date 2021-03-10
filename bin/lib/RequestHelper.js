"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RequestHelper = void 0;
const area_1 = require("../db/models/area");
const config_1 = require("../config");
const helper_1 = require("./helper");
class RequestHelper {
    constructor(req, res) {
        this.req = req;
        this.res = res;
    }
    _generateUrl(resource, thumbnail, defaultPath) {
        let pathprefix = resource ? resource.folder : "";
        if (!resource) {
            if (defaultPath) {
                return defaultPath;
            }
        }
        let filePath = thumbnail ? `${pathprefix}/${resource.thumbnailUrl}` : `${pathprefix}/${resource.contentUrl}`;
        return `${config_1.default.staticDomain}/${filePath}`;
    }
    imgUrl(resourceType, slug, filename = 'thumbnail', thumbnail = true, tag1 = null) {
        let defaultFile = '';
        let ref1 = 0;
        if (resourceType == 'product-photos') {
            ref1 = this.req.__products[slug] ? this.req.__products[slug].id : 0;
            defaultFile = config_1.default.staticDomain + "/resource/img/product-default-thumbnail.jpg";
        }
        else if (resourceType == 'category-photos') {
            let category = this.req.__categories.find(p => p.slug == slug);
            ref1 = category ? category.id : 0;
            defaultFile = config_1.default.staticDomain + "/resource/img/category-default-thumbnail.jpg";
        }
        else if (resourceType == 'butcher-google-photos') {
            ref1 = this.req.__butchers[slug] ? this.req.__butchers[slug].id : 0;
            defaultFile = config_1.default.staticDomain + "/resource/img/butcher-default-thumbnail.jpg";
        }
        let photo;
        if (filename == "thumbnail") {
            photo = tag1 ? (this.req.helper.getResourcesOfType(resourceType + ref1).find(p => p.ref1 == ref1 && p.tag1 == tag1) || this.req.helper.getResourcesOfType(resourceType + ref1).find(p => p.ref1 == ref1)) :
                this.req.helper.getResourcesOfType(resourceType + ref1).find(p => p.ref1 == ref1);
        }
        else {
            photo = this.req.helper.getResourcesOfType(resourceType + filename).find(p => p.contentUrl == filename);
        }
        return this._generateUrl(photo, thumbnail, defaultFile);
    }
    getResourcesOfType(type) {
        return this.req.__resources[type] || [];
    }
    setPreferredAddressByArea(area, save = true) {
        return __awaiter(this, void 0, void 0, function* () {
            let adr = yield area.getPreferredAddress();
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
                    };
                    yield this.req.user.save();
                }
                this.res.cookie('prefAddr', JSON.stringify(helper_1.default.serializePrefAddr(adr)), { maxAge: 60 * 24 * 60 * 60 * 1000, httpOnly: false });
            }
        });
    }
    setPreferredAddress(adr, save = false) {
        return __awaiter(this, void 0, void 0, function* () {
            let area = yield area_1.default.findByPk(adr.level4Id || adr.level3Id, {
                include: [
                    { all: true }
                ]
            });
            area && (yield this.setPreferredAddressByArea(area, save));
        });
    }
    static use(app) {
        app.use((req, res, next) => {
            req.helper = new RequestHelper(req, res);
            req.helper.fillPreferredAddress().then(r => next()).catch(next);
        });
    }
    fillPreferredAddress() {
        return __awaiter(this, void 0, void 0, function* () {
            let req = this.req, list = [];
            var adr = null;
            if (req.cookies['prefAddr']) {
                adr = JSON.parse(req.cookies['prefAddr']);
            }
            if (!req.user && !adr)
                return;
            if (req.user && !req.user.hasSavedLocation() && adr != null) {
                req.user.lastLevel1Id = adr.level1Id;
                req.user.lastLevel2Id = adr.level2Id;
                req.user.lastLevel3Id = adr.level3Id;
                req.user.lastLevel4Id = adr.level4Id;
                yield req.user.save();
            }
            if (req.user && req.user.hasSavedLocation()) {
                if (adr) {
                    if ((req.user.lastLevel1Id != adr.level1Id) ||
                        (req.user.lastLevel2Id != adr.level2Id) ||
                        (req.user.lastLevel3Id != adr.level3Id) ||
                        (req.user.lastLevel4Id != adr.level4Id)) {
                        req.user.lastLevel1Id = adr.level1Id;
                        req.user.lastLevel2Id = adr.level2Id;
                        req.user.lastLevel3Id = adr.level3Id;
                        req.user.lastLevel4Id = adr.level4Id;
                        yield req.user.save();
                    }
                }
                else {
                    adr = {};
                    adr.level1Id = req.user.lastLevel1Id;
                    adr.level2Id = req.user.lastLevel2Id;
                    adr.level3Id = req.user.lastLevel3Id;
                    adr.level4Id = req.user.lastLevel4Id;
                }
            }
            adr && (yield this.setPreferredAddress(adr));
        });
    }
}
exports.RequestHelper = RequestHelper;
