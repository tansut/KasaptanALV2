"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
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
const refreshToken_1 = require("../../db/models/refreshToken");
const router_1 = require("../../lib/router");
const user_1 = require("../../db/models/user");
const config_1 = require("../../config");
const http = require("../../lib/http");
const bcrypt = require("bcryptjs");
const moment = require("moment");
const crypto = require("crypto");
const common_1 = require("../../lib/common");
const helper_1 = require("../../lib/helper");
const sms_1 = require("../../lib/sms");
const email_1 = require("../../lib/email");
const sitelog_1 = require("./sitelog");
const area_1 = require("../../db/models/area");
var validator = require("validator");
var generator = require('generate-password');
let passport = require("passport");
const sq = require("sequelize");
class UserRoute extends router_1.ApiRouter {
    // createSample() {
    //     // userroute.authenticate("tansut@gmail.com", "deneme1").then((user) => {
    //     //     console.log(user)
    //     // })
    //     return this.create({
    //         email: "tansut@gmail.com",
    //         password: "deneme1",
    //         roles: ["admin"]
    //     }).then((user) => {
    //         console.log(user.id);
    //         debugger;
    //     }).catch((err) => {
    //         console.log(err)
    //     })
    // }
    sendResetLink() {
        return __awaiter(this, void 0, void 0, function* () {
            let phone = this.req.body.phone;
            let user = yield this.retrieveByEMailOrPhone(phone);
            if (!user)
                throw Error('Geçersiz telefon no');
            user.resetToken = crypto.randomBytes(32).toString('hex');
            ;
            let utc = helper_1.default.UtcNow();
            let res = moment(utc).add('minutes', 30).toDate();
            user.resetTokenValid = res;
            yield user.save();
            yield sms_1.Sms.send(user.mphone, `KasaptanAl.com sifrenizi yenilemek icin ${this.url}/rpwd?k=${user.resetToken}`, true, null);
            this.res.sendStatus(200);
        });
    }
    resetPasswordWithToken(resetKey, newPassword) {
        return __awaiter(this, void 0, void 0, function* () {
            let user = yield user_1.default.findOne({
                where: {
                    resetToken: resetKey
                }
            });
            if (!user)
                throw new Error('Geçersiz işlem numarası');
            if (user.resetTokenValid) {
                var diff = (user.resetTokenValid.getTime() - helper_1.default.UtcNow().getTime()) / 1000;
                let min = Math.round(diff /= 60);
                if (min < 0)
                    throw new Error('İşlem süresi dolmuş, lütfen yeniden şifre yenileme talebi iletin');
            }
            else
                throw new Error('Geçersiz işlem');
            user.resetTokenValid = null;
            user.resetToken = null;
            user.setPassword(newPassword);
            yield user.save();
            return user;
        });
    }
    cleanSMS(sms) {
        sms = sms || "";
        return sms.match(/\S+/g)[0].toLowerCase();
    }
    verifysignupRoute() {
        return __awaiter(this, void 0, void 0, function* () {
            let user = yield user_1.default.findOne({
                where: {
                    mphone: helper_1.default.getPhoneNumber(this.req.body.phone)
                }
            });
            if (!user)
                throw new http.ValidationError("Geçersiz telefon: " + helper_1.default.getPhoneNumber(this.req.body.phone));
            let sms = this.cleanSMS(this.req.body.password);
            if (!user.verifyPassword(sms))
                throw new http.ValidationError("SMS şifreniz hatalıdır. SMS şifreniz 5 karakterden oluşmaktadır. Tel no: " + helper_1.default.getPhoneNumber(this.req.body.phone));
            user.mphoneverified = true;
            yield user.save();
            this.res.sendStatus(200);
        });
    }
    findSemtRoute() {
        return __awaiter(this, void 0, void 0, function* () {
            let result = yield area_1.default.sequelize.query(`
        
        select id, name, slug as url, display, GLength(LineStringFromWKB(LineString(
            location, 
            GeomFromText('POINT(:lat :lng)')))) AS distance from Areas where (level=3 or level=4) and (location is not null) ORDER BY distance ASC LIMIT 5
        `, {
                replacements: {
                    lat: parseFloat(this.req.body.lat),
                    lng: parseFloat(this.req.body.lng)
                },
                type: sq.QueryTypes.SELECT,
                mapToModel: false,
                raw: true
            });
            // for(let i = 0; i < result.length;i++) {               
            //     let area = await Area.findByPk(result[i]['id']);
            //     let addr = await area.getPreferredAddress();
            //     result[i] = {
            //         display: addr.display,
            //         url: result[i]['slug'],
            //         distance: result[i]['distance']
            //     }
            // }
            this.res.send(result);
        });
    }
    completesignupRoute() {
        return __awaiter(this, void 0, void 0, function* () {
            let user = yield user_1.default.findOne({
                where: {
                    mphone: helper_1.default.getPhoneNumber(this.req.body.phone)
                }
            });
            if (!user)
                throw new http.ValidationError("invalid phone: " + helper_1.default.getPhoneNumber(this.req.body.phone));
            let sms = this.cleanSMS(this.req.body.password);
            let userEmail = (this.req.body.email || "").toLowerCase();
            if (!user.verifyPassword(sms))
                throw new http.ValidationError("SMS kodu hatalıdır." + helper_1.default.getPhoneNumber(this.req.body.phone));
            if (!validator.isEmail(userEmail))
                throw new http.ValidationError("Geçersiz e-posta adresi");
            if (validator.isEmpty(this.req.body.name))
                throw new http.ValidationError("Geçersiz ad soyad");
            user.email = userEmail;
            user.name = this.req.body.name;
            try {
                yield user.save();
            }
            catch (err) {
                if (err.original && err.original.code == 'ER_DUP_ENTRY') {
                    throw new http.ValidationError(user.email + ' e-posta adresi sistemimizde mevcut. Lütfen başla bir e-posta adresi girin.', 400);
                }
            }
            email_1.default.send(user.email, "iyi et rehberi", "meatguide.ejs", {
                email: user.email
            });
            yield this.authenticateRoute();
        });
    }
    createAsButcherCustomer(model, butcherId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!validator.isMobilePhone(model.phone))
                throw new http.ValidationError('Cep telefonu geçersiz:' + model.phone);
            var user = new user_1.default();
            user.mphone = helper_1.default.getPhoneNumber(model.phone);
            user.email = user.mphone + '@unverified.kasaptanal.com';
            user.name = model.name;
            user.ivCode = (Math.random() * 999999).toString();
            user.source = "butcher";
            user.sourceId = butcherId;
            let pwd = yield this.generatePwd();
            user.setPassword(pwd);
            yield user.save();
            return user;
        });
    }
    signupRoute() {
        return __awaiter(this, void 0, void 0, function* () {
            var model = this.req.body;
            model.phone = model.phone || "";
            if (validator.isEmpty(model.phone))
                throw new http.ValidationError('Cep telefonu gereklidir');
            if (!helper_1.default.isValidPhone(model.phone))
                throw new http.ValidationError('Geçersiz telefon:' + model.phone);
            model.phone = helper_1.default.getPhoneNumber(model.phone);
            let pwd = this.generatePwd();
            try {
                yield this.create(this.req.body, pwd);
                if (sms_1.Sms.canSend(model.phone)) {
                    this.res.sendStatus(200);
                }
                else
                    this.res.send({
                        pwd: pwd
                    });
            }
            catch (err) {
                if (err.original && err.original.code == 'ER_DUP_ENTRY') {
                    let existingUser = yield this.retrieveByEMailOrPhone(model.phone);
                    if (existingUser.mphoneverified)
                        throw new http.ValidationError("Merhaba " + existingUser.name + ", hesabınıza giriş yapabilirsiniz.", 400);
                    else {
                        let pwd = yield this.sendPassword(this.generatePwd(), existingUser.mphone);
                        existingUser.setPassword(pwd);
                        yield existingUser.save();
                        this.res.sendStatus(200);
                    }
                }
                else
                    throw err;
            }
        });
    }
    generatePwd() {
        let pwd = generator.generate({
            length: 5,
            numbers: true,
            uppercase: false,
            lowercase: true,
            excludeSimilarCharacters: true,
        });
        if (config_1.default.nodeenv == 'development')
            console.log(pwd);
        return pwd;
    }
    sendPassword(pwd, phoneNumber) {
        return __awaiter(this, void 0, void 0, function* () {
            yield sms_1.Sms.send(phoneNumber, `${pwd} kasaptanal.com giris sifreniz ile isleme devam edin.`, true, new sitelog_1.default(this.constructorParams));
            return pwd;
        });
    }
    sendNewPassword(user) {
        return __awaiter(this, void 0, void 0, function* () {
            let pwd = yield this.generatePwd();
            user.setPassword(pwd);
            yield user.save();
            yield this.sendPassword(pwd, user.mphone);
        });
    }
    create(model, pwd) {
        return __awaiter(this, void 0, void 0, function* () {
            var user = new user_1.default();
            user.mphone = helper_1.default.getPhoneNumber(model.phone);
            user.email = user.mphone + '@unverified.kasaptanal.com';
            user.ivCode = (Math.random() * 999999).toString();
            pwd = pwd || this.generatePwd();
            user.setPassword(pwd);
            yield user.save();
            yield this.sendPassword(pwd, user.mphone);
            return user;
        });
    }
    authenticate(email, password) {
        return new Promise((resolve, reject) => {
            this.retrieveByEMailOrPhone(email).then((doc) => {
                if (!doc)
                    return reject(new http.PermissionError());
                if (bcrypt.compareSync(password, doc.password)) {
                    doc.lastLogin = moment.utc().toDate();
                    this.req && (this.req.user = doc);
                    doc.save().then(() => resolve(doc), (err) => reject(err));
                }
                else
                    reject(new http.PermissionError("Giriş bilgileriniz hatalı:" + email));
            });
        });
    }
    retrieveByEMailOrPhone(email) {
        return user_1.default.retrieveByEMailOrPhone(email);
    }
    signOff() {
        this.req.session.shopcard = this.req.user.shopcard;
        this.res.clearCookie('remember_me');
        this.req.logout();
    }
    setAccessToken(accessToken) {
        this.res.cookie("auth", accessToken, {
            maxAge: 0.5 * 60 * 60 * 1000
        });
    }
    login({ email, password, req, remember_me }) {
        return new Promise((resolve, reject) => {
            passport.authenticate('local', (err, user) => {
                if (err) {
                    reject(err);
                }
                if (!user) {
                    reject('Invalid credentials.');
                }
                req.login(user, () => resolve(user));
            })({ body: { email, password, remember_me } });
        });
    }
    authenticateRoute() {
        return __awaiter(this, void 0, void 0, function* () {
            var email = this.req.body.email || "";
            var password = this.req.body.password || "";
            if (validator.isEmpty(email))
                return Promise.reject(new http.ValidationError('e-posta veya cep telefonu gereklidir'));
            if (!validator.isEmail(email) && !validator.isMobilePhone(email))
                return Promise.reject(new http.ValidationError('e-posta veya cep telefonu geçersiz'));
            if (validator.isEmpty(password))
                return Promise.reject(new http.ValidationError('Şifre boş olamaz'));
            return this.authenticate(email, password).then((user) => {
                return this.login({
                    email: email,
                    password: password,
                    req: this.req,
                    remember_me: true,
                }).then(user => {
                    var token = helper_1.default.generateToken(64);
                    let rt = new refreshToken_1.default({
                        userId: user.id,
                        token: token
                    });
                    return rt.save().then(rt => {
                        this.res.cookie('remember_me', token, { path: '/', httpOnly: true, maxAge: 2 * 604800000 }); // 7 days
                        this.res.sendStatus(200);
                        return user;
                    });
                }).catch(err => this.res.sendStatus(401));
                // return this.createTokens(user).then((generatedTokens: GeneratedTokenData) => {
                //     this.setAccessToken(generatedTokens.accessToken);
                //     this.res.redirect("/")
                //     //this.res.send(<LoginResult>{ user: user.toClient(), token: generatedTokens });
                // })
            });
        });
    }
    static SetRoutes(router) {
        router.post("/user/signup", UserRoute.BindRequest(this.prototype.signupRoute));
        router.post("/user/signupverify", UserRoute.BindRequest(this.prototype.verifysignupRoute));
        router.post("/user/signupcomplete", UserRoute.BindRequest(this.prototype.completesignupRoute));
        router.post("/user/findsemt", UserRoute.BindRequest(this.prototype.findSemtRoute));
        router.post("/user/sendResetLink", UserRoute.BindRequest(this.prototype.sendResetLink));
    }
}
__decorate([
    common_1.Auth.Anonymous(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], UserRoute.prototype, "sendResetLink", null);
__decorate([
    common_1.Auth.Anonymous(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], UserRoute.prototype, "resetPasswordWithToken", null);
__decorate([
    common_1.Auth.Anonymous(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], UserRoute.prototype, "verifysignupRoute", null);
__decorate([
    common_1.Auth.Anonymous(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], UserRoute.prototype, "findSemtRoute", null);
__decorate([
    common_1.Auth.Anonymous(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], UserRoute.prototype, "completesignupRoute", null);
__decorate([
    common_1.Auth.Anonymous(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], UserRoute.prototype, "signupRoute", null);
__decorate([
    common_1.Auth.Anonymous(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], UserRoute.prototype, "authenticateRoute", null);
exports.default = UserRoute;
