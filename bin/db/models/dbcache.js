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
var DBCache_1;
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_typescript_1 = require("sequelize-typescript");
const basemodel_1 = require("./basemodel");
const helper_1 = require("../../lib/helper");
const moment = require("moment");
var AsyncLock = require('async-lock');
var lock = new AsyncLock({ timeout: 5000 });
let DBCache = DBCache_1 = class DBCache extends basemodel_1.default {
    static retrieve(key, minutes) {
        return __awaiter(this, void 0, void 0, function* () {
            //return lock.acquire(key, function() {
            return DBCache_1.findOne({
                where: {
                    key: key
                }
            }).then(found => {
                if (found) {
                    let oh = moment(helper_1.default.Now()).add(-minutes, 'minutes').toDate();
                    if (found.creationDate > oh)
                        return JSON.parse(found.data);
                    else
                        return null;
                }
                else
                    return null;
            });
            //})
        });
    }
    static put(key, val) {
        return __awaiter(this, void 0, void 0, function* () {
            return lock.acquire(key, function () {
                return DBCache_1.destroy({
                    where: {
                        key: key
                    }
                }).then(() => {
                    let item = new DBCache_1({
                        key: key,
                        data: JSON.stringify(val)
                    });
                    return item.save();
                });
            });
        });
    }
};
__decorate([
    sequelize_typescript_1.Column({
        allowNull: false
    }),
    __metadata("design:type", String)
], DBCache.prototype, "key", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: true,
        type: sequelize_typescript_1.DataType.TEXT
    }),
    __metadata("design:type", String)
], DBCache.prototype, "data", void 0);
DBCache = DBCache_1 = __decorate([
    sequelize_typescript_1.Table({
        tableName: "DBCaches",
        indexes: [{
                name: "dbcache_key_idx",
                fields: ["key"],
                unique: true
            }
        ]
    })
], DBCache);
exports.default = DBCache;
