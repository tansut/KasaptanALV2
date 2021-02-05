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
var RefreshToken_1;
Object.defineProperty(exports, "__esModule", { value: true });
const moment = require("moment");
const sequelize_typescript_1 = require("sequelize-typescript");
const basemodel_1 = require("./basemodel");
const user_1 = require("./user");
const helper_1 = require("../../lib/helper");
let RefreshToken = RefreshToken_1 = class RefreshToken extends basemodel_1.default {
    isValid() {
        const copy = new Date(this.updatedOn);
        copy.setDate(this.updatedOn.getDate() + 14);
        return (moment(copy).utc().isSameOrAfter(moment(helper_1.default.Now()).utc()));
    }
    static consume(token) {
        return __awaiter(this, void 0, void 0, function* () {
            let result = yield RefreshToken_1.findOne({
                where: {
                    token: token
                },
                include: [
                    { all: true }
                ]
            });
            if (result)
                yield RefreshToken_1.destroy({
                    where: {
                        token: token
                    }
                });
            return result.isValid() ? result : null;
        });
    }
};
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", String)
], RefreshToken.prototype, "token", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", Buffer)
], RefreshToken.prototype, "tag", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", Number)
], RefreshToken.prototype, "userId", void 0);
__decorate([
    sequelize_typescript_1.BelongsTo(() => user_1.default, "userId"),
    __metadata("design:type", user_1.default)
], RefreshToken.prototype, "user", void 0);
RefreshToken = RefreshToken_1 = __decorate([
    sequelize_typescript_1.Table({
        tableName: "RefreshTokens",
        indexes: [{
                name: "refreshtoken_key_idx",
                fields: ["token"],
                unique: true
            }
        ]
    })
], RefreshToken);
exports.default = RefreshToken;
