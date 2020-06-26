"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.auth = void 0;
const moment = require("moment");
const base_1 = require("./base");
const http = require("../lib/http");
const user_1 = require("../db/models/user");
const authCntroller = require("../lib/authorizationToken");
// const RememberMeStrategy = require("passport-remember-me")
var passport = require('passport'), LocalStrategy = require('passport-local').Strategy;
class AuthMiddleware extends base_1.default {
    tryLoadUser(req, res, next) {
        var authHeader = req.cookies ? req.cookies["auth"] : null;
        if (!authHeader) {
            return next();
        }
        try {
            var accessToken = authCntroller.default.decryptAccessToken(authHeader);
            this.validateAccessToken(accessToken).then((user) => {
                req.user = user;
                return next();
            }).catch((err) => {
                let perr = err instanceof http.PermissionError;
                if (perr) {
                    debugger;
                }
                next();
            });
        }
        catch (e) {
            next();
        }
    }
    validateAccessToken(accessToken) {
        return new Promise((resolve, reject) => {
            //accessToken.expiration_time = moment().add('minute', -30).toDate()
            if (moment(accessToken.expiration_time).utc().isSameOrAfter(moment().utc())) {
                return user_1.default.findByPk(accessToken.userId).then((user) => {
                    return user ? resolve(user) : reject(new http.NotFoundError("invalid user"));
                });
            }
            else
                reject(new http.PermissionError(JSON.stringify({ message: 'Token Expired', PermissionErrorType: 'tokenExpire' })));
        });
    }
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
        // app.use(passport.authenticate('remember-me'));
        passport.serializeUser(function (user, done) {
            done(null, user.id);
        });
        passport.deserializeUser(function (id, done) {
            user_1.default.findByPk(id).then(user => {
                done(null, user);
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
                if (!user.verifyPassword(password)) {
                    return done(null, false, { message: 'Incorrect user.' });
                }
                return done(null, user, { s: true });
            });
        }));
        app.post('/api/v1/authenticate', passport.authenticate('local', { failureFlash: true, successRedirect: "/api/v1/status", successFlash: true }));
        //app.use(this.tryLoadUser.bind(this));
    }
}
exports.default = (app) => exports.auth = new AuthMiddleware(app);
