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
import BanabikuryeCarProvider from './lib/logistic/banabikuryeprovidercar';
import ToBanabikuryeProvider from './lib/logistic/tobanabikurye';

const Sequelize = require('sequelize')

const wkx = require('wkx')
Sequelize.GEOMETRY.prototype._stringify = function _stringify(value, options) {
  return `ST_GeomFromText(${options.escape(wkx.Geometry.parseGeoJSON(value).toWkt())})`;
}
Sequelize.GEOMETRY.prototype._bindParam = function _bindParam(value, options) {
  return `ST_GeomFromText(${options.bindParam(wkx.Geometry.parseGeoJSON(value).toWkt())})`;
}
Sequelize.GEOGRAPHY.prototype._stringify = function _stringify(value, options) {
  return `ST_GeomFromText(${options.escape(wkx.Geometry.parseGeoJSON(value).toWkt())})`;
}
Sequelize.GEOGRAPHY.prototype._bindParam = function _bindParam(value, options) {
  return `ST_GeomFromText(${options.bindParam(wkx.Geometry.parseGeoJSON(value).toWkt())})`;
}


bluebird.config({
    warnings: false
});



class KasaptanAlApp {
    app: express.Application;
    apiRouter: express.Router;
    butcherApiRouter: express.Router;
    userApiRouter: express.Router;
    viewsRouter: express.Router;
    userRouter: express.Router;
    adminPagesRouter: express.Router;
    butcherPagesRouter: express.Router;
    operatorPagesRouter: express.Router;
    sitemap: any;
    server: http.Server;
    connections = [];

    async shutDown() {
        //console.log('Received kill signal, shutting down gracefully');

        // this.server.close(function(err) {
        //       Tasks.stop().finally(() => {
        //         db.getContext().close().finally(()=> {
        //             process.exit(err ? 1 : 0);
        //           })
        //       })
        //     });
    
        // setTimeout(() => {
        //     console.error('Could not close connections in time, forcefully shutting down');
        //     process.exit(1);
        // }, 10000);
    
        // this.connections.forEach(curr => curr.end());
        // setTimeout(() => this.connections.forEach(curr => curr.destroy()), 5000);
    }

    async shopcard() {


        this.app.use((req: AppRequest, res, next) => {
            let list = [];
            if (req.user && req.session.shopcard != null) {
                req.user.shopcard = req.session.shopcard;
                req.session.shopcard = null;
                list.push(req.user.save());
            } else if (req.user && req.user.shopcard && req.session.shopcard != null) {
            }


            Promise.all(list).then(r => {
                res.locals.__shopcard = () => (req.user ? req.user.shopcard : req.session.shopcard);
                next();
            }).catch(next)
        })
    }

    constructor() {

    }

    async bootstrap() {

        let dbinstance = await db.init(false);        
        this.app = express();
        this.app.use(compression())
        this.app.use(fileUpload())
        this.app.use(cors({

        }))

        const sequelizeSessionStore = new SessionStore({
            db: dbinstance,
        });

        let sess = {
            secret: 'kasaplarin efendisi',
            cookie: <any>{},
            store: sequelizeSessionStore,
            resave: false,
            saveUninitialized: true
        }

        if (config.nodeenv === 'production') {
            this.app.set('trust proxy', 1) // trust first proxy
            sess.cookie.secure = true // serve secure cookies
        }

        iyzico.register();
        paratika.register();
        BanabikuryeProvider.register();
        BanabikuryeCarProvider.register();
        ButcherManualLogistics.register();
        ButcherAutoLogistics.register();
        ToBanabikuryeProvider.register();
        this.app.use((req, res, next) => {
            let proto = req.header("x-forwarded-proto") || null;
            let host = (req.get('Host') || "").toLowerCase();

            if (proto && host == "kasaptanal.com")
                return res.redirect(301, "https://www.kasaptanal.com" + req.originalUrl)

            // if (proto && proto != "https")
            //     return res.redirect(301, "https://www.kasaptanal.com" + req.originalUrl)

            return next()
        })


        this.app.use(cookieParser());
        this.app.use(session(sess));
        // this.app.set('etag', 'strong');  

        this.apiRouter = express.Router();
        this.adminPagesRouter = express.Router();
        this.butcherApiRouter = express.Router();
        this.userApiRouter = express.Router();
        
        this.userRouter = express.Router();
        this.viewsRouter = express.Router();
        this.butcherPagesRouter = express.Router();
        this.operatorPagesRouter = express.Router();

        this.app.use(bp.json())
        this.app.use(bp.urlencoded({ extended: false }));
        this.app.use(bp.text());
        this.app.use(bp.raw());
        this.app.use(flash());

        middlewares.use(this.app);
        CacheManager.use(this.app);
        RequestHelper.use(this.app);
        this.shopcard()

        this.app.use('/robots.txt', function (req, res, next) {
            res.sendFile(path.join(__dirname, '../public/robots.txt'));
        });

        this.app.use('/apple-app-site-association', function (req, res, next) {
            res.sendFile(path.join(__dirname, '../apple-app-site-association.json'));
        });

        

        if (config.nodeenv == 'development') {
            this.app.use('/static/resource', express.static(path.join(__dirname, '../public')));            
            this.app.use('/static', express.static(path.join(__dirname, '../public')));            
        } else {

        }
        this.app.set('view engine', 'ejs');
        this.app.set('views', path.join(__dirname, '../src/views'));
 



        this.app.use('/api/v1', this.apiRouter);

        this.app.use('/api/v1/butcher', (req: AppRequest, res, next) => {
            if (req.user && (req.user.hasRole('admin') || req.user.hasRole('butcher')))
                next();
            else res.redirect('/login?r=' + req.originalUrl)
        }, this.butcherApiRouter);

        this.app.use('/api/v1/user', (req: AppRequest, res, next) => {
            if (req.user)
                next();
            else res.redirect('/login?r=' + req.originalUrl)
        }, this.userApiRouter);

        this.app.use('/pages/admin', (req: AppRequest, res, next) => {
            if (req.user && (req.user.hasRole('admin') || req.user.hasRole('seo')))
                next();
            else res.redirect('/login?r=' + req.originalUrl)
        }, this.adminPagesRouter);

        this.app.use('/kasapsayfam', (req: AppRequest, res, next) => {
            if (req.user && (req.user.hasRole('butcher') || req.user.hasRole('admin')))
                next();
            else res.redirect('/login?r=' + req.originalUrl)
        }, this.butcherPagesRouter); 

        this.app.use('/pages/operator', (req: AppRequest, res, next) => {
            if (req.user && (req.user.hasRole('admin') || req.user.hasRole('operator')))
                next();
            else res.redirect('/login?r=' + req.originalUrl)
        }, this.operatorPagesRouter);                     

        this.app.use('/user', (req: AppRequest, res, next) => {
            if (!req.user) res.redirect('/login')
            else next()
        }, this.userRouter);

        this.app.use("/", this.viewsRouter);
        apiRoutes.use(this.apiRouter);
        butcherApiRoutes.use(this.butcherApiRouter);
        userApiRoutes.use(this.userApiRouter);
        adminPageRoutes.use(this.adminPagesRouter);
        butcherPageRoutes.use(this.butcherPagesRouter);
        operatorPageRoutes.use(this.operatorPagesRouter);
        ViewRoutes.use(this.viewsRouter);
        UserRoutes.use(this.userRouter);

        ErrorMiddleware(this.app);

        const server = this.server = http.createServer(this.app);

        server.once('error', (err: any) => {
            if (err.code === 'EADDRINUSE') {
                console.log(err);
                process.exit(2);
            }
        });

  
        // process.on('SIGTERM', this.shutDown.bind(this));
        // process.on('SIGINT', this.shutDown.bind(this));


        // server.on('connection', connection => {
        //     this.connections.push(connection);
        //     connection.on('close', () => this.connections = this.connections.filter(curr => curr !== connection));
        // });


        await new Promise<void>((resolve, reject) => {
            server.listen(config.port, () => {
                resolve();
                process.send && process.send("ready")
            });
        });

        

    }
}

export var App: KasaptanAlApp;

export default () => (App = new KasaptanAlApp());




