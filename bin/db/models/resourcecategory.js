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
const category_1 = require("./category");
const resource_1 = require("./resource");
let ResourceCategory = class ResourceCategory extends basemodel_1.default {
};
__decorate([
    sequelize_typescript_1.ForeignKey(() => resource_1.default),
    __metadata("design:type", Number)
], ResourceCategory.prototype, "resourceid", void 0);
__decorate([
    sequelize_typescript_1.BelongsTo(() => resource_1.default, "resourceid"),
    __metadata("design:type", resource_1.default)
], ResourceCategory.prototype, "resource", void 0);
__decorate([
    sequelize_typescript_1.ForeignKey(() => category_1.default),
    __metadata("design:type", Number)
], ResourceCategory.prototype, "categoryid", void 0);
__decorate([
    sequelize_typescript_1.BelongsTo(() => category_1.default, "categoryid"),
    __metadata("design:type", category_1.default)
], ResourceCategory.prototype, "category", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: true,
    }),
    __metadata("design:type", Number)
], ResourceCategory.prototype, "displayOrder", void 0);
ResourceCategory = __decorate([
    sequelize_typescript_1.Table({
        tableName: "ResourceCategories",
        indexes: [{
                name: "resourcecategory_idx",
                fields: ["resourceid", "categoryid"],
                unique: true
            }]
    })
], ResourceCategory);
exports.default = ResourceCategory;

//# sourceMappingURL=resourcecategory.js.map
