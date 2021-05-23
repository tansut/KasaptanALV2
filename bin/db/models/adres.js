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
const area_1 = require("./area");
const basemodel_1 = require("./basemodel");
const user_1 = require("./user");
let ShipAddress = class ShipAddress extends basemodel_1.default {
};
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", String)
], ShipAddress.prototype, "name", void 0);
__decorate([
    sequelize_typescript_1.ForeignKey(() => user_1.default),
    __metadata("design:type", Number)
], ShipAddress.prototype, "userid", void 0);
__decorate([
    sequelize_typescript_1.BelongsTo(() => user_1.default, "userid"),
    __metadata("design:type", user_1.default)
], ShipAddress.prototype, "user", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", String)
], ShipAddress.prototype, "address", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", String)
], ShipAddress.prototype, "bina", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", String)
], ShipAddress.prototype, "kat", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", String)
], ShipAddress.prototype, "tarif", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", String)
], ShipAddress.prototype, "daire", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: true,
        type: sequelize_typescript_1.DataType.GEOMETRY('POINT')
    }),
    __metadata("design:type", Object)
], ShipAddress.prototype, "lastLocation", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", String)
], ShipAddress.prototype, "lastLocationType", void 0);
__decorate([
    sequelize_typescript_1.ForeignKey(() => area_1.default),
    __metadata("design:type", Number)
], ShipAddress.prototype, "level1Id", void 0);
__decorate([
    sequelize_typescript_1.BelongsTo(() => area_1.default, "level1Id"),
    __metadata("design:type", Number)
], ShipAddress.prototype, "level1", void 0);
__decorate([
    sequelize_typescript_1.ForeignKey(() => area_1.default),
    __metadata("design:type", Number)
], ShipAddress.prototype, "level2Id", void 0);
__decorate([
    sequelize_typescript_1.BelongsTo(() => area_1.default, "level2Id"),
    __metadata("design:type", Number)
], ShipAddress.prototype, "level2", void 0);
__decorate([
    sequelize_typescript_1.ForeignKey(() => area_1.default),
    __metadata("design:type", Number)
], ShipAddress.prototype, "level3Id", void 0);
__decorate([
    sequelize_typescript_1.BelongsTo(() => area_1.default, "level3Id"),
    __metadata("design:type", Number)
], ShipAddress.prototype, "level3", void 0);
__decorate([
    sequelize_typescript_1.ForeignKey(() => area_1.default),
    __metadata("design:type", Number)
], ShipAddress.prototype, "level4Id", void 0);
__decorate([
    sequelize_typescript_1.BelongsTo(() => area_1.default, "level4Id"),
    __metadata("design:type", Number)
], ShipAddress.prototype, "level4", void 0);
ShipAddress = __decorate([
    sequelize_typescript_1.Table({
        tableName: "ShipAddresses",
        indexes: [{
                name: "user_idx",
                fields: ["userid"]
            }]
    })
], ShipAddress);
exports.default = ShipAddress;
