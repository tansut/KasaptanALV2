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
const product_1 = require("./product");
const category_1 = require("./category");
const subcategory_1 = require("./subcategory");
let ProductCategory = class ProductCategory extends basemodel_1.default {
};
__decorate([
    sequelize_typescript_1.ForeignKey(() => product_1.default),
    __metadata("design:type", Number)
], ProductCategory.prototype, "productid", void 0);
__decorate([
    sequelize_typescript_1.BelongsTo(() => product_1.default, "productid"),
    __metadata("design:type", product_1.default)
], ProductCategory.prototype, "product", void 0);
__decorate([
    sequelize_typescript_1.ForeignKey(() => category_1.default),
    __metadata("design:type", Number)
], ProductCategory.prototype, "categoryid", void 0);
__decorate([
    sequelize_typescript_1.BelongsTo(() => category_1.default, "categoryid"),
    __metadata("design:type", category_1.default)
], ProductCategory.prototype, "category", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: true,
    }),
    __metadata("design:type", Number)
], ProductCategory.prototype, "displayOrder", void 0);
__decorate([
    sequelize_typescript_1.ForeignKey(() => category_1.default),
    __metadata("design:type", Number)
], ProductCategory.prototype, "subcategoryid", void 0);
__decorate([
    sequelize_typescript_1.BelongsTo(() => subcategory_1.default, "subcategoryid"),
    __metadata("design:type", subcategory_1.default)
], ProductCategory.prototype, "subcategory", void 0);
ProductCategory = __decorate([
    sequelize_typescript_1.Table({
        tableName: "ProductCategories",
        indexes: [{
                name: "productcategory_idx",
                fields: ["productid", "categoryid"],
                unique: true
            }]
    })
], ProductCategory);
exports.default = ProductCategory;
