"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.auth = void 0;
const moment = require("moment");
const base_1 = require("./base");
const http = require("../lib/http");
const user_1 = require("../db/models/user");
const refreshToken_1 = require("../db/models/refreshToken");
const helper_1 = require("../lib/helper");
const RememberMeStrategy = require("passport-remember-me").Strategy;
var passport = require('passport'), LocalStrategy = require('passport-local').Strategy;
class AuthMiddleware extends base_1.default {
    validateAccessToken(accessToken) {
        return new Promise((resolve, reject) => {
            if (moment(accessToken.expiration_time).utc().isSameOrAfter(moment().utc())) {
                return user_1.default.findByPk(accessToken.userId).then((user) => {
                    return user ? resolve(user) : Promise.reject(new http.NotFoundError("invalid user"));
                });
            }
            else
                reject(new http.PermissionError(JSON.stringify({ message: 'Token Expired', PermissionErrorType: 'tokenExpire' })));
        });
    }
    // private tryLoadUser(req: http.AppRequest, res: express.Response, next: Function) {
    //     var authHeader = req.cookies ? req.cookies["auth"] : null;
    //     if (!authHeader) {
    //         return next();
    //     }
    //     try {
    //         var accessToken = authCntroller.default.decryptAccessToken(authHeader);
    //         this.validateAccessToken(accessToken).then((user) => {
    //             req.user = <any>user;
    //             return next();
    //         }).catch((err) => {
    //             let perr = err instanceof http.PermissionError;
    //             if (perr) {
    //                 debugger;
    //             }
    //             next()
    //         }
    //         );
    //     } catch (e) {
    //         next();
    //     }
    // }
    force(req, res, next, roles) {
        if (!req.user)
            next(new http.PermissionError());
        else
            next();
    }
    constructor(app) {
        super(app);
        app.use(passport.initialize());
        app.use(passport.session());
        app.use(passport.authenticate('remember-me'));
        passport.serializeUser(function (user, done) {
            done(null, user.id);
        });
        passport.deserializeUser(function (id, done) {
            user_1.default.findByPk(id).then(user => {
                if (user) {
                    user.loadPuanView().then(user => {
                        done(null, user);
                    }).catch(err => done());
                }
                else
                    done();
            }).catch(done);
        });
        passport.use(new LocalStrategy({
            passReqToCallback: true,
            usernameField: 'email',
            passwordField: 'password'
        }, function (req, username, password, done) {
            user_1.default.retrieveByEMailOrPhone(username).then(user => {
                if (!user) {
                    return done(null, false, { message: 'Incorrect user.' });
                }
                if (req && req.body.behalfToken && (req.body.behalfToken == user.behalfLoginToken)) {
                    return done(null, user, { s: true });
                }
                else if (!user.verifyPassword(password)) {
                    return done(null, false, { message: 'Incorrect user.' });
                }
                else
                    return done(null, user, { s: true });
            });
        }));
        passport.use(new RememberMeStrategy(function (token, done) {
            refreshToken_1.default.consume(token).then((result) => {
                if (!result) {
                    return done(null, false);
                }
                return done(null, result.user);
            }).catch((err) => done(err));
        }, function (user, done) {
            var token = helper_1.default.generateToken(64);
            let rt = new refreshToken_1.default({
                token: token,
                userId: user.id
            });
            rt.save().then((rt) => done(null, token)).catch(err => done(err));
        }));
        app.post('/api/v1/authenticate', passport.authenticate('local', { successFlash: false, failureFlash: false }), function (req, res, next) {
            // issue a remember me cookie if the option was checked
            if (!req.body.remember_me) {
                res.clearCookie('remember_me');
                return res.end();
            }
            var token = helper_1.default.generateToken(64);
            let rt = new refreshToken_1.default({
                userId: req.user.id,
                token: token
            });
            rt.save().then(rt => {
                res.cookie('remember_me', token, { path: '/', httpOnly: true, maxAge: 2 * 604800000 }); // 7 days
                res.end();
            }).catch(err => {
                return next(err);
            });
        });
    }
}
exports.default = (app) => exports.auth = new AuthMiddleware(app);
