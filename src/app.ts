import * as express from 'express';
import * as bp from 'body-parser';
import * as http from 'http';
import { AppRequest } from './lib/http'
import config from "./config";
import * as path from 'path';
import * as cors from 'cors';
import adminPageRoutes from './routes/admin';
import apiRoutes from './routes/api';
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

const SessionStore = require('express-session-sequelize')(session.Store);
const fileUpload = require('express-fileupload');

import * as bluebird from "bluebird";

bluebird.config({
    warnings: false
});

class KasaptanAlApp {
    app: express.Application;
    apiRouter: express.Router;
    viewsRouter: express.Router;
    userRouter: express.Router;
    adminPagesRouter: express.Router;



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

        let dbinstance = await db.init();
        await Area.fillCities();
        this.app = express();
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


        this.app.use((req, res, next) => {
            let proto = req.header("x-forwarded-proto") || null;
            let host = (req.get('Host') || "").toLowerCase();

            if (proto && host == "kasaptanal.com")
                return res.redirect(301, "https://www.kasaptanal.com" + req.originalUrl)

            if (proto && proto != "https")
                return res.redirect(301, "https://www.kasaptanal.com" + req.originalUrl)

            return next()
        })


        this.app.use(cookieParser());
        this.app.use(session(sess));
        // this.app.set('etag', 'strong');  

        this.apiRouter = express.Router();
        this.adminPagesRouter = express.Router();
        this.userRouter = express.Router();
        this.viewsRouter = express.Router();

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
            res.sendFile(config.publicDir + '/robots.txt');
        });

        if (config.nodeenv == 'development') {
            this.app.use('/', express.static(config.publicDir));
        } else {
        }
        // this.app.use('/js', express.static(path.join(__dirname, '../node_modules/bootstrap/dist/js')));
        // this.app.use('/js', express.static(path.join(__dirname, '../node_modules/jquery/dist')));
        // this.app.use('/js', express.static(path.join(__dirname, '../node_modules/vue/dist')));
        // this.app.use('/css', express.static(path.join(__dirname, '../node_modules/bootstrap/dist/css')));

        this.app.set('view engine', 'ejs');
        this.app.set('views', path.join(__dirname, '../src/views'));

        this.app.use('/api/v1', this.apiRouter);
        this.app.use('/pages/admin', (req: AppRequest, res, next) => {
            if (req.user && (req.user.hasRole('admin') || req.user.hasRole('seo')))
                next();
            else res.redirect('/login?r=' + req.originalUrl)
        }, this.adminPagesRouter);

        this.app.use('/user', (req: AppRequest, res, next) => {
            if (!req.user) res.redirect('/login')
            else next()
        }, this.userRouter);

        this.app.use("/", this.viewsRouter);
        apiRoutes.use(this.apiRouter);
        adminPageRoutes.use(this.adminPagesRouter);
        ViewRoutes.use(this.viewsRouter);
        UserRoutes.use(this.userRouter);

        ErrorMiddleware(this.app);

        const server = http.createServer(this.app);

        server.once('error', (err: any) => {
            if (err.code === 'EADDRINUSE') {
                console.log(err);
                process.exit(2);
            }
        });

        return new Promise((resolve, reject) => {
            server.listen(config.port, () => {
                resolve();
            });
        });


    }
}

export var App: KasaptanAlApp;

export default () => (App = new KasaptanAlApp());




