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
const shoplist_1 = require("./shoplist");
const product_1 = require("./product");
let ShopListItem = class ShopListItem extends basemodel_1.default {
};
__decorate([
    sequelize_typescript_1.ForeignKey(() => shoplist_1.default),
    __metadata("design:type", Number)
], ShopListItem.prototype, "listid", void 0);
__decorate([
    sequelize_typescript_1.BelongsTo(() => shoplist_1.default, "listid"),
    __metadata("design:type", shoplist_1.default)
], ShopListItem.prototype, "list", void 0);
__decorate([
    sequelize_typescript_1.ForeignKey(() => product_1.default),
    __metadata("design:type", Number)
], ShopListItem.prototype, "productid", void 0);
__decorate([
    sequelize_typescript_1.BelongsTo(() => product_1.default, "productid"),
    __metadata("design:type", product_1.default)
], ShopListItem.prototype, "product", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: true,
    }),
    __metadata("design:type", String)
], ShopListItem.prototype, "note", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: true,
    }),
    __metadata("design:type", String)
], ShopListItem.prototype, "poUnit", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: false,
        type: sequelize_typescript_1.DataType.DECIMAL(13, 2)
    }),
    __metadata("design:type", Number)
], ShopListItem.prototype, "quantity", void 0);
ShopListItem = __decorate([
    sequelize_typescript_1.Table({
        tableName: "ShopListItems",
        indexes: [{
                name: "listid_idx",
                fields: ["listid"]
            }]
    })
], ShopListItem);
exports.default = ShopListItem;
