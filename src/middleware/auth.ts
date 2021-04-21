import * as express from "express";
import * as moment from 'moment';
import Middleware from "./base";
import * as http from '../lib/http';
import User from '../db/models/user';
import UserApi from '../routes/api/user';
import * as authCntroller from '../lib/authorizationToken';
import RefreshToken from "../db/models/refreshToken";
import Helper from "../lib/helper";
const RememberMeStrategy = require("passport-remember-me").Strategy

var passport = require('passport')
    , LocalStrategy = require('passport-local').Strategy;

export var auth: AuthMiddleware;

class AuthMiddleware extends Middleware {

    private validateAccessToken(accessToken: authCntroller.IAccessTokenData) {
        return new Promise((resolve, reject) => {
            if (moment(accessToken.expiration_time).utc().isSameOrAfter(moment().utc())) {
                return User.findByPk(accessToken.userId).then((user) => {
                    return user ? resolve(user) : Promise.reject(new http.NotFoundError("invalid user"));
                })
            } else reject(new http.PermissionError(JSON.stringify({ message: 'Token Expired', PermissionErrorType: 'tokenExpire' })));
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


    public force(req: http.AppRequest, res: express.Response, next: Function, roles?: Array<string>) {
        if (!req.user)
            next(new http.PermissionError());
        else next();
    }

    constructor(app: express.IRouter) {
        super(app);
        app.use(passport.initialize());
        app.use(passport.session());
        app.use(passport.authenticate('remember-me'));

        passport.serializeUser(function (user, done) {
            done(null, user.id);
        });

        passport.deserializeUser(function (id, done) {
            User.findByPk(id).then(user => {
                if (user) {
                    user.loadPuanView().then(user => {
                        done(null, user);
                    }).catch(err=>done())
                } else done()
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
                    if (req['__onbehalf'] != user.id && !user.verifyPassword(password)) {
                        return done(null, false, { message: 'Incorrect user.' });
                    }
                    return done(null, user, { s: true });
                });
            }
        ));

        passport.use(new RememberMeStrategy(
            function(token, done) {
              RefreshToken.consume(token).then((result)=> {
                if (!result) { return done(null, false); }
                return done(null, result.user);
              }).catch((err) => done(err))
            },
            function(user, done) {
              var token = Helper.generateToken(64);
              let rt = new RefreshToken({
                  token: token,
                  userId: user.id
              })
              rt.save().then((rt) => done(null, token)).catch(err=>done(err))
            }
          ));

        app.post('/api/v1/authenticate',
            passport.authenticate('local', { successFlash: false, failureFlash: false }),
            
            function(req: http.AppRequest, res, next) {
                // issue a remember me cookie if the option was checked
                if (!req.body.remember_me) { 
                     res.clearCookie('remember_me');
                   return res.end() 
                }
            
                var token = Helper.generateToken(64);
                let rt = new RefreshToken({
                    userId: req.user.id,
                    token: token
                })
                rt.save().then(rt => {
                    res.cookie('remember_me', token, { path: '/', httpOnly: true, maxAge: 2*604800000 }); // 7 days
                    res.end()                    
                }).catch(err=> {
                    return next(err)
                })
              })                
    }
}


export default (app: express.Application) => auth = new AuthMiddleware(app);
