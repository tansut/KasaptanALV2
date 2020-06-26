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
let Content = class Content extends basemodel_1.default {
    get markDownStr() {
        return this.getDataValue('markdown') ? this.getDataValue('markdown').toString() : "";
    }
    set markDownStr(value) {
        this.setDataValue('markdown', Buffer.from(value));
    }
};
__decorate([
    sequelize_typescript_1.Column({
        allowNull: true,
    }),
    __metadata("design:type", String)
], Content.prototype, "pageTitle", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: true,
    }),
    __metadata("design:type", String)
], Content.prototype, "pageDescription", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: false,
    }),
    __metadata("design:type", String)
], Content.prototype, "title", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: false,
    }),
    __metadata("design:type", String)
], Content.prototype, "category", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: false,
    }),
    __metadata("design:type", String)
], Content.prototype, "slug", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: true,
    }),
    __metadata("design:type", String)
], Content.prototype, "categorySlug", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: true,
    }),
    __metadata("design:type", String)
], Content.prototype, "description", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: true,
    }),
    __metadata("design:type", Number)
], Content.prototype, "displayOrder", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", Buffer)
], Content.prototype, "markdown", void 0);
Content = __decorate([
    sequelize_typescript_1.Table({
        tableName: "Contents",
        indexes: [{
                name: "slug_idx",
                fields: ["slug"],
                unique: true
            }]
    })
], Content);
exports.default = Content;

//# sourceMappingURL=content.js.map
