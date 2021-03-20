import * as Jimp2 from 'jimp'
import * as path from "path"
import * as numeral from 'numeral';
import moment = require('moment');
import { AppRequest } from './http';
import config from '../config';
import { GeoLocation } from '../models/geo';
import { create } from 'domain';
import Helper from './helper';
import { Puan } from '../models/puan';
import AccountModel from '../db/models/accountmodel';
import { Account } from '../models/account';
import { Platform } from '../models/common';

export interface ComissionResult {
    inputRate: number;
    inputFee: number;
    inputTotal: number;
    product: number;
    productVat: number;
    kalitteFee: number;
    kalitteVat: number;    
    butcherVatAdvantage: number;
    butcherTaxAdvantage: number;
    butcherBankFeeAdvantage: number;
    butcherNetCost: number;
    butcherToCustomer: number;
}

export class ComissionHelper {

   constructor(public rate: number, public fee: number, public vatRate: number) {

   }

   calculateButcherComission(totalSales: number, puan:  Puan = null): ComissionResult {
       //let product = Helper.asCurrency(totalSales / 1.08);
       let product = Helper.asCurrency(totalSales);
       let productVat = Helper.asCurrency(totalSales - product);
       let kalitteFee = Helper.asCurrency(product * this.rate + this.fee);
       let kalitteVat = Helper.asCurrency(kalitteFee * this.vatRate);
        return {
            inputRate: this.rate,
            inputTotal: totalSales,
            inputFee: this.fee,
            product: product,
            productVat: productVat,
            kalitteFee: kalitteFee,
            kalitteVat: kalitteVat,
            butcherBankFeeAdvantage: Helper.asCurrency(totalSales * 0.016),
            butcherTaxAdvantage: Helper.asCurrency(kalitteFee * 0.22),
            butcherVatAdvantage: Helper.asCurrency(kalitteVat),
            butcherNetCost: Helper.asCurrency(kalitteFee - kalitteFee * 0.22 - Helper.asCurrency(totalSales * 0.016)),
            butcherToCustomer: puan ? new PuanCalculator().calculateCustomerPuan(puan, totalSales, Platform.web): 0.00
        }
   }

}

export class PuanCalculator {

    calculateCustomerPuan(puan: Puan, totalSales: number, platform: Platform) {
        if (puan.platforms.indexOf(platform) == -1) return 0.00;
        if (Helper.asCurrency(puan.minSales) == 0.00 || (totalSales >= puan.minSales)) {
            return puan.rate ? Helper.asCurrency(totalSales * puan.rate): puan.fixed;
        } else return 0.00
    }

    async earnedButcherPuanAccounts(userid: number, butcherid: number) {
        return await AccountModel.summary([Account.generateCode("musteri-kasap-kazanilan-puan", [userid, butcherid])]);
    }

    async getEarnedButcherPuan(userid: number, butcherid: number) {
        let summary = await this.earnedButcherPuanAccounts(userid, butcherid)
        return Helper.asCurrency(summary.alacak - summary.borc);
    }  
    
    async earnedKalittePuanAccounts(userid: number, butcherid: number) {
        return await AccountModel.summary([
            Account.generateCode("musteri-kalitte-kazanilan-puan", [userid, 1]),
            Account.generateCode("musteri-kalitte-kazanilan-puan", [userid, 2])]);
    }

    async getEarnedKalittePuan(userid: number, butcherid: number) {
        let summary = await this.earnedKalittePuanAccounts(userid, butcherid)
        return Helper.asCurrency(summary.alacak - summary.borc);
    }      

}