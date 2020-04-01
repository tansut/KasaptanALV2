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

   constructor(public rate: number, public fee: number) {

   }

   calculate(totalSales: number) {
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
            butcherTaxAdvantage: Helper.asCurrency(kalitteFee * 0.22),
            butcherVatAdvantage: Helper.asCurrency(kalitteVat),
            butcherNetCost: Helper.asCurrency(kalitteFee - kalitteFee * 0.22)
        }
   }

}