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
exports.DispatcherTypeDesc = exports.DispatcherSelection = void 0;
const sequelize_typescript_1 = require("sequelize-typescript");
const basemodel_1 = require("./basemodel");
const helper_1 = require("../../lib/helper");
const area_1 = require("./area");
const butcher_1 = require("./butcher");
const order_1 = require("./order");
const core_1 = require("../../lib/logistic/core");
var DispatcherSelection;
(function (DispatcherSelection) {
    DispatcherSelection["full"] = "tam";
    DispatcherSelection["listOnly"] = "sadece liste";
})(DispatcherSelection = exports.DispatcherSelection || (exports.DispatcherSelection = {}));
exports.DispatcherTypeDesc = {
    "butcher": "Kasap",
    "butcher/auto": "Kasap",
    "kasaptanal/motokurye": "Hızlı Kurye Sistemi",
    "kasaptanal/car": "Soğuk Zincir Araç Kurye Sistemi",
};
let Dispatcher = class Dispatcher extends basemodel_1.default {
    setProvider(useLevel1, l3, productType, distance2Butcher) {
        let dispath = this;
        let butcherAvail = dispath.toarealevel == 0 || (dispath.toarealevel > 1) || useLevel1;
        if (!useLevel1 && dispath.toarealevel == 1) {
            let forceL1 = dispath.butcher.dispatchArea == "citywide" || dispath.butcher.dispatchArea == "radius";
            if (dispath.butcher.dispatchArea == "radius") {
                let distance = distance2Butcher || helper_1.default.distance(dispath.butcher.location, l3.location);
                butcherAvail = dispath.butcher.radiusAsKm >= distance;
            }
            else
                butcherAvail = forceL1;
            if (butcherAvail && dispath.areaTag) {
                butcherAvail = dispath.areaTag == l3.dispatchTag;
            }
        }
        if (butcherAvail) {
            let usage = dispath.logisticProviderUsage == "default" ? dispath.butcher.logisticProviderUsage : dispath.logisticProviderUsage;
            let providerKey = "butcher";
            if (helper_1.default.isSingleShopcardProduct(productType)) {
            }
            else {
                if (usage != "none" && dispath.butcher.logisticProviderUsage != "disabled" && dispath.butcher.logisticProvider) {
                    providerKey = dispath.butcher.logisticProvider;
                }
                else {
                    providerKey = dispath.butcher.defaultDispatcher;
                }
            }
            this.provider = core_1.LogisticFactory.getInstance(providerKey, {
                dispatcher: dispath,
            });
        }
        return this.provider;
    }
    get userNote() {
        this.provider;
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
        if (this.type == "kasaptanal/motokurye") {
            let time = '60-90 dk';
            if (this.butcherArea.bestKm <= 15.0) {
                time = '45-60 dk';
            }
            else if (this.butcherArea.bestKm > 25.0 && this.butcherArea.bestKm <= 35.00) {
                time = '75-120 dk';
            }
            else if (this.butcherArea.bestKm > 35 && this.butcherArea.bestKm <= 45.00) {
                time = '90-150 dk';
            }
            else if (this.butcherArea.bestKm > 45.0) {
                time = '120-180 dk';
            }
            return `${time} teslimat`;
        }
        else {
            return "";
            //return `${this.butcherArea.kmActive} km, 1-2 saat.`
        }
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
        allowNull: true,
        type: sequelize_typescript_1.DataType.TEXT
    }),
    __metadata("design:type", String)
], Dispatcher.prototype, "longdesc", void 0);
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
        defaultValue: "default"
    }),
    __metadata("design:type", String)
], Dispatcher.prototype, "logisticProviderUsage", void 0);
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
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", String)
], Dispatcher.prototype, "areaTag", void 0);
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
