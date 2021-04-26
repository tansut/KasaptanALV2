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
var ShopList_1;
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_typescript_1 = require("sequelize-typescript");
const basemodel_1 = require("./basemodel");
const user_1 = require("./user");
const butcher_1 = require("./butcher");
const shoplistitem_1 = require("./shoplistitem");
let ShopList = ShopList_1 = class ShopList extends basemodel_1.default {
    static fromOrder(o) {
        let s = new ShopList_1();
        s.userid = o.userId;
        s.butcherid = o.butcherid;
        s.items = [];
        o.items.forEach(oi => {
            let item = new shoplistitem_1.default();
            item.list = s;
            item.productid = oi.productid;
            item.note = oi.note;
            item.poUnit = oi.pounit;
            item.quantity = oi.quantity;
            s.items.push(item);
        });
        return s;
    }
};
__decorate([
    sequelize_typescript_1.ForeignKey(() => user_1.default),
    __metadata("design:type", Number)
], ShopList.prototype, "userid", void 0);
__decorate([
    sequelize_typescript_1.BelongsTo(() => user_1.default, "userid"),
    __metadata("design:type", user_1.default)
], ShopList.prototype, "user", void 0);
__decorate([
    sequelize_typescript_1.ForeignKey(() => butcher_1.default),
    __metadata("design:type", Number)
], ShopList.prototype, "butcherid", void 0);
__decorate([
    sequelize_typescript_1.BelongsTo(() => butcher_1.default, "butcherid"),
    __metadata("design:type", butcher_1.default)
], ShopList.prototype, "butcher", void 0);
__decorate([
    sequelize_typescript_1.HasMany(() => shoplistitem_1.default, {
        sourceKey: "id",
        foreignKey: "listid",
    }),
    __metadata("design:type", Array)
], ShopList.prototype, "items", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: true,
    }),
    __metadata("design:type", String)
], ShopList.prototype, "name", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: true,
    }),
    __metadata("design:type", String)
], ShopList.prototype, "ordernote", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: true,
    }),
    __metadata("design:type", String)
], ShopList.prototype, "desc", void 0);
ShopList = ShopList_1 = __decorate([
    sequelize_typescript_1.Table({
        tableName: "ShopLists",
        indexes: [{
                name: "userid_idx",
                fields: ["userid"]
            }]
    })
], ShopList);
exports.default = ShopList;
