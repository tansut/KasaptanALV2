"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.App = void 0;
const express = require("express");
const compression = require('compression');
// const ipfilter = require('express-ipfilter').IpFilter
const fs = require('fs');
const bp = require("body-parser");
const http = require("http");
const config_1 = require("./config");
const path = require("path");
const cors = require("cors");
const admin_1 = require("./routes/admin");
const index_1 = require("./routes/butcher/index");
const index_2 = require("./routes/operator/index");
const api_1 = require("./routes/api");
const butcherapirouter_1 = require("./routes/api/butcherapirouter");
const adminapirouter_1 = require("./routes/api/adminapirouter");
const userapirouter_1 = require("./routes/api/userapirouter");
const context_1 = require("./db/context");
const index_3 = require("./routes/index");
const user_1 = require("./routes/user");
const session = require("express-session");
const cache_1 = require("./lib/cache");
const index_4 = require("./middleware/index");
const error_1 = require("./middleware/error");
const cookieParser = require("cookie-parser");
const flash = require('connect-flash');
const RequestHelper_1 = require("./lib/RequestHelper");
const iyzico_1 = require("./lib/payment/iyzico");
const index_5 = require("./lib/tasks/index");
const paratika_1 = require("./lib/payment/paratika");
const SessionStore = require('express-session-sequelize')(session.Store);
const fileUpload = require('express-fileupload');
const bluebird = require("bluebird");
const banabikurye_1 = require("./lib/logistic/banabikurye");
const butcher_1 = require("./lib/logistic/butcher");
const banabikuryeprovidercar_1 = require("./lib/logistic/banabikuryeprovidercar");
const tobanabikurye_1 = require("./lib/logistic/tobanabikurye");
const shopcard_1 = require("./models/shopcard");
const winston = require('winston');
const expressWinston = require('express-winston');
const Sequelize = require('sequelize');
const wkx = require('wkx');
Sequelize.GEOMETRY.prototype._stringify = function _stringify(value, options) {
    return `ST_GeomFromText(${options.escape(wkx.Geometry.parseGeoJSON(value).toWkt())})`;
};
Sequelize.GEOMETRY.prototype._bindParam = function _bindParam(value, options) {
    return `ST_GeomFromText(${options.bindParam(wkx.Geometry.parseGeoJSON(value).toWkt())})`;
};
Sequelize.GEOGRAPHY.prototype._stringify = function _stringify(value, options) {
    return `ST_GeomFromText(${options.escape(wkx.Geometry.parseGeoJSON(value).toWkt())})`;
};
Sequelize.GEOGRAPHY.prototype._bindParam = function _bindParam(value, options) {
    return `ST_GeomFromText(${options.bindParam(wkx.Geometry.parseGeoJSON(value).toWkt())})`;
};
bluebird.config({
    warnings: false
});
class KasaptanAlApp {
    constructor() {
        this.connections = [];
    }
    shutDown() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('App: received kill signal');
            index_5.default.stop().finally(() => {
                context_1.default.getContext().close().finally(() => {
                    process.exit(0);
                });
            });
            setTimeout(() => {
                console.error('App: forcefully shutting down');
                process.exit(1);
            }, 15000);
            // this.server.close(function(err) {
            //     });
            // this.connections.forEach(curr => curr.end());
            // setTimeout(() => this.connections.forEach(curr => curr.destroy()), 5000);
        });
    }
    shopcard() {
        return __awaiter(this, void 0, void 0, function* () {
            this.app.use((req, res, next) => {
                let list = [];
                if (req.user && req.session.shopcard != null) {
                    req.user.shopcard = req.session.shopcard;
                    req.session.shopcard = null;
                    list.push(req.user.save());
                }
                else if (req.user && req.user.shopcard && req.session.shopcard != null) {
                }
                shopcard_1.ShopCard.createFromRequest(req).then(sc => {
                    req.shopCard = sc;
                    next();
                }).catch(next);
                // Promise.all(list).then(r => {
                //     ShopCard.createFromRequest(req).then(sc=>{
                //         res.locals.__shopcard = sc;
                //         res.locals.__shopcard = () => (req.user ? req.user.shopcard : req.session.shopcard);
                //         next();
                //     }).catch(next)
                //     //res.locals.__shopcard = () => (req.user ? req.user.shopcard : req.session.shopcard);
                // }).catch(next)
            });
        });
    }
    bootstrap() {
        return __awaiter(this, void 0, void 0, function* () {
            let dbinstance = yield context_1.default.init(false);
            this.app = express();
            this.app.use(compression());
            let serverConfigFile = yield fs.readFileSync(path.join(__dirname, "../server.json"));
            let serverConfig = JSON.parse(serverConfigFile);
            this.app.use((req, res, next) => {
                let ip = req.headers['x-forwarded-for'] ? (req.headers['x-forwarded-for']) : req.connection.remoteAddress;
                if (serverConfig.blockedips.indexOf(ip) == -1)
                    return next();
                console.log('Blocked' + ip);
                res.sendStatus(403);
            });
            this.app.use(fileUpload());
            this.app.use(cors({}));
            const sequelizeSessionStore = new SessionStore({
                db: dbinstance
            }, function () {
                sequelizeSessionStore.setExpirationInterval();
            });
            let sess = {
                secret: 'kasaplarin efendisi',
                cookie: {},
                store: sequelizeSessionStore,
                resave: false,
                saveUninitialized: false,
            };
            if (config_1.default.nodeenv === 'production') {
                this.app.set('trust proxy', 1); // trust first proxy
                sess.cookie.secure = true; // serve secure cookies
            }
            iyzico_1.default.register();
            paratika_1.default.register();
            banabikurye_1.default.register();
            banabikuryeprovidercar_1.default.register();
            butcher_1.ButcherManualLogistics.register();
            butcher_1.ButcherAutoLogistics.register();
            tobanabikurye_1.default.register();
            this.app.use((req, res, next) => {
                let proto = req.header("x-forwarded-proto") || null;
                let host = (req.get('Host') || "").toLowerCase();
                if (proto && host == "kasaptanal.com")
                    return res.redirect(301, "https://www.kasaptanal.com" + req.originalUrl);
                // if (proto && proto != "https")
                //     return res.redirect(301, "https://www.kasaptanal.com" + req.originalUrl)
                return next();
            });
            this.app.use(cookieParser());
            this.app.use(session(sess));
            this.apiRouter = express.Router();
            this.adminPagesRouter = express.Router();
            this.butcherApiRouter = express.Router();
            this.adminApiRouter = express.Router();
            this.userApiRouter = express.Router();
            this.userRouter = express.Router();
            this.viewsRouter = express.Router();
            this.butcherPagesRouter = express.Router();
            this.operatorPagesRouter = express.Router();
            this.app.use(bp.json());
            this.app.use(bp.urlencoded({ extended: false }));
            this.app.use(bp.text());
            this.app.use(bp.raw());
            this.app.use(flash());
            // this.app.use(expressWinston.logger({
            //     transports: [
            //       new winston.transports.Console()
            //     ],
            //     format: winston.format.combine(
            //       winston.format.colorize(),
            //       winston.format.json()
            //     ),
            //     meta: true,
            //     msg: "HTTP {{req.method}} {{req.url}}",
            //     expressFormat: true,
            //     colorize: false,
            //     ignoreRoute: function (req, res) { return false; }
            //   }));
            this.app.use((req, res, next) => {
                if (typeof req.session.isNew === "undefined") {
                    req.session.isNew = true;
                    req.session.save(next);
                }
                else if (req.session.isNew) {
                    req.session.isNew = false;
                    req.session.save(next);
                }
                else {
                    next();
                }
            });
            index_4.default.use(this.app);
            cache_1.CacheManager.use(this.app);
            RequestHelper_1.RequestHelper.use(this.app);
            this.shopcard();
            this.app.use('/robots.txt', function (req, res, next) {
                res.sendFile(path.join(__dirname, '../public/robots.txt'));
            });
            this.app.use('/apple-app-site-association', function (req, res, next) {
                res.sendFile(path.join(__dirname, '../apple-app-site-association.json'));
            });
            if (config_1.default.nodeenv == 'development') {
                this.app.use('/static/resource', express.static(path.join(__dirname, '../public')));
                this.app.use('/static', express.static(path.join(__dirname, '../public')));
            }
            else {
            }
            this.app.set('view engine', 'ejs');
            this.app.set('views', path.join(__dirname, '../src/views'));
            this.app.use('/api/v1', this.apiRouter);
            this.app.use('/api/v1/butcher', (req, res, next) => {
                if (req.user && (req.user.hasRole('admin') || req.user.hasRole('butcher')))
                    next();
                else
                    res.redirect('/login?r=' + req.originalUrl);
            }, this.butcherApiRouter);
            this.app.use('/api/v1/admin', (req, res, next) => {
                if (req.user && (req.user.hasRole('admin')))
                    next();
                else
                    res.redirect('/login?r=' + req.originalUrl);
            }, this.adminApiRouter);
            this.app.use('/api/v1/user', (req, res, next) => {
                if (req.user)
                    next();
                else
                    res.redirect('/login?r=' + req.originalUrl);
            }, this.userApiRouter);
            this.app.use('/pages/admin', (req, res, next) => {
                if (req.user && (req.user.hasRole('admin') || req.user.hasRole('seo')))
                    next();
                else
                    res.redirect('/login?r=' + req.originalUrl);
            }, this.adminPagesRouter);
            this.app.use('/kasapsayfam', (req, res, next) => {
                if (req.user && (req.user.hasRole('butcher') || req.user.hasRole('admin')))
                    next();
                else
                    res.redirect('/login?r=' + req.originalUrl);
            }, this.butcherPagesRouter);
            this.app.use('/pages/operator', (req, res, next) => {
                if (req.user && (req.user.hasRole('admin') || req.user.hasRole('operator')))
                    next();
                else
                    res.redirect('/login?r=' + req.originalUrl);
            }, this.operatorPagesRouter);
            this.app.use('/user', (req, res, next) => {
                if (!req.user)
                    res.redirect('/login');
                else
                    next();
            }, this.userRouter);
            this.app.use("/", this.viewsRouter);
            api_1.default.use(this.apiRouter);
            adminapirouter_1.default.use(this.adminApiRouter);
            butcherapirouter_1.default.use(this.butcherApiRouter);
            userapirouter_1.default.use(this.userApiRouter);
            admin_1.default.use(this.adminPagesRouter);
            index_1.default.use(this.butcherPagesRouter);
            index_2.default.use(this.operatorPagesRouter);
            index_3.default.use(this.viewsRouter);
            user_1.default.use(this.userRouter);
            error_1.default(this.app);
            const server = this.server = http.createServer(this.app);
            server.once('error', (err) => {
                if (err.code === 'EADDRINUSE') {
                    console.log(err);
                    process.exit(2);
                }
            });
            process.on('SIGTERM', this.shutDown.bind(this));
            process.on('SIGINT', this.shutDown.bind(this));
            // server.on('connection', connection => {
            //     this.connections.push(connection);
            //     connection.on('close', () => this.connections = this.connections.filter(curr => curr !== connection));
            // });
            yield new Promise((resolve, reject) => {
                server.listen(config_1.default.port, () => {
                    resolve();
                    process.send && process.send("ready");
                });
            });
        });
    }
}
exports.default = () => (exports.App = new KasaptanAlApp());
