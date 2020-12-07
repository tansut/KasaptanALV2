import * as express from "express";
import * as moment from 'moment';
import Middleware from "./base";
import * as http from '../lib/http';
import User from '../db/models/user';
import UserApi from '../routes/api/user';
import * as authCntroller from '../lib/authorizationToken';
// const RememberMeStrategy = require("passport-remember-me").

var passport = require('passport')
    , LocalStrategy = require('passport-local').Strategy;

export var auth: AuthMiddleware;

class AuthMiddleware extends Middleware {

    private tryLoadUser(req: http.AppRequest, res: express.Response, next: Function) {

        var authHeader = req.cookies ? req.cookies["auth"] : null;
        if (!authHeader) {
            return next();
        }
        try {
            var accessToken = authCntroller.default.decryptAccessToken(authHeader);
            this.validateAccessToken(accessToken).then((user) => {
                req.user = <any>user;

                return next();
            }).catch((err) => {
                let perr = err instanceof http.PermissionError;
                if (perr) {
                    debugger;
                }
                next()
            }
            );
        } catch (e) {
            next();
        }
    }

    private validateAccessToken(accessToken: authCntroller.IAccessTokenData) {
        return new Promise((resolve, reject) => {
            //accessToken.expiration_time = moment().add('minute', -30).toDate()
            if (moment(accessToken.expiration_time).utc().isSameOrAfter(moment().utc())) {
                return User.findByPk(accessToken.userId).then((user) => {
                    return user ? resolve(user) : reject(new http.NotFoundError("invalid user"));
                })
            } else reject(new http.PermissionError(JSON.stringify({ message: 'Token Expired', PermissionErrorType: 'tokenExpire' })));
        });
    }

    public force(req: http.AppRequest, res: express.Response, next: Function, roles?: Array<string>) {
        if (!req.user)
            next(new http.PermissionError());
        else next();
    }

    constructor(app: express.IRouter) {
        super(app);
        app.use(passport.initialize());
        app.use(passport.session());
        // app.use(passport.authenticate('remember-me'));

        passport.serializeUser(function (user, done) {
            done(null, user.id);
        });

        passport.deserializeUser(function (id, done) {
            User.findByPk(id).then(user => {
                user.loadPuanView().then(user => {
                    done(null, user);
                }).catch(err=>done())
                
            }).catch(done);
        });

        passport.use(new LocalStrategy({
            passReqToCallback: true,
            usernameField: 'email',
            passwordField: 'password'
        },
            function (req, username, password, done) {
                User.retrieveByEMailOrPhone(username).then(user => {
                    if (!user) {
                        return done(null, false, { message: 'Incorrect user.' });
                    }
                    if (!user.verifyPassword(password)) {
                        return done(null, false, { message: 'Incorrect user.' });
                    }
                    return done(null, user, { s: true });
                    // user.loadPuanView().then(p=>{
                        
                    // }).catch(err=>{
                    //     return done(null, false, { message: 'Unknown error' });
                    // })
                });
            }
        ));



        app.post('/api/v1/authenticate',
            passport.authenticate('local', { failureFlash: true, successRedirect: "/api/v1/status", successFlash: true })
        );
        //app.use(this.tryLoadUser.bind(this));
    }
}


export default (app: express.Application) => auth = new AuthMiddleware(app);
