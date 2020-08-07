import { SitemapStream, streamToPromise} from "sitemap";
var fs = require('fs')
import config from '../config';
import * as path from "path";
import Product from "../db/models/product";
import Category from "../db/models/category";
import Resource from "../db/models/resource";
import {Op, QueryTypes} from "sequelize";
import Content from "../db/models/content";
import Butcher from "../db/models/butcher";
import Area from "../db/models/area";
import PriceCategory from "../db/models/pricecategory";
import * as sq from 'sequelize';



export interface ProductShipping {
    country: string;
    service: string;
    price: number;
}




export default class ProductFeed {
    static baseUrl = 'https://www.kasaptanal.com';


    static getFeed() {
        
    }


}