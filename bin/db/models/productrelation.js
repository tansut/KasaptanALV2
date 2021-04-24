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
let ProductRelation = class ProductRelation extends basemodel_1.default {
};
__decorate([
    sequelize_typescript_1.ForeignKey(() => product_1.default),
    __metadata("design:type", Number)
], ProductRelation.prototype, "productid1", void 0);
__decorate([
    sequelize_typescript_1.BelongsTo(() => product_1.default, "productid1"),
    __metadata("design:type", product_1.default)
], ProductRelation.prototype, "product1", void 0);
__decorate([
    sequelize_typescript_1.ForeignKey(() => product_1.default),
    __metadata("design:type", Number)
], ProductRelation.prototype, "productid2", void 0);
__decorate([
    sequelize_typescript_1.BelongsTo(() => product_1.default, "productid2"),
    __metadata("design:type", product_1.default)
], ProductRelation.prototype, "product2", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: true
    }),
    __metadata("design:type", Number)
], ProductRelation.prototype, "displayOrder", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: false,
        defaultValue: 'price'
    }),
    __metadata("design:type", String)
], ProductRelation.prototype, "relation", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: true
    }),
    __metadata("design:type", String)
], ProductRelation.prototype, "note", void 0);
ProductRelation = __decorate([
    sequelize_typescript_1.Table({
        tableName: "ProductRelations",
        indexes: [{
                name: "product_idx",
                fields: ["productid1", "productid2"],
                unique: true
            }]
    })
], ProductRelation);
exports.default = ProductRelation;
