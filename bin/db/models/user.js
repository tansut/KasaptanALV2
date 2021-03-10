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
var User_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserRole = void 0;
const sequelize_typescript_1 = require("sequelize-typescript");
const moment = require("moment");
const basemodel_1 = require("./basemodel");
const user_1 = require("../../models/user");
const bcrypt = require("bcryptjs");
const helper_1 = require("../../lib/helper");
const validator_1 = require("validator");
const accountmodel_1 = require("./accountmodel");
const account_1 = require("../../models/account");
var UserRole;
(function (UserRole) {
})(UserRole = exports.UserRole || (exports.UserRole = {}));
let User = User_1 = class User extends basemodel_1.default {
    constructor() {
        super(...arguments);
        this.usablePuans = 0.00;
    }
    loadPuanView() {
        return __awaiter(this, void 0, void 0, function* () {
            this.puans = yield accountmodel_1.default.summary([
                account_1.Account.generateCode("musteri-kalitte-kazanilan-puan", [this.id, 1]),
                account_1.Account.generateCode("musteri-kalitte-kazanilan-puan", [this.id, 2]),
                account_1.Account.generateCode("musteri-kasap-kazanilan-puan", [this.id]),
                account_1.Account.generateCode("musteri-harcanan-puan", [this.id])
            ]);
            this.usablePuans = helper_1.default.asCurrency(this.puans.alacak - this.puans.borc);
            this.usablePuans = this.usablePuans < 0 ? helper_1.default.asCurrency(0) : this.usablePuans;
            return this;
        });
    }
    static retrieveByEMailOrPhone(email) {
        email = email || "";
        let where = validator_1.default.isEmail(email) ? {
            email: email.toLowerCase()
        } : {
            mphone: helper_1.default.getPhoneNumber(email)
        };
        var q = User_1.findOne({ where: where }).then(u => {
            return u ? u.loadPuanView() : u;
        });
        return q;
    }
    hasRole(role) {
        let roles = this.getRoles();
        return roles.indexOf(role) >= 0;
    }
    setPassword(password) {
        var passwordSalt = bcrypt.genSaltSync(10);
        var hash = bcrypt.hashSync(password, passwordSalt);
        this.password = hash;
    }
    getRoles() {
        let roles = this.roles || "";
        return roles.split(",");
    }
    toClient() {
        return super.toClient(user_1.AppUser);
    }
    verifyPassword(password) {
        return bcrypt.compareSync(password, this.password);
    }
    get shopcard() {
        return this.shopcardjson ? JSON.parse(this.getDataValue('shopcardjson').toString()) : null;
    }
    set shopcard(value) {
        this.setDataValue('shopcardjson', Buffer.from(JSON.stringify(value), "utf-8"));
    }
    hasSavedLocation() {
        return (this.lastLevel1Id && this.lastLevel2Id && this.lastLevel3Id);
    }
    generateAccessToken() {
        var tokenData = {
            userId: this["id"],
            expiration_time: moment().add('minute', 30).toDate(),
            props: []
        };
        return tokenData;
    }
};
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", String)
], User.prototype, "email", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", String)
], User.prototype, "name", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", String)
], User.prototype, "mphone", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", String)
], User.prototype, "password", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", String)
], User.prototype, "resetToken", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", String)
], User.prototype, "roles", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", Date)
], User.prototype, "resetTokenValid", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", String)
], User.prototype, "ivCode", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", Date)
], User.prototype, "lastLogin", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", String)
], User.prototype, "lastAddress", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", String)
], User.prototype, "lastBina", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", String)
], User.prototype, "lastKat", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", String)
], User.prototype, "lastTarif", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", String)
], User.prototype, "lastDaire", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: true,
        type: sequelize_typescript_1.DataType.GEOMETRY('POINT')
    }),
    __metadata("design:type", Object)
], User.prototype, "lastLocation", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", String)
], User.prototype, "lastLocationType", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", Number)
], User.prototype, "butcherid", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: false,
        defaultValue: "kasaptanal.com"
    }),
    __metadata("design:type", String)
], User.prototype, "source", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: false,
        defaultValue: 0
    }),
    __metadata("design:type", Number)
], User.prototype, "sourceId", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: true
    }),
    __metadata("design:type", Number)
], User.prototype, "lastLevel1Id", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: true
    }),
    __metadata("design:type", Number)
], User.prototype, "lastLevel2Id", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: true
    }),
    __metadata("design:type", Number)
], User.prototype, "lastLevel3Id", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: true
    }),
    __metadata("design:type", Number)
], User.prototype, "lastLevel4Id", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: false,
        defaultValue: false
    }),
    __metadata("design:type", Boolean)
], User.prototype, "mphoneverified", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: false,
        defaultValue: false
    }),
    __metadata("design:type", Boolean)
], User.prototype, "emailverified", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", Buffer)
], User.prototype, "shopcardjson", void 0);
User = User_1 = __decorate([
    sequelize_typescript_1.Table({
        tableName: "Users",
        indexes: [
            {
                unique: true,
                fields: ['email']
            },
            {
                unique: true,
                fields: ['mphone']
            }
        ]
    })
], User);
exports.default = User;
;
