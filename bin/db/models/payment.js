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
let Payment = class Payment extends basemodel_1.default {
};
__decorate([
    sequelize_typescript_1.Column({
        allowNull: true
    }),
    __metadata("design:type", Number)
], Payment.prototype, "userid", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: false,
    }),
    __metadata("design:type", String)
], Payment.prototype, "provider", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: true,
    }),
    __metadata("design:type", String)
], Payment.prototype, "paymentId", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: true,
    }),
    __metadata("design:type", String)
], Payment.prototype, "conversationId", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: true,
    }),
    __metadata("design:type", String)
], Payment.prototype, "ip", void 0);
__decorate([
    sequelize_typescript_1.Column({
        defaultValue: 'unused'
    }),
    __metadata("design:type", String)
], Payment.prototype, "status", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: false,
        type: sequelize_typescript_1.DataType.DECIMAL(13, 2)
    }),
    __metadata("design:type", Number)
], Payment.prototype, "price", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: true,
        type: sequelize_typescript_1.DataType.TEXT
    }),
    __metadata("design:type", String)
], Payment.prototype, "request", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: true,
        type: sequelize_typescript_1.DataType.TEXT
    }),
    __metadata("design:type", String)
], Payment.prototype, "response", void 0);
Payment = __decorate([
    sequelize_typescript_1.Table({
        tableName: "Payments",
        indexes: [{
                fields: ['paymentId'],
                name: 'paymentId_idx'
            }, {
                fields: ['conversationId'],
                name: 'conversationId_idx',
                unique: false
            }]
    })
], Payment);
exports.default = Payment;
