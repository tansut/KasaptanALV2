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


let dbInstance: Sequelize;

let init = (params?: any) => {
    dbInstance = new Sequelize({
        database: config.dbname,
        dialect: 'mysql',
        username: config.dbuser,
        password: config.dbpwd,
        port: config.dbport,
        host: config.dbaddress,
        logging: true,
        dialectOptions: { decimalNumbers: true }
    });

    dbInstance.addModels([ButcherModel, Order, OrderItem, Dispatcher, User, RefreshToken, Resource, Area, SiteLog, Category, Product, ProductCategory, ButcherProduct, Content, ResourceCategory]);

    return dbInstance.sync({
        alter: true,
        logging: false
    })
}

export default { init: init, getContext: () => dbInstance };