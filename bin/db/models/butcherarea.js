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
const butcher_1 = require("./butcher");
const area_1 = require("./area");
let ButcherArea = class ButcherArea extends basemodel_1.default {
};
__decorate([
    sequelize_typescript_1.ForeignKey(() => butcher_1.default),
    __metadata("design:type", Number)
], ButcherArea.prototype, "butcherid", void 0);
__decorate([
    sequelize_typescript_1.BelongsTo(() => butcher_1.default, "butcherid"),
    __metadata("design:type", butcher_1.default)
], ButcherArea.prototype, "butcher", void 0);
__decorate([
    sequelize_typescript_1.ForeignKey(() => area_1.default),
    __metadata("design:type", Number)
], ButcherArea.prototype, "areaid", void 0);
__decorate([
    sequelize_typescript_1.BelongsTo(() => area_1.default, "areaid"),
    __metadata("design:type", area_1.default)
], ButcherArea.prototype, "area", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: true
    }),
    __metadata("design:type", String)
], ButcherArea.prototype, "name", void 0);
__decorate([
    sequelize_typescript_1.Column({
        type: sequelize_typescript_1.DataType.DECIMAL(5, 1)
    }),
    __metadata("design:type", Number)
], ButcherArea.prototype, "kmDirect", void 0);
__decorate([
    sequelize_typescript_1.Column({
        type: sequelize_typescript_1.DataType.DECIMAL(5, 1)
    }),
    __metadata("design:type", Number)
], ButcherArea.prototype, "kmGoogle", void 0);
__decorate([
    sequelize_typescript_1.Column({
        type: sequelize_typescript_1.DataType.DECIMAL(5, 1)
    }),
    __metadata("design:type", Number)
], ButcherArea.prototype, "kmActive", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: true,
        type: sequelize_typescript_1.DataType.TEXT
    }),
    __metadata("design:type", String)
], ButcherArea.prototype, "googleData", void 0);
ButcherArea = __decorate([
    sequelize_typescript_1.Table({
        tableName: "ButcherAreas",
        indexes: [
            {
                name: "butcher_area_idx",
                fields: ["butcherid", "areaid"],
                unique: true
            }
        ]
    })
], ButcherArea);
exports.default = ButcherArea;
