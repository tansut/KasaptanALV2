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
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_typescript_1 = require("sequelize-typescript");
const basemodel_1 = require("./basemodel");
const resourcecategory_1 = require("./resourcecategory");
const config_1 = require("../../config");
let Resource = class Resource extends basemodel_1.default {
    constructor() {
        super(...arguments);
        this.otherProducts = [];
    }
    get settings() {
        return this.settingsjson ? JSON.parse(this.getDataValue('settingsjson')) : null;
    }
    set settings(value) {
        this.setDataValue('settingsjson', JSON.stringify(value));
    }
    asView() {
        return {
            id: this.id,
            title: this.title,
            tag1: this.tag1,
            // thumbnailUrl: (this.thumbnailUrl ? this.thumbnailFileUrl: null) ||  `${Helper.imgUrl('product-photos', this.product.slug)}` ,
            thumbnailUrl: this.thumbnailFileUrl,
            settings: this.settingsByRef
        };
    }
    getRef(id) {
        if (this.product) {
            if (this.ref1 == id)
                return 1;
            if (this.ref2 == id)
                return 2;
            if (this.ref3 == id)
                return 3;
            if (this.ref4 == id)
                return 4;
            if (this.ref5 == id)
                return 5;
            if (this.ref6 == id)
                return 6;
        }
        else
            return 0;
    }
    getSettingsByRefId(id) {
        let settings = this.settings || {};
        return settings[`ref${this.getRef(id)}`];
    }
    get settingsByRef() {
        if (this.product) {
            return this.getSettingsByRefId(this.product.id) || this.settings || {};
        }
        else
            return {};
    }
    get fileUrl() {
        return this.getFileUrl();
    }
    get thumbnailFileUrl() {
        return this.getThumbnailFileUrl();
    }
    getFileUrl() {
        if (this.contentType == 'image/jpeg')
            return `${config_1.default.staticDomain}/${this.folder}/${this.contentUrl}`;
        else
            return `https://www.youtube.com/watch?v=${this.contentUrl}`;
    }
    getThumbnailFileUrl(ignoreThumbnail = false) {
        if (this.contentType == 'image/jpeg') {
            return `${config_1.default.staticDomain}/${this.folder}/${this.thumbnailUrl}`;
        }
        else if (this.thumbnailUrl && !ignoreThumbnail) {
            return `${config_1.default.staticDomain}${this.thumbnailUrl}`;
        }
        else
            return `https://img.youtube.com/vi/${this.contentUrl}/maxresdefault.jpg`;
    }
};
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", String)
], Resource.prototype, "keywords", void 0);
__decorate([
    sequelize_typescript_1.HasMany(() => resourcecategory_1.default, {
        sourceKey: "id",
        foreignKey: "resourceid"
    }),
    __metadata("design:type", Array)
], Resource.prototype, "categories", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: false,
    }),
    __metadata("design:type", String)
], Resource.prototype, "type", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: true
    }),
    __metadata("design:type", String)
], Resource.prototype, "slug", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: false,
        defaultValue: true
    }),
    __metadata("design:type", Boolean)
], Resource.prototype, "list", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: true,
        type: sequelize_typescript_1.DataType.TEXT
    }),
    __metadata("design:type", String)
], Resource.prototype, "mddesc", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: true
    }),
    __metadata("design:type", String)
], Resource.prototype, "w", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: true
    }),
    __metadata("design:type", String)
], Resource.prototype, "h", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: false,
    }),
    __metadata("design:type", Number)
], Resource.prototype, "ref1", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", Number)
], Resource.prototype, "ref2", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", Number)
], Resource.prototype, "ref3", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", Number)
], Resource.prototype, "ref4", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", Number)
], Resource.prototype, "ref5", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", Number)
], Resource.prototype, "ref6", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", String)
], Resource.prototype, "contentType", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", Number)
], Resource.prototype, "contentLength", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", String)
], Resource.prototype, "title", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", String)
], Resource.prototype, "contentUrl", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", String)
], Resource.prototype, "thumbnailUrl", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", Boolean)
], Resource.prototype, "isdefault", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", Number)
], Resource.prototype, "displayOrder", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", String)
], Resource.prototype, "folder", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", String)
], Resource.prototype, "tag1", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", String)
], Resource.prototype, "tag1Desc", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", String)
], Resource.prototype, "tag2", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", String)
], Resource.prototype, "tag2Desc", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", String)
], Resource.prototype, "tag3", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", String)
], Resource.prototype, "tag3Desc", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", String)
], Resource.prototype, "badge", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", String)
], Resource.prototype, "description", void 0);
__decorate([
    sequelize_typescript_1.Column({
        type: sequelize_typescript_1.DataType.TEXT
    }),
    __metadata("design:type", String)
], Resource.prototype, "settingsjson", void 0);
Resource = __decorate([
    sequelize_typescript_1.Table({
        tableName: "Resources",
        indexes: [{
                name: "type_ref1_idx",
                fields: ["type", "ref1"]
            },
            {
                name: "type_ref2_idx",
                fields: ["type", "ref2"]
            },
            {
                name: "type_ref3_idx",
                fields: ["type", "ref3"]
            },
            {
                name: "type_ref4_idx",
                fields: ["type", "ref4"]
            },
            {
                name: "type_ref5_idx",
                fields: ["type", "ref5"]
            },
            {
                name: "type_ref6_idx",
                fields: ["type", "ref6"]
            },
            {
                name: "slug_idx",
                fields: ["slug"],
                unique: true
            },
            {
                name: "type_content_idx",
                fields: ["type", "contentUrl"]
            },
            { type: 'FULLTEXT', name: 'resource_fts', fields: ['title', 'description', 'slug', 'keywords'] }]
    })
], Resource);
exports.default = Resource;

//# sourceMappingURL=resource.js.map
