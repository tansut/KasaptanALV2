import { Sequelize } from 'sequelize-typescript';
import ButcherModel from "./models/butcher";

import config from "../config";
import * as path from 'path';
import User from './models/user';
import RefreshToken from './models/refreshToken';
import Resource from './models/resource';
import Area from './models/area';
import SiteLog from './models/sitelog';
import { where } from 'sequelize/types';
import Category from './models/category';
import { Order, OrderItem} from './models/order';
import Product from './models/product';
import ProductCategory from './models/productcategory';
import ResourceCategory from './models/resourcecategory';
import ButcherProduct from './models/butcherproduct';
import Content from './models/content';
import Dispatcher from './models/dispatcher';
import WebPage from './models/webpage';
import Redirect from './models/redirect';
import PriceCategory from './models/pricecategory';
import ButcherPriceHistory from './models/butcherpricehistory';
import Review from './models/review';
import Payment from './models/payment';
import AccountModel from './models/accountmodel';
import Subcategory from './models/subcategory';
import ButcherArea from './models/butcherarea';
import DBCache from './models/dbcache';
import NutritionValue from './models/nutritionvalue';
import NutritionValueItem from './models/nutritionvalueitem';
import TempLoc from './models/temp_loc';



let dbInstance: Sequelize;

let init = (params?: any) => {
    dbInstance = new Sequelize({
        database: config.dbname,
        dialect: 'mysql',
        username: config.dbuser,
        password: config.dbpwd,
        port: config.dbport,
        host: config.dbaddress,
        logging: false,
        dialectOptions: { decimalNumbers: true }
    });

    dbInstance.addModels([TempLoc, DBCache, NutritionValue, NutritionValueItem, ButcherArea, Subcategory, Payment, AccountModel, Review, ButcherPriceHistory, PriceCategory, Redirect, WebPage, ButcherModel, Order, OrderItem, Dispatcher, User, RefreshToken, Resource, Area, SiteLog, Category, Product, ProductCategory, ButcherProduct, Content, ResourceCategory]);

    return dbInstance.sync({
        alter: true,
        logging: false
    })
}

export default { init: init, getContext: () => dbInstance };