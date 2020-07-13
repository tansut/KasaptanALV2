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
const router_1 = require("../lib/router");
const common_1 = require("../lib/common");
const helper_1 = require("../lib/helper");
const resource_1 = require("../db/models/resource");
const path = require("path");
const Jimp = require('jimp');
const fs = require("fs");
const product_1 = require("./api/product");
const sequelize_1 = require("sequelize");
class Route extends router_1.ViewRouter {
    sendCachedPhoto(url) {
        //Get the image from filesystem
        let file = path.resolve(url);
        //var img = fs.readFileSync(file);
        //Get some info about the file
        var stats = fs.statSync(file);
        var mtime = stats.mtime;
        var size = stats.size;
        //Get the if-modified-since header from the request
        var modifiedHeader = this.req.headers["if-modified-since"];
        //check if if-modified-since header is the same as the mtime of the file 
        if (modifiedHeader != null) {
            let reqModDate = new Date(this.req.headers["if-modified-since"]);
            if (reqModDate.toUTCString() == mtime.toUTCString()) {
                //Yes: then send a 304 header without image data (will be loaded by cache)
                console.log("load from cache");
                this.res.writeHead(304, {
                    "Last-Modified": mtime.toUTCString()
                });
                this.res.end();
                return true;
            }
        }
        else {
            return false;
        }
    }
    // sendPhoto(url, resource: Resource, thumbnail: boolean) {
    //     return Jimp.read(path.resolve(url))
    //         .then(image => {
    //             let _img = image;
    //             thumbnail ? _img = _img.quality(80).cover(500, 500) : _img;
    //             return _img.getBufferAsync("image/jpeg").then(buff => {
    //                 var stats = fs.statSync(path.resolve(url));
    //                 var mtime = stats.mtime;
    //                 var size = stats.size;
    //                 this.res.set("jpeg")
    //                 this.res.header("Last-Modified", mtime.toUTCString())
    //                 this.res.header("Cache-Control", "public")
    //                 this.res.header("Expires", moment.utc().toString())
    //                 this.res.send(new Buffer(buff))
    //             })
    //         }).catch(e => {
    //             //this.res.send(path.resolve(url));
    //             this.res.sendStatus(404);
    //         })
    // }
    sendDefaultFile(file) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.sendFile(file).catch(e => this.res.sendStatus(404));
        });
    }
    sendResource(resource, thumbnail, defaultPath) {
        return __awaiter(this, void 0, void 0, function* () {
            let pathprefix = resource ? resource.folder : "";
            if (!resource) {
                if (defaultPath) {
                    return this.sendDefaultFile(defaultPath);
                }
                else
                    return this.next();
            }
            //let filePath = thumbnail ? `${this.publicDir}${pathprefix}/${resource.thumbnailUrl}` : `${this.publicDir}${pathprefix}/${resource.contentUrl}`
            let filePath = thumbnail ? `${pathprefix}/${resource.thumbnailUrl}` : `${pathprefix}/${resource.contentUrl}`;
            return this.res.redirect(`http://static.kasaptanal.com/${filePath}`);
            //if (config.nodeenv == 'developmen')
            //return this.sendFile(path.resolve(filePath), false).catch(e => { return defaultPath ? this.sendDefaultFile(defaultPath) : Promise.reject(e) })
        });
    }
    viewRoute() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.req.params.id)
                return this.next();
            let id = parseInt(this.req.params.id);
            let resource = yield resource_1.default.findByPk(id);
            return this.sendResource(resource, this.req.query.thumbnail ? true : false, null);
        });
    }
    fillSlugs() {
        return __awaiter(this, void 0, void 0, function* () {
            let resources = yield resource_1.default.findAll({
                where: {
                    type: ['product-videos', 'product-photos'],
                    tag1: {
                        [sequelize_1.Op.or]: [{
                                [sequelize_1.Op.like]: '%yemek%'
                            }, { [sequelize_1.Op.like]: '%tarif%' }]
                    },
                    title: {
                        [sequelize_1.Op.ne]: null
                    },
                    slug: {
                        [sequelize_1.Op.eq]: null
                    }
                }
            });
            let result = "";
            for (let i = 0; i < resources.length; i++) {
                if (resources[i].title && !resources[i].slug) {
                    (resources[i].slug = helper_1.default.slugify(resources[i].title));
                    try {
                        yield resources[i].save();
                    }
                    catch (err) {
                        result += err.message;
                    }
                }
            }
            this.res && this.res.send(result);
        });
    }
    viewTarifFoodRoute() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.req.params.item) {
                return this.next();
            }
            let where = {
                type: ['product-videos', 'product-photos'],
                tag1: {
                    [sequelize_1.Op.or]: [{
                            [sequelize_1.Op.like]: '%yemek%'
                        }, { [sequelize_1.Op.like]: '%tarif%' }]
                }
            };
            if (isNaN(parseInt(this.req.params.item)))
                where['slug'] = this.req.params.item;
            else
                where['id'] = parseInt(this.req.params.item);
            let resources = yield new product_1.default(this.constructorParams).getResources(where, null);
            if (resources.length == 0)
                return this.next();
            let resource = resources[0];
            var products = [resource.product].concat(resource.otherProducts);
            var defaultDesc = resource.tag1 ?
                (resource.tag1.includes('tarif') ? `Nasıl yapılır tarif videosu` : ``) :
                "";
            let pageDesc = resource.tag1.includes('tarif') ?
                `${resource.title} yapmak için ${products.map(p => p.name).join(', ')} ${products.length == 1 ? 'ürünümüzü' : 'ürünlerimizi'} şimdi sipariş verin, kapınıza gelsin!` :
                `${resource.title} yapmak için ${products.map(p => p.name).join(', ')} uygun etlerdendir. En lezzetli halleriyle kasaptanAl.com'dan şimdi sipariş verin, kapınıza gelsin!`;
            let thumbnail = resource.contentType == 'video-youtube' ? (resource.thumbnailUrl ? resource.getThumbnailFileUrl() : null) : resource.getThumbnailFileUrl();
            this.res.render('pages/food-tarif-view.ejs', this.viewData({
                resource: resource,
                products: products,
                pageThumbnail: thumbnail,
                defaultDesc: defaultDesc,
                pageTitle: resource.tag1.includes('tarif') ? `${resource.title} en kısa ve net tarifi` : `${resource.title} uygun et ve malzemeler`,
                pageDescription: pageDesc
            }));
        });
    }
    static SetRoutes(router) {
        router.get("/resource/fill", Route.BindRequest(Route.prototype.fillSlugs));
        router.get("/resource/:id", Route.BindRequest(Route.prototype.viewRoute));
        //router.get("/et-yemek-tarifleri/:item", Route.BindRequest(Route.prototype.viewTarifFoodRoute));
        router.get("/et-yemekleri/:item", Route.BindRequest(Route.prototype.viewTarifFoodRoute));
    }
}
__decorate([
    common_1.Auth.Anonymous(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], Route.prototype, "viewRoute", null);
__decorate([
    common_1.Auth.Anonymous(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], Route.prototype, "fillSlugs", null);
__decorate([
    common_1.Auth.Anonymous(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], Route.prototype, "viewTarifFoodRoute", null);
exports.default = Route;
