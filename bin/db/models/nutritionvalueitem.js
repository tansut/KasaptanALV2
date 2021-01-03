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
const nutritionvalue_1 = require("./nutritionvalue");
let NutritionValueItem = class NutritionValueItem extends basemodel_1.default {
};
__decorate([
    sequelize_typescript_1.ForeignKey(() => nutritionvalue_1.default),
    __metadata("design:type", Number)
], NutritionValueItem.prototype, "nutritionid", void 0);
__decorate([
    sequelize_typescript_1.BelongsTo(() => nutritionvalue_1.default, "nutritionid"),
    __metadata("design:type", nutritionvalue_1.default)
], NutritionValueItem.prototype, "nutritionValue", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: false
    }),
    __metadata("design:type", String)
], NutritionValueItem.prototype, "type", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: false
    }),
    __metadata("design:type", String)
], NutritionValueItem.prototype, "unit", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: false,
        type: sequelize_typescript_1.DataType.DECIMAL(7, 2)
    }),
    __metadata("design:type", Number)
], NutritionValueItem.prototype, "amount", void 0);
NutritionValueItem = __decorate([
    sequelize_typescript_1.Table({
        tableName: "NutritionValueItems",
        indexes: []
    })
], NutritionValueItem);
exports.default = NutritionValueItem;
