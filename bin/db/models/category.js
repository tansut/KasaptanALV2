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
exports.CategorySubItemsMode = void 0;
const sequelize_typescript_1 = require("sequelize-typescript");
const basemodel_1 = require("./basemodel");
const productcategory_1 = require("./productcategory");
const subcategory_1 = require("./subcategory");
var CategorySubItemsMode;
(function (CategorySubItemsMode) {
    CategorySubItemsMode["none"] = "none";
    CategorySubItemsMode["tag1"] = "tag1";
    CategorySubItemsMode["subitems"] = "subitems";
    CategorySubItemsMode["subitemsasslider"] = "subitemsasslider";
    CategorySubItemsMode["subitemshiddenasslider"] = "subitemshiddenasslider";
})(CategorySubItemsMode = exports.CategorySubItemsMode || (exports.CategorySubItemsMode = {}));
let Category = class Category extends basemodel_1.default {
};
__decorate([
    sequelize_typescript_1.Column({
        allowNull: false,
    }),
    __metadata("design:type", String)
], Category.prototype, "name", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: true
    }),
    __metadata("design:type", String)
], Category.prototype, "listTitle", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: false,
        defaultValue: 'subitems'
    }),
    __metadata("design:type", String)
], Category.prototype, "subItemsMode", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: false,
    }),
    __metadata("design:type", String)
], Category.prototype, "type", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: true
    }),
    __metadata("design:type", String)
], Category.prototype, "searchhint", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", String)
], Category.prototype, "keywords", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: false,
    }),
    __metadata("design:type", String)
], Category.prototype, "slug", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: true
    }),
    __metadata("design:type", String)
], Category.prototype, "tarifTitle", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: true
    }),
    __metadata("design:type", String)
], Category.prototype, "tarifDesc", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: true
    }),
    __metadata("design:type", String)
], Category.prototype, "tarifPageTitle", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: true
    }),
    __metadata("design:type", String)
], Category.prototype, "tarifPageDesc", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: true
    }),
    __metadata("design:type", Number)
], Category.prototype, "relatedFoodCategory", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: true,
    }),
    __metadata("design:type", String)
], Category.prototype, "pageTitle", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: true,
    }),
    __metadata("design:type", String)
], Category.prototype, "pageDescription", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: true,
        type: sequelize_typescript_1.DataType.TEXT
    }),
    __metadata("design:type", String)
], Category.prototype, "shortdesc", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: true,
        type: sequelize_typescript_1.DataType.TEXT
    }),
    __metadata("design:type", String)
], Category.prototype, "mddesc", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: true,
    }),
    __metadata("design:type", Number)
], Category.prototype, "displayOrder", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: false,
        defaultValue: 'active'
    }),
    __metadata("design:type", String)
], Category.prototype, "status", void 0);
__decorate([
    sequelize_typescript_1.HasMany(() => productcategory_1.default, {
        sourceKey: "id",
        foreignKey: "categoryid",
        onDelete: "CASCADE"
    }),
    __metadata("design:type", Array)
], Category.prototype, "products", void 0);
__decorate([
    sequelize_typescript_1.HasMany(() => subcategory_1.default, {
        sourceKey: "id",
        foreignKey: "categoryid",
        onDelete: "CASCADE"
    }),
    __metadata("design:type", Array)
], Category.prototype, "subCategories", void 0);
Category = __decorate([
    sequelize_typescript_1.Table({
        tableName: "Categories",
        indexes: [{
                name: "slug_idx",
                fields: ["slug"],
                unique: true
            },
            { type: 'FULLTEXT', name: 'category_fts', fields: ['name', 'shortdesc', 'slug', 'keywords'] }]
    })
], Category);
exports.default = Category;

//# sourceMappingURL=category.js.map
