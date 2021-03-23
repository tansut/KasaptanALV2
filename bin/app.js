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
bluebird.config({
    warnings: false
});
class KasaptanAlApp {
    constructor() {
        this.connections = [];
    }
    shutDown() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('Received kill signal, shutting down gracefully');
            this.server.close(function (err) {
                index_5.default.stop().finally(() => {
                    context_1.default.getContext().close().finally(() => {
                        process.exit(err ? 1 : 0);
                    });
                });
            });
            setTimeout(() => {
                console.error('Could not close connections in time, forcefully shutting down');
                process.exit(1);
            }, 10000);
            this.connections.forEach(curr => curr.end());
            setTimeout(() => this.connections.forEach(curr => curr.destroy()), 5000);
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
                Promise.all(list).then(r => {
                    res.locals.__shopcard = () => (req.user ? req.user.shopcard : req.session.shopcard);
                    next();
                }).catch(next);
            });
        });
    }
    bootstrap() {
        return __awaiter(this, void 0, void 0, function* () {
            let dbinstance = yield context_1.default.init(false);
            this.app = express();
            this.app.use(compression());
            this.app.use(fileUpload());
            this.app.use(cors({}));
            const sequelizeSessionStore = new SessionStore({
                db: dbinstance,
            });
            let sess = {
                secret: 'kasaplarin efendisi',
                cookie: {},
                store: sequelizeSessionStore,
                resave: false,
                saveUninitialized: true
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
            // this.app.set('etag', 'strong');  
            this.apiRouter = express.Router();
            this.adminPagesRouter = express.Router();
            this.butcherApiRouter = express.Router();
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
            server.on('connection', connection => {
                this.connections.push(connection);
                connection.on('close', () => this.connections = this.connections.filter(curr => curr !== connection));
            });
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
