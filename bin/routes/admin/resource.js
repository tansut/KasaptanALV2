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
const router_1 = require("../../lib/router");
const common_1 = require("../../lib/common");
const resource_1 = require("../../db/models/resource");
const helper_1 = require("../../lib/helper");
const fs = require("fs");
const category_1 = require("../../db/models/category");
const resourcecategory_1 = require("../../db/models/resourcecategory");
var beautify = require("json-beautify");
class Route extends router_1.ViewRouter {
    constructor() {
        super(...arguments);
        this.categories = [];
        this.beautify = beautify;
    }
    getResources() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield resource_1.default.findAll({
                where: {
                    type: [this.req.params.type, this.req.query.videotype],
                    ref1: this.req.params.ref1
                },
                include: [
                    {
                        all: true
                    }
                ],
                order: [["type", "ASC"], ["displayOrder", "DESC"], ["updatedOn", "DESC"]]
            });
        });
    }
    getResourceCategory(resource, categoryid) {
        let productCategory = resource.categories.find(c => c.categoryid == categoryid);
        return productCategory ? {
            displayOrder: productCategory.displayOrder,
            enabled: true,
            productCategory: productCategory
        } : {
            displayOrder: "",
            enabled: false
        };
    }
    editViewRoute() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.req.params.type || !this.req.params.ref1) {
                return this.next();
            }
            let resources = yield this.getResources();
            this.categories = yield this.getCategories();
            this.res.render('pages/admin/resource.get.ejs', this.viewData({ images: resources }));
        });
    }
    addVideo(youtubeid) {
        return __awaiter(this, void 0, void 0, function* () {
            let res = yield resource_1.default.create({
                type: this.req.query.videotype,
                ref1: this.req.params.ref1,
                contentType: "video-youtube",
                contentLength: 0,
                contentUrl: youtubeid,
                thumbnailUrl: "",
                folder: ""
            });
            return res;
        });
    }
    normalizeResourcePhoto(id) {
        return __awaiter(this, void 0, void 0, function* () {
            let resource = yield resource_1.default.findByPk(id);
            let filedest = helper_1.default.ResourcePaths[this.req.params.type];
            yield helper_1.default.normalizePhoto(this.publicDir + `${filedest}/${resource.contentUrl}`, this.publicDir + `${filedest}/${resource.thumbnailUrl}`);
        });
    }
    addPhoto(photofile) {
        return __awaiter(this, void 0, void 0, function* () {
            let resources = yield this.getResources();
            return new Promise((resolve, reject) => {
                let fileprefix = this.req.query.fileprefix || "";
                let filedest = helper_1.default.ResourcePaths[this.req.params.type];
                let random = helper_1.default.getRandomInt(1000);
                let fileName = `${fileprefix}-${this.req.params.ref1}-${resources.length + 1}-${random}.jpg`;
                let dest = this.publicDir + `${filedest}/${fileName}`;
                let thumbnailName = `${fileprefix}-${this.req.params.ref1}-${resources.length + 1}-${random}-thumbnail.jpg`;
                photofile.mv(dest, (err) => {
                    if (err)
                        return reject(err);
                    return resource_1.default.create({
                        type: this.req.params.type,
                        ref1: this.req.params.ref1,
                        contentType: "image/jpeg",
                        contentLength: photofile.size,
                        contentUrl: fileName,
                        thumbnailUrl: thumbnailName,
                        folder: filedest
                    }).then((res) => {
                        return helper_1.default.normalizePhoto(this.publicDir + `${filedest}/${fileName}`, this.publicDir + `${filedest}/${thumbnailName}`).then(() => resolve(res)).catch((e) => reject(e));
                    }).catch(err => reject(err));
                });
            });
        });
    }
    getCategories() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield category_1.default.findAll({
                where: {
                    type: 'resource'
                }
            });
        });
    }
    saveRoute() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.req.params.type || !this.req.params.ref1) {
                return this.next();
            }
            let resources = yield this.getResources();
            this.categories = yield this.getCategories();
            if (this.req.body.delimage) {
                let id = parseInt(this.req.body.delimage);
                let resource = yield resource_1.default.findByPk(id);
                yield resource_1.default.destroy({
                    where: {
                        id: id
                    }
                });
                if (resource.contentType == 'image/jpeg') {
                    fs.existsSync(this.publicDir + resource.getFileUrl()) ? fs.unlinkSync(this.publicDir + resource.getFileUrl()) : null;
                    (resource.thumbnailUrl && fs.existsSync(this.publicDir + resource.getThumbnailFileUrl())) ? fs.unlinkSync(this.publicDir + resource.getThumbnailFileUrl()) : null;
                }
            }
            else if (this.req.body.updatecategory) {
                let categoryid = parseInt(this.req.body.updatecategory);
                let id = parseInt(this.req.body['resourceid' + categoryid]);
                let resource = yield resource_1.default.findByPk(id);
                yield resourcecategory_1.default.destroy({
                    where: {
                        resourceid: resource.id,
                        categoryid: categoryid
                    }
                });
                if (this.req.body['categoryenabled' + categoryid] == "on") {
                    let newItem = new resourcecategory_1.default();
                    newItem.resourceid = resource.id;
                    newItem.categoryid = categoryid;
                    newItem.displayOrder = (this.req.body['categorydisplayorder' + categoryid] ? parseInt(this.req.body['categorydisplayorder' + categoryid]) : 0);
                    yield newItem.save();
                }
            }
            else if (this.req.body.pritimage) {
                let id = parseInt(this.req.body.pritimage);
                let resource = resources.find((res) => res.id == id);
                resource.changed('type', true);
                yield resource.save();
            }
            else if (this.req.body.resizeimage) {
                let id = parseInt(this.req.body.resizeimage);
                yield this.normalizeResourcePhoto(id);
            }
            else if (this.req.body.saveimage) {
                let id = parseInt(this.req.body.saveimage);
                let resource = resources.find((res) => res.id == id);
                resource.title = this.req.body['imgtitle' + id] || null;
                resource.slug = this.req.body['imgslug' + id] || null;
                resource.tag1 = this.req.body['imgtag1' + id] || null;
                resource.displayOrder = this.req.body['imgdisplayorder' + id] ? parseInt(this.req.body['imgdisplayorder' + id]) : 0;
                resource.tag2 = this.req.body['imgtag2' + id];
                resource.tag3 = this.req.body['imgtag3' + id];
                resource.keywords = this.req.body['keywords' + id];
                resource.description = this.req.body['imgdesc' + id];
                resource.badge = this.req.body['imgbadge' + id];
                resource.settings = this.req.body['imgsettings' + id] ? JSON.parse(this.req.body['imgsettings' + id]) : {};
                resource.mddesc = this.req.body['imgmddesc' + id];
                resource.ref2 = this.req.body['imgref1' + id] ? parseInt(this.req.body['imgref1' + id]) : null;
                resource.ref2 = this.req.body['imgref2' + id] ? parseInt(this.req.body['imgref2' + id]) : null;
                resource.ref3 = this.req.body['imgref3' + id] ? parseInt(this.req.body['imgref3' + id]) : null;
                resource.ref4 = this.req.body['imgref4' + id] ? parseInt(this.req.body['imgref4' + id]) : null;
                resource.ref5 = this.req.body['imgref5' + id] ? parseInt(this.req.body['imgref5' + id]) : null;
                resource.ref6 = this.req.body['imgref6' + id] ? parseInt(this.req.body['imgref6' + id]) : null;
                resource.list = this.req.body['imglist' + id] == "on";
                if (resource.contentType != "image/jpeg" && (resource.thumbnailUrl != this.req.body['imgthumbnail' + id])) {
                    resource.thumbnailUrl = this.req.body['imgthumbnail' + id];
                }
                yield resource.save();
            }
            else if (this.req.body.addimg && this.req["files"] && Object.keys(this.req["files"]).length != 0) {
                let photofile = this.req["files"].photofile;
                yield this.addPhoto(photofile);
            }
            else if (this.req.body.addvideo && this.req.body.youtubeid) {
                yield this.addVideo(this.req.body.youtubeid);
            }
            resources = yield this.getResources();
            this.res.render('pages/admin/resource.get.ejs', this.viewData({ images: resources }));
        });
    }
    static SetRoutes(router) {
        router.get("/resource/:type/:ref1", Route.BindRequest(Route.prototype.editViewRoute));
        router.post("/resource/:type/:ref1", Route.BindRequest(Route.prototype.saveRoute));
    }
}
__decorate([
    common_1.Auth.Anonymous(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], Route.prototype, "editViewRoute", null);
__decorate([
    common_1.Auth.Anonymous(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], Route.prototype, "saveRoute", null);
exports.default = Route;

//# sourceMappingURL=resource.js.map
