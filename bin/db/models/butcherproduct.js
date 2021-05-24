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
const helper_1 = require("../../lib/helper");
const product_1 = require("./product");
const butcher_1 = require("./butcher");
const brand_1 = require("./brand");
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
        if (this.kgPrice <= 0 && this.unit1price <= 0 && this.unit2price <= 0 && this.unit3price <= 0)
            return false;
        return true;
    }
    // canSellable() {
    //     let result = true;
    //     for (let i = 1; i < 4; i++) {
    //         if (this[`unit${i}enabled`] && !this.product[`unit${i}enabled`]) {
    //             result = false;
    //         } else result = true;
    //     }
    //     return result;
    // }
    get priceView() {
        let units = ['unit1', 'unit2', 'unit3'];
        if (this.kgPrice > 0) {
            let title = this.product.priceUnitTitle;
            return {
                price: helper_1.default.CalculateDiscount(this.discountType, this.priceDiscount, this.kgPrice),
                regular: this.kgPrice,
                unit: this.product.priceUnit,
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
                        price: helper_1.default.CalculateDiscount(this.discountType, this.priceDiscount, this[`${units[i]}price`]),
                        regular: this[`${units[i]}price`]
                    };
            }
            return {
                unit: '',
                price: 0.00,
                unitTitle: '',
                regular: 0.00
            };
        }
    }
    static copyAllFromPriceButcher() {
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
    sequelize_typescript_1.ForeignKey(() => brand_1.default),
    __metadata("design:type", Number)
], ButcherProduct.prototype, "brandid", void 0);
__decorate([
    sequelize_typescript_1.BelongsTo(() => brand_1.default, "brandid"),
    __metadata("design:type", brand_1.default)
], ButcherProduct.prototype, "brand", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: false,
        defaultValue: false
    }),
    __metadata("design:type", Boolean)
], ButcherProduct.prototype, "managerApproved", void 0);
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
        defaultValue: 'none'
    }),
    __metadata("design:type", String)
], ButcherProduct.prototype, "discountType", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: false,
        type: sequelize_typescript_1.DataType.DECIMAL(13, 2),
        defaultValue: 0.00
    }),
    __metadata("design:type", Number)
], ButcherProduct.prototype, "priceDiscount", void 0);
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
