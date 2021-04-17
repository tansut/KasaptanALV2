"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
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
const common_1 = require("../../lib/common");
const router_1 = require("../../lib/router");
const butcher_1 = require("../../db/models/butcher");
const moment = require("moment");
const http_1 = require("../../lib/http");
const helper_1 = require("../../lib/helper");
const resource_1 = require("../../db/models/resource");
const area_1 = require("../../db/models/area");
const fs = require("fs");
const mime = require("mime-types");
const Jimp = require('jimp');
const stream = require("stream");
const sitelog_1 = require("./sitelog");
const sms_1 = require("../../lib/sms");
class Route extends router_1.ApiRouter {
    googleSearchRoute() {
        if (this.req.query.q)
            return this.googleSearch(this.req.query.q).then((data) => this.res.send(data));
        throw new http_1.ValidationError("Bişey gir");
    }
    googleSyncRoute() {
        const placeid = this.req.body.place_id;
        if (!placeid)
            throw new http_1.ValidationError("");
        return this.googleSync(placeid).then((data) => this.res.send({ id: data.id, slug: data.slug }));
    }
    SaveButcherApplication() {
        return __awaiter(this, void 0, void 0, function* () {
            let log = new sitelog_1.default(this.constructorParams);
            let data = {
                logData: JSON.stringify(this.req.body),
                logtype: "BAS"
            };
            yield log.log(data);
            yield sms_1.Sms.send('+905326274151', 'yeni basvuru: ' + this.req.body.tel, false, log);
            this.res.send('OK');
        });
    }
    googleSyncPhotosRoute() {
        const id = this.req.params.id;
        if (!id)
            throw new http_1.ValidationError("id required");
        return butcher_1.default.findByPk(id).then(model => {
            if (!model)
                throw new http_1.ValidationError("id invalid");
            return this.syncGooglePhotos(model).then((data) => this.res.sendStatus(200));
        });
    }
    getGoogleAreas(place) {
        let result = {};
        for (let i = 0; i < place.address_components.length; i++) {
            let adres = place.address_components[i];
            let level1 = adres.types.indexOf("administrative_area_level_1");
            let level2 = adres.types.indexOf("administrative_area_level_2");
            let level3 = adres.types.indexOf("administrative_area_level_2");
            let level4 = adres.types.indexOf("administrative_area_level_4");
            let postal = adres.types.indexOf("postal_code");
            let route = adres.types.indexOf("route");
            let street = adres.types.indexOf("street_number");
            let premise = adres.types.indexOf("premise");
            let subpremise = adres.types.indexOf("subpremise");
            level1 >= 0 ? result["level1"] = adres : null;
            level2 >= 0 ? result["level2"] = adres : null;
            level3 >= 0 ? result["level3"] = adres : null;
            level4 >= 0 ? result["level4"] = adres : null;
            postal >= 0 ? result["postal"] = adres : null;
            route >= 0 ? result["route"] = adres : null;
            street >= 0 ? result["street"] = adres : null;
            premise >= 0 ? result["premise"] = adres : null;
            subpremise >= 0 ? result["subpremise"] = adres : null;
        }
        if (result["level4"] && helper_1.default.slugify(result["level4"].short_name) == "cayyolu")
            result["level2"].short_name = "Çankaya";
        if (result["level2"].short_name.startsWith(result["level1"].short_name + " "))
            result["level2"].short_name = "MERKEZ";
        return result;
    }
    generateAddress(area1, area2, area3, place, model) {
        let areas = this.getGoogleAreas(place);
        let result = areas["level4"] ? areas["level4"].short_name + ", " : "";
        if (areas["route"]) {
            result = result + areas["route"].short_name + ", ";
        }
        if (areas["street"]) {
            result = result + areas["street"].short_name + ", ";
        }
        if (areas["premise"]) {
            result = result + areas["premise"].short_name + ", ";
            if (areas["subpremise"]) {
                result = result + areas["subpremise"].short_name + ", ";
            }
        }
        model.address = place.formatted_address;
        if (place.formatted_address) {
            let adresses = place.formatted_address.split(",");
            if (adresses.length > 1)
                model.address = adresses[1] + ", " + adresses[0];
        }
        else
            model.address = result.trim().slice(0, result.length - 2);
        model.address = helper_1.default.capitlize(model.address);
    }
    getBestArea(place, model) {
        let areas = this.getGoogleAreas(place);
        if ("İstanbul - Avrupa" == areas["level1"].short_name) {
            areas["level1"].short_name = "istanbul";
        }
        let area1p = area_1.default.findOne({
            where: {
                level: 1,
                slug: helper_1.default.slugify(areas["level1"].short_name)
            }
        }).then((area) => {
            if (!area) {
                throw new Error(areas["level1"].short_name + " ili bulunamadı");
            }
            else {
                model.areaLevel1Id = area.id;
                let areas = this.getGoogleAreas(place);
                areas["postal"] ? model.postal = areas["postal"].short_name : null;
                return model.save().then(() => area);
            }
        });
        let area2p = area1p.then(area1 => {
            return area_1.default.findOne({
                where: {
                    level: 2,
                    slug: area1.slug + "-" + helper_1.default.slugify(areas["level2"].short_name)
                }
            }).then((area2) => {
                if (!area2) {
                    throw new Error(areas["level2"].short_name + " ilçe bulunamadı");
                }
                else {
                    model.areaLevel2Id = area2.id;
                    return model.save().then(() => [area1, area2]);
                }
            });
        });
        let area3p = area2p.then(areas12 => {
            let area1 = areas12[0], area2 = areas12[1];
            let search = [];
            areas["level4"] ? search.push(area2.slug + "-" + helper_1.default.slugify(areas["level4"].short_name)) : null;
            areas["level4"] ? null : (areas["level3"] ? search.push(area2.slug + "-" + helper_1.default.slugify(areas["level3"].short_name)) : null);
            return area_1.default.findOne({
                where: {
                    level: 3,
                    slug: search
                }
            }).then((area3) => {
                if (!area3) {
                    //throw new Error(areas["level4"].short_name + " semt bulunamadı");
                }
                else {
                    model.areaLevel3Id = area3.id;
                    return model.save().then(() => [area1, area2, area3]);
                }
                return [area1, area2, area3];
            });
        });
        return area3p.then((areas) => this.generateAddress(areas[0], areas[1], areas[2], place, model));
    }
    googleToButcher(place, model) {
        model.name = place.name;
        model.gpid = place.place_id;
        place.website && (model.website = place.website);
        place.formatted_address && (model.address = place.formatted_address);
        place.formatted_phone_number && (model.phone = place.formatted_phone_number);
        model.gplastdate = moment.utc().toDate();
        model.gpPlace = place;
        if (place.geometry && place.geometry.location) {
            model.location = {
                type: 'Point',
                coordinates: [place.geometry.location.lat, place.geometry.location.lng]
            };
        }
        place["user_ratings_total"] && (model.ratingCount = place["user_ratings_total"]);
        model.rating = isNaN(place.rating) ? 0.0 : place.rating;
        model.legalName = place.name;
        if (!model.slug)
            model.slug = helper_1.default.slugify(model.name);
        return this.getBestArea(place, model);
    }
    dbSyncAllFromCachedGoogle() {
        //return this.normalizePhoto("public/kasap-resimleri/zirve-et-urunleri-tarinssanve-ticltdsti-50-6.jpeg");
        return butcher_1.default.findAll().then(butchers => {
            let promlist = [];
            for (let i = 0; i < butchers.length; i++) {
                let butcher = butchers[i];
                ((butcher) => {
                    return this.googleToButcher((butcher.gpPlace), butcher).then(() => {
                        return butcher.save().then(savedButcher => {
                            console.log(butcher.name + " done");
                            return this.syncGooglePhotos(savedButcher).then(() => savedButcher);
                        });
                    }).catch(err => {
                        console.log(butcher.name + ": ERR: " + err.message);
                    });
                })(butcher);
            }
        });
    }
    googleSync(placeid) {
        return this.getGoogleClient().place({
            placeid: placeid
        }).asPromise().then((response) => {
            if (response.status != 200)
                throw new Error("Google Error");
            const place = response.json.result;
            return butcher_1.default.findOne({
                where: {
                    gpid: place.place_id
                }
            }).then((dbresult) => {
                if (!dbresult)
                    dbresult = new butcher_1.default();
                return this.googleToButcher(place, dbresult).then(() => {
                    return dbresult.save().then(savedButcher => {
                        return this.syncGooglePhotos(savedButcher).then(() => savedButcher);
                    });
                });
            });
        });
    }
    getGoogleClient() {
        return {};
        // return maps.createClient({
        //     key: 'AIzaSyBFqn2GNAhwbJnpga-3S3xQGBc0EcdAgH8',
        //     Promise: Promise
        // });
    }
    // static managecitydata() {
    //     return Area.findAll({
    //         where: {
    //             level: 1
    //         }
    //     }).then(data => {
    //         let list = []
    //         for (let i = 0; i < data.length; i++) {
    //             let city = data[i];
    //             city.lowerName = Helper.toLower(city.name)
    //             city.slug = Helper.slugify(city.lowerName);
    //             list.push(city.save());
    //         }
    //         return Promise.all(list)
    //     })
    // }
    // static managetowndata() {
    //     return Area.findAll({
    //         where: {
    //             level: 2
    //         },
    //         include: [
    //             Area
    //         ]
    //     }).then(data => {
    //         let list = []
    //         for (let i = 0; i < data.length; i++) {
    //             let area = data[i];
    //             area.lowerName = Helper.toLower(area.name)
    //             area.slug = area.parent.slug + "-" + Helper.slugify(area.lowerName);
    //             list.push(area.save());
    //         }
    //         return Promise.all(list)
    //     })
    // }
    // static managedistrictdata() {
    //     return Area.findAll({
    //         where: {
    //             level: 3
    //         },
    //         include: [
    //             Area
    //         ]
    //     }).then(data => {
    //         let list = []
    //         for (let i = 0; i < data.length; i++) {
    //             let area = data[i];
    //             if (area.name != area.slug)
    //                 continue;
    //             area.lowerName = Helper.toLower(area.name)
    //             area.slug = area.parent.slug + "-" + Helper.slugify(area.lowerName);
    //             list.push(area.save());
    //         }
    //         return Promise.all(list)
    //     })
    // }
    // processGooglePhoto(buffer: Buffer) {
    //     Jimp.read(buffer).then
    // }
    savePhoto(model, photo, photoContent, index) {
        return new Promise((resolve, reject) => {
            let ct = photoContent.headers["content-type"];
            let fileExt = mime.extension(ct);
            let fileName = `${model.slug}-${model.id}-${index}.${fileExt}`;
            let thumbnailName = `${model.slug}-${model.id}-${index}-thumbnail.${fileExt}`;
            let contentUrl = fileName; // ;
            let str = new stream.Transform();
            photoContent.on("data", (data) => {
                str.push(data);
            });
            photoContent.on("end", () => {
                fs.writeFileSync(this.publicDir + `kasap-resimleri/${fileName}`, str.read());
                resource_1.default.create({
                    type: "butcher-google-photos",
                    ref1: model.id,
                    //ref2: photo.photo_reference,
                    contentType: ct,
                    contentLength: parseInt(photoContent.headers["content-length"]),
                    contentUrl: contentUrl,
                    title: model.name + ` Resimleri ${index}`,
                    thumbnailUrl: thumbnailName,
                    fileName: fileName
                }).then((res) => {
                    return helper_1.default.normalizePhoto(this.publicDir + `kasap-resimleri/${fileName}`, this.publicDir + `kasap-resimleri/${thumbnailName}`).then(() => resolve(res));
                }).catch(err => reject(err));
            });
        });
    }
    syncGooglePhotos(model) {
        let gg = model.gpPlace;
        let photos = gg.photos || [];
        let client = this.getGoogleClient();
        let promiseList = [];
        return resource_1.default.findAll({
            where: {
                type: "butcher-google-photos",
                ref1: model.id
            }
        }).then((savedPhotos) => {
            let photoCounter = savedPhotos.length;
            for (let i = 0; i < photos.length; i++) {
                let item = photos[i];
                // if (savedPhotos.findIndex((sp) => sp.ref2 == item.photo_reference) >= 0)
                //     break;
                if (savedPhotos.length > 0)
                    break;
                let promise = client.placesPhoto({
                    maxwidth: item.width,
                    photoreference: item.photo_reference,
                }).asPromise().then((photoContent) => {
                    return this.savePhoto(model, item, photoContent, ++photoCounter);
                });
                promiseList.push(promise);
            }
            return promiseList.length > 0 ? Promise.all(promiseList) : Promise.resolve(null);
        });
    }
    googleSearch(input) {
        return this.getGoogleClient().findPlace({
            language: "tr",
            input: input,
            inputtype: "textquery",
            fields: ["name", "place_id", "permanently_closed", "formatted_address"]
        }).asPromise().then((response) => {
            if (response.status != 200)
                throw new Error("Google Error");
            return response.json.candidates;
        });
    }
    static SetRoutes(router) {
        router.get("/butcher/googlesearch", Route.BindRequest(this.prototype.googleSearchRoute));
        router.post("/butcher/googlesync", Route.BindRequest(this.prototype.googleSyncRoute));
        router.post("/savebutcherapplication", Route.BindRequest(this.prototype.SaveButcherApplication));
        //router.get("/butcher/googlesyncphotos/:id", Route.BindRequest(this.prototype.googleSyncPhotosRoute));
        //router.get("/butcher/dbsync", Route.BindRequest(this.prototype.dbSyncAllFromCachedGoogle));
    }
}
__decorate([
    common_1.Auth.Anonymous(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], Route.prototype, "googleSearchRoute", null);
__decorate([
    common_1.Auth.Anonymous(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], Route.prototype, "googleSyncRoute", null);
__decorate([
    common_1.Auth.Anonymous(),
    common_1.Auth.RequireCatcpha(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], Route.prototype, "SaveButcherApplication", null);
__decorate([
    common_1.Auth.Anonymous(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], Route.prototype, "googleSyncPhotosRoute", null);
__decorate([
    common_1.Auth.Anonymous(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], Route.prototype, "dbSyncAllFromCachedGoogle", null);
exports.default = Route;
