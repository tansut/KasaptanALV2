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
var Area_1;
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_typescript_1 = require("sequelize-typescript");
const basemodel_1 = require("./basemodel");
const helper_1 = require("../../lib/helper");
const google_1 = require("../../lib/google");
const email_1 = require("../../lib/email");
let Area = Area_1 = class Area extends basemodel_1.default {
    static NormalizeNames() {
        return __awaiter(this, void 0, void 0, function* () {
            let areas = yield Area_1.findAll();
            for (let i = 0; i < areas.length; i++) {
                const el = areas[i];
                el.name = helper_1.default.capitlize(helper_1.default.toLower(el.name));
                let r = yield el.save();
            }
            return areas;
        });
    }
    static getBySlug(slug) {
        return __awaiter(this, void 0, void 0, function* () {
            return Area_1.findOne({
                where: {
                    slug: slug
                }
            });
        });
    }
    ensureLocation() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.locationData) {
                try {
                    let addres = yield this.getPreferredAddress();
                    let data = yield google_1.Google.getLocationResult(addres.display);
                    this.locationData = JSON.stringify(data);
                    let geo = google_1.Google.convertLocationResult(data);
                    if (geo.length > 0) {
                        this.location = geo[0].location;
                        this.placeid = geo[0].placeid;
                        this.locationType = geo[0].locationType;
                        this.northeast = geo[0].viewport.northeast;
                        this.southwest = geo[0].viewport.southwest;
                        yield this.save();
                    }
                }
                catch (err) {
                    email_1.default.send('tansut@gmail.com', 'hata/ensurelocation', "error.ejs", {
                        text: err.message,
                        stack: err.stack
                    });
                }
            }
        });
    }
    getPreferredAddress() {
        return __awaiter(this, void 0, void 0, function* () {
            let res;
            if (this.level == 1) {
                res = {
                    level1Id: this.id,
                    level1Slug: this.slug,
                    level1Text: this.name,
                    display: this.name,
                    level1Status: this.status
                };
            }
            else if (this.level == 2) {
                let parent = this.parent || (yield Area_1.findByPk(this.parentid));
                res = {
                    level1Id: parent.id,
                    level1Slug: parent.slug,
                    level1Text: parent.name,
                    level1Status: parent.status,
                    level2Id: this.id,
                    level2Slug: this.slug,
                    level2Text: this.name,
                    level2Status: this.status,
                    display: this.name + '/' + parent.name
                };
            }
            else if (this.level == 3) {
                let parentOfParent, parent;
                parentOfParent = this.parent && this.parent.parent;
                if (parentOfParent == null) {
                    parent = this.parent || (yield Area_1.findByPk(this.parentid));
                    parentOfParent = parent.parent || (yield Area_1.findByPk(parent.parentid));
                }
                res = {
                    level1Id: parentOfParent.id,
                    level1Slug: parentOfParent.slug,
                    level1Text: parentOfParent.name,
                    level1Status: parentOfParent.status,
                    level2Id: parent.id,
                    level2Slug: parent.slug,
                    level2Text: parent.name,
                    level2Status: parent.status,
                    level3Id: this.id,
                    level3Slug: this.slug,
                    level3Text: this.name,
                    level3Status: this.status,
                    display: this.name + ', ' + parent.name + '/' + parentOfParent.name
                };
            }
            else {
                let parentOfParent2, parentOfParent, parent;
                parentOfParent = this.parent && this.parent.parent;
                if (parentOfParent == null) {
                    parent = this.parent || (yield Area_1.findByPk(this.parentid));
                    parentOfParent = parent.parent || (yield Area_1.findByPk(parent.parentid));
                    parentOfParent2 = parentOfParent.parent || (yield Area_1.findByPk(parentOfParent.parentid));
                }
                res = {
                    level1Id: parentOfParent2.id,
                    level1Slug: parentOfParent2.slug,
                    level1Text: parentOfParent2.name,
                    level1Status: parentOfParent2.status,
                    level2Id: parentOfParent.id,
                    level2Slug: parentOfParent.slug,
                    level2Text: parentOfParent.name,
                    level2Status: parentOfParent.status,
                    level3Id: parent.id,
                    level3Slug: parent.slug,
                    level3Text: parent.name,
                    level3Status: parent.status,
                    level4Id: this.id,
                    level4Slug: this.slug,
                    level4Text: this.name,
                    level4Status: this.status,
                    display: this.name + ', ' + parent.name + ', ' + parentOfParent.name + '/' + parentOfParent2.name
                };
            }
            return res;
        });
    }
};
__decorate([
    sequelize_typescript_1.Column({
        allowNull: true,
        type: sequelize_typescript_1.DataType.GEOMETRY('POINT')
    }),
    __metadata("design:type", Object)
], Area.prototype, "location", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", String)
], Area.prototype, "locationType", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: true,
        type: sequelize_typescript_1.DataType.GEOMETRY('POINT')
    }),
    __metadata("design:type", Object)
], Area.prototype, "northeast", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: true,
        type: sequelize_typescript_1.DataType.GEOMETRY('POINT')
    }),
    __metadata("design:type", Object)
], Area.prototype, "southwest", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", String)
], Area.prototype, "placeid", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", String)
], Area.prototype, "dispatchTag", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: true,
        type: sequelize_typescript_1.DataType.TEXT
    }),
    __metadata("design:type", String)
], Area.prototype, "locationData", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: false,
    }),
    __metadata("design:type", String)
], Area.prototype, "name", void 0);
__decorate([
    sequelize_typescript_1.Column({
        type: sequelize_typescript_1.DataType.TEXT
    }),
    __metadata("design:type", String)
], Area.prototype, "keywords", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: false,
        defaultValue: 0
    }),
    __metadata("design:type", Number)
], Area.prototype, "displayOrder", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: false,
        defaultValue: 'generic'
    }),
    __metadata("design:type", String)
], Area.prototype, "status", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: true,
    }),
    __metadata("design:type", String)
], Area.prototype, "code", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: false,
    }),
    __metadata("design:type", String)
], Area.prototype, "slug", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: false,
    }),
    __metadata("design:type", String)
], Area.prototype, "lowerName", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: true
    }),
    __metadata("design:type", String)
], Area.prototype, "display", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: false
    }),
    __metadata("design:type", Number)
], Area.prototype, "level", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: true
    }),
    __metadata("design:type", Number)
], Area.prototype, "selectionRadius", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: true
    }),
    sequelize_typescript_1.ForeignKey(() => Area_1),
    __metadata("design:type", Number)
], Area.prototype, "parentid", void 0);
__decorate([
    sequelize_typescript_1.BelongsTo(() => Area_1),
    __metadata("design:type", Area)
], Area.prototype, "parent", void 0);
Area = Area_1 = __decorate([
    sequelize_typescript_1.Table({
        tableName: "Areas",
        indexes: [{
                name: "lowerName_idx",
                fields: ["lowerName"]
            },
            {
                name: "slug_level_idx",
                fields: ["slug"],
                unique: true
            },
            { type: 'FULLTEXT', name: 'area_fts', fields: ['name', 'slug', 'keywords'] }]
    })
], Area);
exports.default = Area;
