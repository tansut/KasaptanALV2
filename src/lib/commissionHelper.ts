import * as Jimp2 from 'jimp'
const Jimp = <Jimp2.default>require('jimp');
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
     butcherNetCost: number;
}

export class ComissionHelper {

   constructor(public rate: number, public fee: number, public butcherBankRate=0.01) {

   }

   calculateButcherComission(totalSales: number) {
       let product = Helper.asCurrency(totalSales / 1.08);
       let productVat = Helper.asCurrency(totalSales - product);
       let kalitteFee = Helper.asCurrency(product * this.rate + this.fee);
       let kalitteVat = Helper.asCurrency(kalitteFee * 0.18);
        return {
            inputRate: this.rate,
            inputTotal: totalSales,
            inputFee: this.fee,
            product: product,
            productVat: productVat,
            kalitteFee: kalitteFee,
            kalitteVat: kalitteVat,
            butcherBankFeeAdvantage: Helper.asCurrency(totalSales * this.butcherBankRate),
            butcherTaxAdvantage: Helper.asCurrency(kalitteFee * 0.22),
            butcherVatAdvantage: Helper.asCurrency(kalitteVat),
            butcherNetCost: Helper.asCurrency(kalitteFee - kalitteFee * 0.22 - Helper.asCurrency(totalSales * this.butcherBankRate))
        }
   }

}

export class PuanCalculator {

    calculateCustomerPuan(puan: Puan, totalSales: number) {
        if (Helper.asCurrency(puan.minSales) == 0.00 || (totalSales >= puan.minSales)) {
            return Helper.asCurrency(totalSales * puan.rate)
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