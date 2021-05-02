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
const butcher_1 = require("./butcher");
let ButcherProduct = class ButcherProduct extends basemodel_1.default {
    get enabledUnits() {
        let res = [];
        let units = ['unit1', 'unit2', 'unit3'];
        units.forEach(i => {
            this[`${i}enabled`] && res.push(`${i}`);
        });
        return res;
    }
    canBeEnabled() {
        let eu = this.enabledUnits;
        if (!eu.length)
            return false;
        return true;
    }
    get priceView() {
        let units = ['unit1', 'unit2', 'unit3'];
        if (this.kgPrice > 0) {
            let title = 'KG';
            units.forEach(u => {
                if (this.product[`${u}`] == 'kg') {
                    title = this.product[`${u}title`];
                }
            });
            return {
                price: this.kgPrice,
                unit: 'kg',
                unitTitle: title
            };
        }
        else {
            for (let i = 0; i < units.length; i++) {
                let done = this[`${units[i]}enabled`] && this[`${units[i]}price`] > 0;
                if (done)
                    return {
                        unit: this.product[`${units[i]}`],
                        unitTitle: this.product[`${units[i]}title`],
                        price: this[`${units[i]}price`]
                    };
            }
            return {
                unit: '',
                price: 0.00,
                unitTitle: ''
            };
        }
    }
};
__decorate([
    sequelize_typescript_1.ForeignKey(() => butcher_1.default),
    __metadata("design:type", Number)
], ButcherProduct.prototype, "butcherid", void 0);
__decorate([
    sequelize_typescript_1.BelongsTo(() => butcher_1.default, "butcherid"),
    __metadata("design:type", butcher_1.default)
], ButcherProduct.prototype, "butcher", void 0);
__decorate([
    sequelize_typescript_1.ForeignKey(() => product_1.default),
    __metadata("design:type", Number)
], ButcherProduct.prototype, "productid", void 0);
__decorate([
    sequelize_typescript_1.BelongsTo(() => product_1.default, "productid"),
    __metadata("design:type", product_1.default)
], ButcherProduct.prototype, "product", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: true,
    }),
    __metadata("design:type", Boolean)
], ButcherProduct.prototype, "enabled", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: true,
        type: sequelize_typescript_1.DataType.DECIMAL(13, 2)
    }),
    __metadata("design:type", Number)
], ButcherProduct.prototype, "unit1price", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: true,
        type: sequelize_typescript_1.DataType.DECIMAL(13, 2)
    }),
    __metadata("design:type", Number)
], ButcherProduct.prototype, "unit2price", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: true,
        type: sequelize_typescript_1.DataType.DECIMAL(13, 2)
    }),
    __metadata("design:type", Number)
], ButcherProduct.prototype, "unit3price", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: true,
        type: sequelize_typescript_1.DataType.DECIMAL(13, 2)
    }),
    __metadata("design:type", Number)
], ButcherProduct.prototype, "unit4price", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: true,
        type: sequelize_typescript_1.DataType.DECIMAL(13, 2)
    }),
    __metadata("design:type", Number)
], ButcherProduct.prototype, "unit5price", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: false,
        defaultValue: false
    }),
    __metadata("design:type", Boolean)
], ButcherProduct.prototype, "unit1enabled", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: false,
        defaultValue: false
    }),
    __metadata("design:type", Boolean)
], ButcherProduct.prototype, "unit2enabled", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: false,
        defaultValue: false
    }),
    __metadata("design:type", Boolean)
], ButcherProduct.prototype, "unit3enabled", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: false,
        defaultValue: false
    }),
    __metadata("design:type", Boolean)
], ButcherProduct.prototype, "unit4enabled", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: false,
        defaultValue: false
    }),
    __metadata("design:type", Boolean)
], ButcherProduct.prototype, "unit5enabled", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: false,
        defaultValue: 0,
        type: sequelize_typescript_1.DataType.DECIMAL(13, 2)
    }),
    __metadata("design:type", Number)
], ButcherProduct.prototype, "kgPrice", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: false,
        defaultValue: 'tam'
    }),
    __metadata("design:type", String)
], ButcherProduct.prototype, "selection", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: false,
        defaultValue: 0,
        type: sequelize_typescript_1.DataType.DECIMAL(8, 3)
    }),
    __metadata("design:type", Number)
], ButcherProduct.prototype, "unit1kgRatio", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: false,
        defaultValue: 0,
        type: sequelize_typescript_1.DataType.DECIMAL(8, 3)
    }),
    __metadata("design:type", Number)
], ButcherProduct.prototype, "unit2kgRatio", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: false,
        defaultValue: 0,
        type: sequelize_typescript_1.DataType.DECIMAL(8, 3)
    }),
    __metadata("design:type", Number)
], ButcherProduct.prototype, "unit3kgRatio", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: true,
    }),
    __metadata("design:type", String)
], ButcherProduct.prototype, "unit1weight", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: true,
    }),
    __metadata("design:type", String)
], ButcherProduct.prototype, "unit2weight", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: true,
    }),
    __metadata("design:type", String)
], ButcherProduct.prototype, "unit3weight", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: true,
    }),
    __metadata("design:type", Number)
], ButcherProduct.prototype, "displayOrder", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: false,
        defaultValue: false
    }),
    __metadata("design:type", Boolean)
], ButcherProduct.prototype, "vitrin", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: true,
        type: sequelize_typescript_1.DataType.TEXT
    }),
    __metadata("design:type", String)
], ButcherProduct.prototype, "mddesc", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: true,
        type: sequelize_typescript_1.DataType.TEXT
    }),
    __metadata("design:type", String)
], ButcherProduct.prototype, "longdesc", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: true,
        type: sequelize_typescript_1.DataType.TEXT
    }),
    __metadata("design:type", String)
], ButcherProduct.prototype, "fromButcherDesc", void 0);
ButcherProduct = __decorate([
    sequelize_typescript_1.Table({
        tableName: "ButcherProducts",
        indexes: [{
                name: "butcherproduct_idx",
                fields: ["butcherid", "productid"],
                unique: true
            }]
    })
], ButcherProduct);
exports.default = ButcherProduct;
