import { ApiRouter, ViewRouter } from '../lib/router';
import * as express from "express";
import * as maps from "@google/maps"
import ButcherModel from '../db/models/butcher';
import moment = require('moment');
import { Auth } from '../lib/common';
import AreaModel from '../db/models/area';
import Helper from '../lib/helper';
import Area from '../db/models/area';
import Category from '../db/models/category';
import Content from '../db/models/content';
import config from '../config';
import * as path from 'path';
import * as fs from 'fs';
import { readFileSync } from 'fs';
import UserRoute from './api/user';
let ellipsis = require('text-ellipsis');
var MarkdownIt = require('markdown-it')

export default class Route extends ViewRouter {

    showLogin = false;
    loginUser = '';
    redirect = ""

    renderPage(msg: any = undefined) {
        this.sendView(`pages/resetpassword.ejs`, {
            _usrmsg: msg
        })
    }

    renderPage2(msg: any = undefined) {
        this.sendView(`pages/resetpasswordnew.ejs`, {
            _usrmsg: msg
        })
    }

    @Auth.Anonymous()
    async resetRoute() {

        let email = (this.req.body["recover-email"] || "").toLowerCase();
        let phone = this.req.body["recover-tel"];
        if (email && phone) {
            let userRoute = new UserRoute(this.constructorParams);
            let user = await userRoute.retrieveByEMailOrPhone(phone);
            if (user) {
                if (user.email.toLowerCase() == email) {
                    await userRoute.sendNewPassword(user);
                    this.showLogin = true;
                    this.loginUser = Helper.getPhoneNumber(phone);
                    this.redirect = this.req.query.r as string
                    this.renderPage({ text: "Yeni şifreniz telefonunuza gönderildi. Şifrenizi kullanarak giriş yapabilirsiniz.", type: "info" });
                } else {
                    this.renderPage({ text: "Geçersiz e-posta adresi/telefon numarası.", type: "danger" });
                }
            } else this.renderPage({ text: "Geçersiz telefon numarası", type: "danger" });
        } else this.renderPage({ text: "Geçersiz e-posta adresi veya telefon numarası.", type: "danger" });
    }


    @Auth.Anonymous()
    async viewRoute() {

        this.renderPage();
    }

    @Auth.Anonymous()
    async viewRoute2() {
        this.renderPage2()
    }

    @Auth.Anonymous()
    async resetRoute2() {
        let resetkey = this.req.body["k"];
        let newPassword = this.req.body["newpass"];
        if (resetkey && newPassword) {
            let userRoute = new UserRoute(this.constructorParams);

            try {
                let user = await userRoute.resetPasswordWithToken(resetkey, newPassword);
                this.showLogin = true;
                this.loginUser = Helper.getPhoneNumber(user.mphone);
                this.redirect = this.req.query.r as string
                this.renderPage2({ text: 'Şifrenizi başarıyla oluşturduk, giriş yapabilirsiniz.', type: "info" });

            } catch (err) {
                this.renderPage2({ text: err.message, type: "danger" });
            }

        } else   this.renderPage2({ text: 'Geçersiz işlem', type: "danger" });
    }

    static SetRoutes(router: express.Router) {
        router.get("/reset-password", Route.BindRequest(Route.prototype.viewRoute));
        router.post("/reset-password", Route.BindRequest(Route.prototype.resetRoute));

        router.get("/rpwd", Route.BindRequest(Route.prototype.viewRoute2));
        router.post("/rpwd", Route.BindRequest(Route.prototype.resetRoute2));

        router.get('/login', Route.BindToView("pages/login.ejs"))
        router.get('/signup', Route.BindToView("pages/signup.ejs"))
    }
}