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
exports.DispatcherSelection = void 0;
const sequelize_typescript_1 = require("sequelize-typescript");
const basemodel_1 = require("./basemodel");
const helper_1 = require("../../lib/helper");
const area_1 = require("./area");
const butcher_1 = require("./butcher");
const order_1 = require("./order");
var DispatcherSelection;
(function (DispatcherSelection) {
    DispatcherSelection["full"] = "tam";
    DispatcherSelection["listOnly"] = "sadece liste";
})(DispatcherSelection = exports.DispatcherSelection || (exports.DispatcherSelection = {}));
let Dispatcher = class Dispatcher extends basemodel_1.default {
    get userNote() {
        let desc = "";
        if (this.takeOnly) {
            desc = "*Semtinize sadece gel-al hizmeti verebiliyoruz*";
        }
        else {
            if (this.min > 0)
                desc = `Sipariş toplamı ${helper_1.default.formattedCurrency(this.min)} ve üzeriyse adresinize gönderebiliriz`;
            else
                desc = 'Adresinize gönderebiliriz';
        }
        return desc;
    }
    get priceInfo() {
        let desc = "";
        if (this.takeOnly) {
            desc = "Gel-al sadece";
            return desc;
        }
        if (this.min > 0)
            desc = `En az sipariş tutarı ${helper_1.default.formattedCurrency(this.min)}`;
        if (this.fee <= 0)
            desc += ((desc ? ', ' : '') + 'Ücretsiz Gönderim');
        else if (this.fee > 0 && this.totalForFree <= 0)
            desc += ((desc ? ', ' : '') + `${helper_1.default.formattedCurrency(this.fee)} gönderim ücreti`);
        else if (this.fee > 0)
            desc += ((desc ? ', ' : '') + `${helper_1.default.formattedCurrency(this.totalForFree)} üzeri ücretsiz gönderim`);
        return desc;
    }
};
__decorate([
    sequelize_typescript_1.ForeignKey(() => area_1.default),
    __metadata("design:type", Number)
], Dispatcher.prototype, "fromareaid", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: true,
    }),
    __metadata("design:type", Number)
], Dispatcher.prototype, "fromarealevel", void 0);
__decorate([
    sequelize_typescript_1.BelongsTo(() => area_1.default, "fromareaid"),
    __metadata("design:type", area_1.default)
], Dispatcher.prototype, "fromarea", void 0);
__decorate([
    sequelize_typescript_1.ForeignKey(() => butcher_1.default),
    __metadata("design:type", Number)
], Dispatcher.prototype, "frombutcherid", void 0);
__decorate([
    sequelize_typescript_1.BelongsTo(() => butcher_1.default, "frombutcherid"),
    __metadata("design:type", butcher_1.default)
], Dispatcher.prototype, "frombutcher", void 0);
__decorate([
    sequelize_typescript_1.ForeignKey(() => area_1.default),
    __metadata("design:type", Number)
], Dispatcher.prototype, "toareaid", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: true,
    }),
    __metadata("design:type", Number)
], Dispatcher.prototype, "toarealevel", void 0);
__decorate([
    sequelize_typescript_1.BelongsTo(() => area_1.default, "toareaid"),
    __metadata("design:type", area_1.default)
], Dispatcher.prototype, "toarea", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: false,
        defaultValue: 0,
        type: sequelize_typescript_1.DataType.DECIMAL(13, 2)
    }),
    __metadata("design:type", Number)
], Dispatcher.prototype, "fee", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: false,
        defaultValue: 0,
        type: sequelize_typescript_1.DataType.DECIMAL(13, 2)
    }),
    __metadata("design:type", Number)
], Dispatcher.prototype, "totalForFree", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: false,
        defaultValue: 0,
        type: sequelize_typescript_1.DataType.DECIMAL(13, 2)
    }),
    __metadata("design:type", Number)
], Dispatcher.prototype, "min", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: false,
        defaultValue: 'butcher'
    }),
    __metadata("design:type", String)
], Dispatcher.prototype, "type", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: false,
    }),
    __metadata("design:type", String)
], Dispatcher.prototype, "name", void 0);
__decorate([
    sequelize_typescript_1.ForeignKey(() => butcher_1.default),
    __metadata("design:type", Number)
], Dispatcher.prototype, "butcherid", void 0);
__decorate([
    sequelize_typescript_1.BelongsTo(() => butcher_1.default, "butcherid"),
    __metadata("design:type", butcher_1.default)
], Dispatcher.prototype, "butcher", void 0);
__decorate([
    sequelize_typescript_1.ForeignKey(() => order_1.OrderItem),
    __metadata("design:type", Number)
], Dispatcher.prototype, "lastorderitemid", void 0);
__decorate([
    sequelize_typescript_1.BelongsTo(() => order_1.OrderItem, "lastorderitemid"),
    __metadata("design:type", order_1.OrderItem)
], Dispatcher.prototype, "lastOrderItem", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: false,
    }),
    __metadata("design:type", Number)
], Dispatcher.prototype, "typeid", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: true,
    }),
    __metadata("design:type", String)
], Dispatcher.prototype, "note", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: false,
        defaultValue: 'tam'
    }),
    __metadata("design:type", String)
], Dispatcher.prototype, "selection", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: false,
        defaultValue: true
    }),
    __metadata("design:type", Boolean)
], Dispatcher.prototype, "enabled", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: false,
        defaultValue: false
    }),
    __metadata("design:type", Boolean)
], Dispatcher.prototype, "takeOnly", void 0);
Dispatcher = __decorate([
    sequelize_typescript_1.Table({
        tableName: "Dispatchers",
        indexes: [{
                name: 'fromareaid_idx',
                fields: ['fromareaid']
            }, {
                name: 'frombutcherid_idx',
                fields: ['frombutcherid']
            }, {
                name: 'toareaid_idx',
                fields: ['toareaid']
            }, {
                name: 'type_idx',
                fields: ['type', 'typeid']
            }]
    })
], Dispatcher);
exports.default = Dispatcher;
