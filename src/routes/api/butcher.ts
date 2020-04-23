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
import * as stream from "stream"

export default class Route extends ApiRouter {


    @Auth.Anonymous()
    googleSearchRoute() {
        if (this.req.query.q)
            return this.googleSearch(this.req.query.q).then((data) => this.res.send(data))
        throw new ValidationError("Bişey gir")
    }

    @Auth.Anonymous()
    googleSyncRoute() {
        const placeid = this.req.body.place_id;
        if (!placeid)
            throw new ValidationError("")
        return this.googleSync(placeid).then((data) => this.res.send({ id: data.id, slug: data.slug }));
    }

    @Auth.Anonymous()
    googleSyncPhotosRoute() {
        const id = this.req.params.id
        if (!id)
            throw new ValidationError("id required");
        return ButcherModel.findByPk(id).then(model => {
            if (!model)
                throw new ValidationError("id invalid");
            return this.syncGooglePhotos(model).then((data) => this.res.sendStatus(200));
        })
    }

    getGoogleAreas(place: maps.PlaceDetailsResult) {
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
        if (result["level4"] && Helper.slugify(result["level4"].short_name) == "cayyolu")
            result["level2"].short_name = "Çankaya"
        if ((<string>result["level2"].short_name).startsWith(result["level1"].short_name + " "))
            result["level2"].short_name = "MERKEZ"
        return result;
    }

    generateAddress(area1: Area, area2: Area, area3: Area, place: maps.PlaceDetailsResult, model: ButcherModel) {
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
            let adresses = place.formatted_address.split(",")
            if (adresses.length > 1)
                model.address = adresses[1] + ", " + adresses[0]
        } else
            model.address = result.trim().slice(0, result.length - 2)

        model.address = Helper.capitlize(model.address)
    }

    getBestArea(place: maps.PlaceDetailsResult, model: ButcherModel) {

        let areas = this.getGoogleAreas(place);

        let area1p = Area.findOne({
            where: {
                level: 1,
                slug: Helper.slugify(areas["level1"].short_name)
            }
        }).then((area) => {
            if (!area) {
                throw new Error(areas["level1"].short_name + " ili bulunamadı");
            } else {
                model.areaLevel1Id = area.id;
                let areas = this.getGoogleAreas(place);
                areas["postal"] ? model.postal = areas["postal"].short_name : null;
                return model.save().then(() => area)
            }
        })


        let area2p = area1p.then(area1 => {
            return Area.findOne({
                where: {
                    level: 2,
                    slug: area1.slug + "-" + Helper.slugify(areas["level2"].short_name)
                }
            }).then((area2) => {
                if (!area2) {
                    throw new Error(areas["level2"].short_name + " ilçe bulunamadı");
                } else {
                    model.areaLevel2Id = area2.id;
                    return model.save().then(() => [area1, area2])
                }
            })
        })

        let area3p = area2p.then(areas12 => {
            let area1 = areas12[0], area2 = areas12[1];
            let search = [];
            areas["level4"] ? search.push(area2.slug + "-" + Helper.slugify(areas["level4"].short_name)) : null;
            areas["level4"] ? null : (areas["level3"] ? search.push(area2.slug + "-" + Helper.slugify(areas["level3"].short_name)) : null);
            return Area.findOne({
                where: {
                    level: 3,
                    slug: search
                }
            }).then((area3) => {
                if (!area3) {
                    //throw new Error(areas["level4"].short_name + " semt bulunamadı");
                } else {
                    model.areaLevel3Id = area3.id;
                    return model.save().then(() => [area1, area2, area3])
                }
                return [area1, area2, area3];
            })
        })

        return area3p.then((areas) => this.generateAddress(areas[0], areas[1], areas[2], place, model));
    }


    googleToButcher(place: maps.PlaceDetailsResult, model: ButcherModel) {
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
                
            
            }
      
        } 
        place["user_ratings_total"] && (model.ratingCount = place["user_ratings_total"]);
        model.rating = isNaN(place.rating) ? 0.0 : place.rating;
        model.legalName = place.name;
        if (!model.slug)
            model.slug = Helper.slugify(model.name)

        return this.getBestArea(place, model);
    }

    @Auth.Anonymous()
    dbSyncAllFromCachedGoogle() {


        //return this.normalizePhoto("public/kasap-resimleri/zirve-et-urunleri-tarinssanve-ticltdsti-50-6.jpeg");

        return ButcherModel.findAll().then(butchers => {
            let promlist = [];
            for (let i = 0; i < butchers.length; i++) {
                let butcher = butchers[i];

                ((butcher) => {
                    return this.googleToButcher(<any>(butcher.gpPlace), butcher).then(() => {
                        return butcher.save().then(savedButcher => {
                            console.log(butcher.name + " done")
                            return this.syncGooglePhotos(savedButcher).then(() => savedButcher)
                        })
                    }).catch(err => {
                        console.log(butcher.name + ": ERR: " + err.message)

                    });
                })(butcher)
            }
        })
    }

    googleSync(placeid: string) {
        return this.getGoogleClient().place({
            placeid: placeid
        }).asPromise().then((response) => {
            if (response.status != 200)
                throw new Error("Google Error")

            const place = response.json.result;
            return ButcherModel.findOne({
                where: {
                    gpid: place.place_id
                }
            }).then((dbresult) => {
                if (!dbresult)
                    dbresult = new ButcherModel();
                return this.googleToButcher(place, dbresult).then(() => {
                    return dbresult.save().then(savedButcher => {
                        return this.syncGooglePhotos(savedButcher).then(() => savedButcher)
                    })
                });
            })
        })
    }

    getGoogleClient() {
        return maps.createClient({
            key: 'AIzaSyBFqn2GNAhwbJnpga-3S3xQGBc0EcdAgH8',
            Promise: Promise
        });
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

    savePhoto(model: Butcher, photo: maps.PlacePhoto, photoContent: any, index: number) {
        return new Promise((resolve, reject) => {
            let ct = photoContent.headers["content-type"]
            let fileExt = mime.extension(ct);
            let fileName = `${model.slug}-${model.id}-${index}.${fileExt}`;
            let thumbnailName = `${model.slug}-${model.id}-${index}-thumbnail.${fileExt}`;
            let contentUrl = fileName; // ;
            let str = new stream.Transform();
            photoContent.on("data", (data) => {
                str.push(data)
            })
            photoContent.on("end", () => {
                fs.writeFileSync(this.publicDir + `kasap-resimleri/${fileName}`, str.read());
                Resource.create({
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
                    return Helper.normalizePhoto(this.publicDir + `kasap-resimleri/${fileName}`, this.publicDir + `kasap-resimleri/${thumbnailName}`).then(() => resolve(res))
                }).catch(err => reject(err))

            })
        });

    }



    syncGooglePhotos(model: ButcherModel) {
        let gg = <maps.PlaceDetailsResult>model.gpPlace;
        let photos = gg.photos || [];
        let client = this.getGoogleClient();
        let promiseList = [];
        return Resource.findAll({
            where: {
                type: "butcher-google-photos",
                ref1: model.id
            }
        }).then((savedPhotos) => {
            let photoCounter = savedPhotos.length
            for (let i = 0; i < photos.length; i++) {
                let item = photos[i];
                // if (savedPhotos.findIndex((sp) => sp.ref2 == item.photo_reference) >= 0)
                //     break;
                if (savedPhotos.length > 0)
                    break;
                let promise = client.placesPhoto({
                    maxwidth: item.width,
                    photoreference: item.photo_reference,

                }).asPromise().then((photoContent: any) => {
                    return this.savePhoto(model, item, photoContent, ++photoCounter);
                })
                promiseList.push(promise)
            }
            return promiseList.length > 0 ? Promise.all(promiseList) : Promise.resolve(null);
        })


    }

    googleSearch(input: string) {
        return this.getGoogleClient().findPlace({
            language: "tr",
            input: input,
            inputtype: "textquery",
            fields: ["name", "place_id", "permanently_closed", "formatted_address"]
        }).asPromise().then((response) => {
            if (response.status != 200)
                throw new Error("Google Error")
            return response.json.candidates;
        })
    }


    static SetRoutes(router: express.Router) {
        router.get("/butcher/googlesearch", Route.BindRequest(this.prototype.googleSearchRoute));
        router.post("/butcher/googlesync", Route.BindRequest(this.prototype.googleSyncRoute));
        //router.get("/butcher/googlesyncphotos/:id", Route.BindRequest(this.prototype.googleSyncPhotosRoute));
        //router.get("/butcher/dbsync", Route.BindRequest(this.prototype.dbSyncAllFromCachedGoogle));


    }
}

