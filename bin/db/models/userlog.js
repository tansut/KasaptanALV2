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
let UserLog = class UserLog extends basemodel_1.default {
};
__decorate([
    sequelize_typescript_1.Column({
        allowNull: false
    }),
    __metadata("design:type", Number)
], UserLog.prototype, "userid", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: true,
    }),
    __metadata("design:type", String)
], UserLog.prototype, "name", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: true,
    }),
    __metadata("design:type", String)
], UserLog.prototype, "platform", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: false,
    }),
    __metadata("design:type", String)
], UserLog.prototype, "logCategory", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: false,
    }),
    __metadata("design:type", String)
], UserLog.prototype, "logAction", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: true
    }),
    __metadata("design:type", Number)
], UserLog.prototype, "productid", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: true
    }),
    __metadata("design:type", String)
], UserLog.prototype, "productName", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: true
    }),
    __metadata("design:type", Number)
], UserLog.prototype, "categoryid", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: true
    }),
    __metadata("design:type", String)
], UserLog.prototype, "categoryName", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: true
    }),
    __metadata("design:type", Number)
], UserLog.prototype, "areaid", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: true
    }),
    __metadata("design:type", String)
], UserLog.prototype, "arelaL1", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: true
    }),
    __metadata("design:type", String)
], UserLog.prototype, "arelaL2", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: true
    }),
    __metadata("design:type", String)
], UserLog.prototype, "arelaL3", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: true
    }),
    __metadata("design:type", String)
], UserLog.prototype, "arelaL4", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: true,
    }),
    __metadata("design:type", String)
], UserLog.prototype, "areaDisplay", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: true,
    }),
    __metadata("design:type", Number)
], UserLog.prototype, "butcherid", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: true,
    }),
    __metadata("design:type", String)
], UserLog.prototype, "butcherName", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: true
    }),
    __metadata("design:type", String)
], UserLog.prototype, "ip", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: true
    }),
    __metadata("design:type", String)
], UserLog.prototype, "url", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: true
    }),
    __metadata("design:type", String)
], UserLog.prototype, "referal", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: true
    }),
    __metadata("design:type", String)
], UserLog.prototype, "note", void 0);
UserLog = __decorate([
    sequelize_typescript_1.Table({
        tableName: "UserLogs",
        indexes: [{
                name: "userid_idx",
                fields: ["userid"]
            }]
    })
], UserLog);
exports.default = UserLog;
