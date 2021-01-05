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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var NutritionValue_1;
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_typescript_1 = require("sequelize-typescript");
const basemodel_1 = require("./basemodel");
const common_1 = require("../../models/common");
const nutritionvalueitem_1 = require("./nutritionvalueitem");
let NutritionValue = NutritionValue_1 = class NutritionValue extends basemodel_1.default {
    get NutritionValues() {
        let result = [];
        this.items.forEach(i => {
            result.push({
                title: common_1.NutritionValueTitles[i.type] || i.type,
                amount: i.amount,
                unit: i.unit,
                type: i.type
            });
        });
        return result.sort((a, b) => {
            let ap = common_1.NutritionValueOrders[a.type];
            let bp = common_1.NutritionValueOrders[b.type];
            return ap - bp;
        });
    }
    generateView(based) {
        let ratio = this.amount / based.amount;
        this.calories = Math.round(ratio * based.calories);
        this.source = based.source;
        this.sourceUrl = based.sourceUrl;
        this.description = this.description || based.description;
        this.items = [];
        based.items.forEach(i => {
            let newItem = new nutritionvalueitem_1.default(i.toJSON());
            newItem.amount = Number((newItem.amount * ratio).toFixed(1));
            this.items.push(newItem);
        });
    }
    static loadView(type, ref) {
        return __awaiter(this, void 0, void 0, function* () {
            let items = yield NutritionValue_1.findAll({
                where: {
                    type: type,
                    ref: ref
                },
                include: [
                    {
                        model: nutritionvalueitem_1.default
                    }
                ],
                order: [['displayOrder', 'desc']]
            });
            let result = {
                dailyValues: {
                    'calories': 2000,
                    'fat': { 'gr': 78 },
                    'fat:saturated': { 'gr': 20 },
                    'cholesterol': { 'mg': 300 },
                    'sodium': { 'mg': 2300 },
                    'carb': { 'gr': 275 },
                    'carb:fiber': { 'gr': 28 },
                    'protein': { 'gr': 50 },
                    'vitamin:a': { 'IU': 5000 },
                    'vitamin:c': { 'mg': 90 },
                    'vitamin:d': { 'IU': 400 },
                    'vitamin:e': { 'mg': 30 },
                    'vitamin:b6': { 'mg': 2 },
                    'vitamin:iron': { 'mg': 18 },
                    'vitamin:magnesium': { 'mg': 400 },
                    'vitamin:cobalamin': { 'µg': 6 },
                    'vitamin:calcium': { 'mg': 1000 },
                },
                values: []
            };
            for (let i = 0; i < items.length; i++) {
                if (!items[i].calories) {
                    let best = items.find(p => (p.calories > 0 && p.unit == items[i].unit));
                    if (best)
                        items[i].generateView(best);
                }
                let newItem = {
                    amount: items[i].amount,
                    name: items[i].name,
                    calories: items[i].calories,
                    unit: items[i].unit,
                    values: items[i].NutritionValues,
                    source: items[i].source,
                    sourceUrl: items[i].sourceUrl,
                    description: items[i].description
                };
                result.values.push(newItem);
            }
            return result;
        });
    }
};
__decorate([
    sequelize_typescript_1.Column({
        allowNull: false
    }),
    __metadata("design:type", String)
], NutritionValue.prototype, "type", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: false
    }),
    __metadata("design:type", Number)
], NutritionValue.prototype, "ref", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: false
    }),
    __metadata("design:type", String)
], NutritionValue.prototype, "name", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: false
    }),
    __metadata("design:type", String)
], NutritionValue.prototype, "unit", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: false,
        type: sequelize_typescript_1.DataType.DECIMAL(7, 2)
    }),
    __metadata("design:type", Number)
], NutritionValue.prototype, "amount", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: true,
    }),
    __metadata("design:type", String)
], NutritionValue.prototype, "description", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: false
    }),
    __metadata("design:type", Number)
], NutritionValue.prototype, "calories", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: true
    }),
    __metadata("design:type", Number)
], NutritionValue.prototype, "displayOrder", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: true
    }),
    __metadata("design:type", String)
], NutritionValue.prototype, "source", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: true
    }),
    __metadata("design:type", String)
], NutritionValue.prototype, "sourceUrl", void 0);
__decorate([
    sequelize_typescript_1.HasMany(() => nutritionvalueitem_1.default, {
        sourceKey: "id",
        foreignKey: "nutritionid",
    }),
    __metadata("design:type", Array)
], NutritionValue.prototype, "items", void 0);
NutritionValue = NutritionValue_1 = __decorate([
    sequelize_typescript_1.Table({
        tableName: "NutritionValues",
        indexes: []
    })
], NutritionValue);
exports.default = NutritionValue;
