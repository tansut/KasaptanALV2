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
let Kurban = class Kurban extends basemodel_1.default {
};
__decorate([
    sequelize_typescript_1.ForeignKey(() => butcher_1.default),
    __metadata("design:type", Number)
], Kurban.prototype, "butcherid", void 0);
__decorate([
    sequelize_typescript_1.BelongsTo(() => butcher_1.default, "butcherid"),
    __metadata("design:type", butcher_1.default)
], Kurban.prototype, "butcher", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: false,
        defaultValue: 0,
        type: sequelize_typescript_1.DataType.INTEGER
    }),
    __metadata("design:type", Number)
], Kurban.prototype, "availableHisse", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: false,
        defaultValue: 0,
        type: sequelize_typescript_1.DataType.INTEGER
    }),
    __metadata("design:type", Number)
], Kurban.prototype, "totalHisse", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: false,
        defaultValue: 0,
        type: sequelize_typescript_1.DataType.INTEGER
    }),
    __metadata("design:type", Number)
], Kurban.prototype, "kg", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: false,
        defaultValue: 'buyukbas'
    }),
    __metadata("design:type", String)
], Kurban.prototype, "kurbanType", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: false,
        defaultValue: 'ship'
    }),
    __metadata("design:type", String)
], Kurban.prototype, "teslimType", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: false,
        defaultValue: 2,
        type: sequelize_typescript_1.DataType.INTEGER
    }),
    __metadata("design:type", Number)
], Kurban.prototype, "teslimGun", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: false,
        type: sequelize_typescript_1.DataType.DECIMAL(13, 2)
    }),
    __metadata("design:type", Number)
], Kurban.prototype, "kgPrice", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: false
    }),
    __metadata("design:type", String)
], Kurban.prototype, "cinsi", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: true
    }),
    __metadata("design:type", String)
], Kurban.prototype, "desc", void 0);
Kurban = __decorate([
    sequelize_typescript_1.Table({
        tableName: "Kurbans",
        indexes: [{
                name: "butcher_idx",
                fields: ["butcherid"]
            }]
    })
], Kurban);
exports.default = Kurban;
