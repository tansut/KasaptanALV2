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
const user_1 = require("./user");
let PaymentMethod = class PaymentMethod extends basemodel_1.default {
    get dataObj() {
        return this.data ? JSON.parse(this.data) : null;
    }
};
__decorate([
    sequelize_typescript_1.ForeignKey(() => user_1.default),
    __metadata("design:type", Number)
], PaymentMethod.prototype, "userid", void 0);
__decorate([
    sequelize_typescript_1.BelongsTo(() => user_1.default, "userid"),
    __metadata("design:type", user_1.default)
], PaymentMethod.prototype, "user", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: false,
        defaultValue: 'creditcard'
    }),
    __metadata("design:type", String)
], PaymentMethod.prototype, "method", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: false
    }),
    __metadata("design:type", String)
], PaymentMethod.prototype, "instance", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: false
    }),
    __metadata("design:type", String)
], PaymentMethod.prototype, "name", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: false,
        type: sequelize_typescript_1.DataType.TEXT
    }),
    __metadata("design:type", String)
], PaymentMethod.prototype, "data", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: false,
        defaultValue: true
    }),
    __metadata("design:type", Boolean)
], PaymentMethod.prototype, "enabled", void 0);
PaymentMethod = __decorate([
    sequelize_typescript_1.Table({
        tableName: "PaymentMethods",
        indexes: [{
                name: "userid_idx",
                fields: ["userid"]
            }]
    })
], PaymentMethod);
exports.default = PaymentMethod;
