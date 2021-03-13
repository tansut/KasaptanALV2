import * as express from 'express';
const compression = require('compression')

import * as bp from 'body-parser';
import * as http from 'http';
import { AppRequest } from './lib/http'
import config from "./config";
import * as path from 'path';
import * as cors from 'cors';
import adminPageRoutes from './routes/admin';
import butcherPageRoutes from './routes/butcher/index';
import operatorPageRoutes from './routes/operator/index';
import apiRoutes from './routes/api';
import butcherApiRoutes from './routes/api/butcherapirouter';
import userApiRoutes from './routes/api/userapirouter';
import db from "./db/context";
import User from './db/models/user';
import UserRoute from './routes/api/user';
import ViewRoutes from './routes/index';
import UserRoutes from './routes/user';
import Butcher from './routes/api/butcher';
import Area from './db/models/area';
import * as session from "express-session";
import { CacheManager } from "./lib/cache";
import Category from './db/models/category';
import * as _ from "lodash";
import middlewares from './middleware/index'
import ErrorMiddleware from './middleware/error'
import * as cookieParser from 'cookie-parser';
const flash = require('connect-flash');
import { RequestHelper } from './lib/RequestHelper';
import iyzico from './lib/payment/iyzico';
import Tasks from './lib/tasks/index';
import paratika from './lib/payment/paratika';

const SessionStore = require('express-session-sequelize')(session.Store);
const fileUpload = require('express-fileupload');

import * as bluebird from "bluebird";
import BanabikuryeProvider from './lib/logistic/banabikurye';
import { ButcherManualLogistics, ButcherAutoLogistics } from './lib/logistic/butcher';

bluebird.config({
    warnings: false
});



class KasaptanAlTasksApp {


    async shutDown() {
        console.log('Received kill signal taks, shutting down gracefully');

        Tasks.stop().finally(() => {
            db.getContext().close().finally(()=> {
                process.exit(0);
              })
          })
    

    }



    constructor() {

    }

    async bootstrap() {

        let dbinstance = await db.init(false);        


    

  
        process.on('SIGTERM', this.shutDown.bind(this));
        process.on('SIGINT', this.shutDown.bind(this));
        await Tasks.start()
    }
}

export var App: KasaptanAlTasksApp;

export default () => (App = new KasaptanAlTasksApp());




