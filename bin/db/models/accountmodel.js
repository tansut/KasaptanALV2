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
var AccountModel_1;
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_typescript_1 = require("sequelize-typescript");
const basemodel_1 = require("./basemodel");
const helper_1 = require("../../lib/helper");
const orderid = require('order-id')('dkfjsdklfjsdlkg450435034.,');
const sq = require("sequelize");
const sequelize_1 = require("sequelize");
let AccountModel = AccountModel_1 = class AccountModel extends basemodel_1.default {
    static fromAccount(l) {
        return new AccountModel_1({
            borc: l.borc,
            alacak: l.alacak,
            code: l.code,
            opDesc: l.opDesc,
            itemDesc: l.itemDesc,
            date: helper_1.default.Now()
        });
    }
    static addTotals(list) {
        let b = 0.00, a = 0.00;
        list.forEach(l => {
            b += helper_1.default.asCurrency(l.borc);
            a += helper_1.default.asCurrency(l.alacak);
        });
        list.push(new AccountModel_1({
            alacak: helper_1.default.asCurrency(a),
            borc: helper_1.default.asCurrency(b),
            code: 'total',
            desc: 'Toplam'
        }));
    }
    static list(codes) {
        return __awaiter(this, void 0, void 0, function* () {
            let list = yield AccountModel_1.findAll({
                where: {
                    code: {
                        [sequelize_1.Op.or]: codes.map(c => {
                            return {
                                [sequelize_1.Op.like]: c + '%'
                            };
                        })
                    }
                },
                order: [['date', 'asc']]
            });
            AccountModel_1.addTotals(list);
            return list;
        });
    }
    static summary(codes) {
        return __awaiter(this, void 0, void 0, function* () {
            let result = new AccountModel_1({
                code: 'total',
                name: 'Toplam'
            });
            let b = 0.00, a = 0.00;
            for (let i = 0; i < codes.length; i++) {
                let totals = yield AccountModel_1.sequelize.query("SELECT sum(borc) as b, sum(alacak) as a FROM Accounts where code like :code", {
                    replacements: { code: codes[i] + '%' },
                    type: sq.QueryTypes.SELECT,
                    mapToModel: false,
                    raw: true
                });
                let numbers = (totals.length <= 0) ? [0.00, 0.00] : [helper_1.default.asCurrency(totals[0].b || 0), helper_1.default.asCurrency(totals[0].a || 0)];
                result[codes[i]] = numbers;
                b += helper_1.default.asCurrency(numbers[0]);
                a += helper_1.default.asCurrency(numbers[1]);
            }
            result.borc = helper_1.default.asCurrency(b);
            result.alacak = helper_1.default.asCurrency(a);
            return result;
        });
    }
    static saveOperation(list, ops) {
        return __awaiter(this, void 0, void 0, function* () {
            let arr = [];
            list.accounts.forEach((l, i) => {
                var dbItem = AccountModel_1.fromAccount(l);
                dbItem.accorder = i;
                dbItem.operation = list.opcode;
                dbItem.opDesc = list.desc;
                arr.push(dbItem.save(ops));
            });
            return Promise.all(arr);
        });
    }
};
__decorate([
    sequelize_typescript_1.Column({
        allowNull: false
    }),
    __metadata("design:type", String)
], AccountModel.prototype, "code", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: true
    }),
    __metadata("design:type", String)
], AccountModel.prototype, "name", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: false,
        type: sequelize_typescript_1.DataType.INTEGER
    }),
    __metadata("design:type", Number)
], AccountModel.prototype, "accorder", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: false,
        type: sequelize_typescript_1.DataType.DECIMAL(13, 2)
    }),
    __metadata("design:type", Number)
], AccountModel.prototype, "borc", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: false,
        type: sequelize_typescript_1.DataType.DECIMAL(13, 2)
    }),
    __metadata("design:type", Number)
], AccountModel.prototype, "alacak", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: false
    }),
    __metadata("design:type", String)
], AccountModel.prototype, "opDesc", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: false
    }),
    __metadata("design:type", String)
], AccountModel.prototype, "itemDesc", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: false
    }),
    __metadata("design:type", String)
], AccountModel.prototype, "operation", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: false
    }),
    __metadata("design:type", Date)
], AccountModel.prototype, "date", void 0);
AccountModel = AccountModel_1 = __decorate([
    sequelize_typescript_1.Table({
        tableName: "Accounts",
        indexes: [{
                name: "acc_idx_1",
                fields: ["code"]
            },
            {
                name: "acc_idx_2",
                fields: ["operation", "accorder"]
            }]
    })
], AccountModel);
exports.default = AccountModel;

//# sourceMappingURL=accountmodel.js.map
