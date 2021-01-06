"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PuanCalculator = exports.ComissionHelper = void 0;
const helper_1 = require("./helper");
const accountmodel_1 = require("../db/models/accountmodel");
const account_1 = require("../models/account");
class ComissionHelper {
    constructor(rate, fee, butcherBankRate = 0.012) {
        this.rate = rate;
        this.fee = fee;
        this.butcherBankRate = butcherBankRate;
    }
    calculateButcherComission(totalSales, puan = null) {
        //let product = Helper.asCurrency(totalSales / 1.08);
        let product = helper_1.default.asCurrency(totalSales);
        let productVat = helper_1.default.asCurrency(totalSales - product);
        let kalitteFee = helper_1.default.asCurrency(product * this.rate + this.fee);
        let kalitteVat = helper_1.default.asCurrency(kalitteFee * 0.18);
        return {
            inputRate: this.rate,
            inputTotal: totalSales,
            inputFee: this.fee,
            product: product,
            productVat: productVat,
            kalitteFee: kalitteFee,
            kalitteVat: kalitteVat,
            butcherBankFeeAdvantage: helper_1.default.asCurrency(totalSales * this.butcherBankRate),
            butcherTaxAdvantage: helper_1.default.asCurrency(kalitteFee * 0.22),
            butcherVatAdvantage: helper_1.default.asCurrency(kalitteVat),
            butcherNetCost: helper_1.default.asCurrency(kalitteFee - kalitteFee * 0.22 - helper_1.default.asCurrency(totalSales * this.butcherBankRate)),
            butcherToCustomer: puan ? new PuanCalculator().calculateCustomerPuan(puan, totalSales) : 0.00
        };
    }
}
exports.ComissionHelper = ComissionHelper;
class PuanCalculator {
    calculateCustomerPuan(puan, totalSales) {
        if (helper_1.default.asCurrency(puan.minSales) == 0.00 || (totalSales >= puan.minSales)) {
            return puan.rate ? helper_1.default.asCurrency(totalSales * puan.rate) : puan.fixed;
        }
        else
            return 0.00;
    }
    earnedButcherPuanAccounts(userid, butcherid) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield accountmodel_1.default.summary([account_1.Account.generateCode("musteri-kasap-kazanilan-puan", [userid, butcherid])]);
        });
    }
    getEarnedButcherPuan(userid, butcherid) {
        return __awaiter(this, void 0, void 0, function* () {
            let summary = yield this.earnedButcherPuanAccounts(userid, butcherid);
            return helper_1.default.asCurrency(summary.alacak - summary.borc);
        });
    }
    earnedKalittePuanAccounts(userid, butcherid) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield accountmodel_1.default.summary([
                account_1.Account.generateCode("musteri-kalitte-kazanilan-puan", [userid, 1]),
                account_1.Account.generateCode("musteri-kalitte-kazanilan-puan", [userid, 2])
            ]);
        });
    }
    getEarnedKalittePuan(userid, butcherid) {
        return __awaiter(this, void 0, void 0, function* () {
            let summary = yield this.earnedKalittePuanAccounts(userid, butcherid);
            return helper_1.default.asCurrency(summary.alacak - summary.borc);
        });
    }
}
exports.PuanCalculator = PuanCalculator;
