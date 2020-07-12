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
const category_1 = require("./category");
let PriceCategory = class PriceCategory extends basemodel_1.default {
};
__decorate([
    sequelize_typescript_1.Column({
        allowNull: false,
    }),
    __metadata("design:type", String)
], PriceCategory.prototype, "name", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: false,
        defaultValue: 'generic'
    }),
    __metadata("design:type", String)
], PriceCategory.prototype, "type", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: false,
    }),
    __metadata("design:type", String)
], PriceCategory.prototype, "slug", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: true,
    }),
    __metadata("design:type", String)
], PriceCategory.prototype, "pageTitle", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: true,
    }),
    __metadata("design:type", String)
], PriceCategory.prototype, "pageDescription", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: true,
        type: sequelize_typescript_1.DataType.TEXT
    }),
    __metadata("design:type", String)
], PriceCategory.prototype, "shortdesc", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: true,
        type: sequelize_typescript_1.DataType.TEXT
    }),
    __metadata("design:type", String)
], PriceCategory.prototype, "mddesc", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: true,
    }),
    __metadata("design:type", Number)
], PriceCategory.prototype, "displayOrder", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: false,
        defaultValue: 'active'
    }),
    __metadata("design:type", String)
], PriceCategory.prototype, "status", void 0);
__decorate([
    sequelize_typescript_1.ForeignKey(() => category_1.default),
    __metadata("design:type", Number)
], PriceCategory.prototype, "categoryid", void 0);
__decorate([
    sequelize_typescript_1.BelongsTo(() => category_1.default, "categoryid"),
    __metadata("design:type", category_1.default)
], PriceCategory.prototype, "category", void 0);
PriceCategory = __decorate([
    sequelize_typescript_1.Table({
        tableName: "PriceCategories",
        indexes: [{
                name: "slug_idx",
                fields: ["slug"],
                unique: true
            },
            { type: 'FULLTEXT', name: 'price_category_fts', fields: ['name', 'shortdesc', 'slug'] }]
    })
], PriceCategory);
exports.default = PriceCategory;

//# sourceMappingURL=pricecategory.js.map
