"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_typescript_1 = require("sequelize-typescript");
const butcher_1 = require("./models/butcher");
const config_1 = require("../config");
const user_1 = require("./models/user");
const refreshToken_1 = require("./models/refreshToken");
const resource_1 = require("./models/resource");
const area_1 = require("./models/area");
const sitelog_1 = require("./models/sitelog");
const category_1 = require("./models/category");
const order_1 = require("./models/order");
const product_1 = require("./models/product");
const productcategory_1 = require("./models/productcategory");
const resourcecategory_1 = require("./models/resourcecategory");
const butcherproduct_1 = require("./models/butcherproduct");
const content_1 = require("./models/content");
const dispatcher_1 = require("./models/dispatcher");
const webpage_1 = require("./models/webpage");
const redirect_1 = require("./models/redirect");
const pricecategory_1 = require("./models/pricecategory");
const butcherpricehistory_1 = require("./models/butcherpricehistory");
const review_1 = require("./models/review");
const payment_1 = require("./models/payment");
const accountmodel_1 = require("./models/accountmodel");
const subcategory_1 = require("./models/subcategory");
const butcherarea_1 = require("./models/butcherarea");
const dbcache_1 = require("./models/dbcache");
const nutritionvalue_1 = require("./models/nutritionvalue");
const nutritionvalueitem_1 = require("./models/nutritionvalueitem");
const temp_loc_1 = require("./models/temp_loc");
let dbInstance;
let init = (params) => {
    dbInstance = new sequelize_typescript_1.Sequelize({
        database: config_1.default.dbname,
        dialect: 'mysql',
        username: config_1.default.dbuser,
        password: config_1.default.dbpwd,
        port: config_1.default.dbport,
        host: config_1.default.dbaddress,
        logging: false,
        dialectOptions: { decimalNumbers: true }
    });
    dbInstance.addModels([temp_loc_1.default, dbcache_1.default, nutritionvalue_1.default, nutritionvalueitem_1.default, butcherarea_1.default, subcategory_1.default, payment_1.default, accountmodel_1.default, review_1.default, butcherpricehistory_1.default, pricecategory_1.default, redirect_1.default, webpage_1.default, butcher_1.default, order_1.Order, order_1.OrderItem, dispatcher_1.default, user_1.default, refreshToken_1.default, resource_1.default, area_1.default, sitelog_1.default, category_1.default, product_1.default, productcategory_1.default, butcherproduct_1.default, content_1.default, resourcecategory_1.default]);
    return dbInstance.sync({
        alter: true,
        logging: false
    });
};
exports.default = { init: init, getContext: () => dbInstance };
