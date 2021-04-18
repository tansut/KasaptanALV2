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
let AgreementLog = class AgreementLog extends basemodel_1.default {
};
__decorate([
    sequelize_typescript_1.Column({
        allowNull: true
    }),
    __metadata("design:type", Number)
], AgreementLog.prototype, "userid", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: false,
    }),
    __metadata("design:type", String)
], AgreementLog.prototype, "type", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: false,
    }),
    __metadata("design:type", String)
], AgreementLog.prototype, "title", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: true,
    }),
    __metadata("design:type", String)
], AgreementLog.prototype, "name", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: true,
    }),
    __metadata("design:type", String)
], AgreementLog.prototype, "sessionid", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: true,
    }),
    __metadata("design:type", String)
], AgreementLog.prototype, "ip", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: true,
        type: sequelize_typescript_1.DataType.TEXT
    }),
    __metadata("design:type", String)
], AgreementLog.prototype, "content", void 0);
AgreementLog = __decorate([
    sequelize_typescript_1.Table({
        tableName: "Agreements"
    })
], AgreementLog);
exports.default = AgreementLog;
