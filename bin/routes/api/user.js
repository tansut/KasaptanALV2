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
const router_1 = require("../../lib/router");
const user_1 = require("../../db/models/user");
const config_1 = require("../../config");
const http = require("../../lib/http");
const bcrypt = require("bcryptjs");
const moment = require("moment");
//import emailmanager from '../../lib/email';
const authorization = require("../../lib/authorizationToken");
const common_1 = require("../../lib/common");
const helper_1 = require("../../lib/helper");
const sms_1 = require("../../lib/sms");
const email_1 = require("../../lib/email");
const sitelog_1 = require("./sitelog");
var validator = require("validator");
var generator = require('generate-password');
let passport = require("passport");
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
            if (!validator.isMobilePhone(model.phone))
                throw new http.ValidationError('Cep telefonu geçersiz:' + model.phone);
            // if (!validator.isLength(model.password, {
            //     min: 6,
            //     max: 20
            // })) return Promise.reject(new http.ValidationError('Password should be at least 6 characters'));
            try {
                yield this.create(this.req.body);
                this.res.sendStatus(200);
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
            yield sms_1.Sms.send('90' + phoneNumber, `${pwd} kasaptanal.com giris sifreniz ile isleme devam edin.`, true, new sitelog_1.default(this.constructorParams));
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
    create(model) {
        return __awaiter(this, void 0, void 0, function* () {
            var user = new user_1.default();
            user.mphone = helper_1.default.getPhoneNumber(model.phone);
            user.email = user.mphone + '@unverified.kasaptanal.com';
            user.ivCode = (Math.random() * 999999).toString();
            let pwd = yield this.generatePwd();
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
    createTokens(user) {
        var accessToken = user.generateAccessToken();
        var accessTokenEncrypted = authorization.default.encryptAccessToken(accessToken);
        return authorization.default.encryptRefreshToken(user.id, accessToken).then((encryptedRefreshToken) => {
            return { accessToken: accessTokenEncrypted, refreshToken: encryptedRefreshToken };
        });
    }
    signOff() {
        // this.res.cookie("auth", "", {
        //     expires: new Date(0)
        // })
        this.req.session.shopcard = this.req.user.shopcard;
        this.req.logout();
    }
    setAccessToken(accessToken) {
        this.res.cookie("auth", accessToken, {
            maxAge: 0.5 * 60 * 60 * 1000
        });
    }
    login({ email, password, req }) {
        return new Promise((resolve, reject) => {
            passport.authenticate('local', (err, user) => {
                if (err) {
                    reject(err);
                }
                if (!user) {
                    reject('Invalid credentials.');
                }
                req.login(user, () => resolve(user));
            })({ body: { email, password } });
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
                    req: this.req
                }).then(user => {
                    this.res.sendStatus(200);
                    return user;
                }).catch(err => this.res.sendStatus(401));
                // return this.createTokens(user).then((generatedTokens: GeneratedTokenData) => {
                //     this.setAccessToken(generatedTokens.accessToken);
                //     this.res.redirect("/")
                //     //this.res.send(<LoginResult>{ user: user.toClient(), token: generatedTokens });
                // })
            });
        });
    }
    // useRefreshToken(refreshTokenData: string) {
    //     return new Promise((resolve, reject) => {
    //         authorization.default.decryptRefreshToken(refreshTokenData).then((user: IUserDocument) => {
    //             return this.createTokens(user).then((generatedTokens => {
    //                 return new AccountRoute(this.constructorParams).retrieve(user.account).then(account => {
    //                     this.res.send(<LoginResult>{ user: user.toClient(), account: account.toClient(), token: generatedTokens });
    //                 });
    //             }));
    //         }).then((responseData) => {
    //             this.res.send(responseData);
    //             resolve();
    //         }).catch((err) => {
    //             var errorDetail = { message: 'Refresh Token Not Validated Msg :' + err, PermissionErrorType: 'refreshTokenNotValidated' };
    //             var generatedError = new http.ValidationError(JSON.stringify(errorDetail));
    //             reject(generatedError);
    //         });
    //     });
    // }
    // @Auth.Anonymous()
    // useRefreshTokenRoute() {
    //     var refreshTokenData = <string>this.req.body.refreshTokenData;
    //     if (!refreshTokenData) {
    //         var errorDetail = { message: 'Refresh Token Not Granted', PermissionErrorType: 'refreshTokenRequired' };
    //         return Promise.reject(new http.ValidationError(JSON.stringify(errorDetail)));
    //     } else {
    //         return this.useRefreshToken(refreshTokenData);
    //     }
    // }
    // @Auth.Anonymous()
    // resetPasswordRequestRoute() {
    //     var email = this.req.body.email;
    //     if (validator.isEmpty(email) || !validator.isEmail(email))
    //         return Promise.reject(new http.ValidationError('Invalid e-mail address'));
    //     var url = this.req.protocol + '://' + this.req.get('host');
    //     return this.resetPasswordRequest(email, url).then(() => {
    //         this.res.sendStatus(200)
    //     });
    // }
    // resetPasswordRequest(email: string, url: string): Promise<any> {
    //     return this.retrieveByEMail(email).then((user) => {
    //         if (!user) return Promise.reject(new http.NotFoundError('There is no user with this e-mail address'));
    //         user.resetToken = crypto.randomBytes(32).toString('hex');
    //         user.resetTokenValid = moment.utc().add(1, 'days').toDate();
    //         return user.save().then((user) => {
    //             return emailmanager.send(user.email, 'Jdash Cloud - Password Reset Request', 'resetpassword.ejs', {
    //                 email: user.email,
    //                 resetLink: `${url}/#!/app/account/resetpasswordreturn/${user.resetToken}`
    //             });
    //         });
    //     })
    // }
    // @Auth.Anonymous()
    // passwordResetReturnRoute() {
    //     var resetToken = this.req.params.token
    //     var newPassword = this.req.body.password
    //     if (typeof resetToken === 'undefined' || validator.isEmpty(newPassword)) {
    //         return Promise.reject(new http.ValidationError('Invalid Token'));
    //     }
    //     return this.passwordResetReturn(newPassword, resetToken).then(() => {
    //         this.res.sendStatus(200);
    //     })
    // }
    // passwordResetReturn(pass: string, token: string) {
    //     return UserModel.findOne().where('resetToken', token).then((user) => {
    //         if (!user) {
    //             return Promise.reject(new http.NotFoundError('No password request for this user has been found.'))
    //         }
    //         if (moment.utc().toDate() > user.resetTokenValid) {
    //             return Promise.reject(new http.ValidationError('Token has expired. Please request a new token.'));
    //         }
    //         user.resetToken = null;
    //         user.resetTokenValid = null;
    //         var passwordSalt = bcrypt.genSaltSync(10);
    //         var hash = bcrypt.hashSync(pass, passwordSalt);
    //         user.password = hash;
    //         user.save().then((user) => {
    //             return emailmanager.send(user.email, 'JDash Cloud - Password Change', 'passwordchange.ejs', {});
    //         })
    //     });
    // }
    // changePasswordRoute() {
    //     var oldPass = this.req.body.oldPass;
    //     var newPass = this.req.body.newPass;
    //     if (validator.isEmpty(newPass) || validator.isEmpty(oldPass)) return this.next(new http.ValidationError('Empty Password'));
    //     return this.retrieve(this.req.params.userid).then((user) => {
    //         if (!bcrypt.compareSync(oldPass, user.password)) return Promise.reject<any>(new http.PermissionError());
    //         return this.changePassword(user, newPass).then(() => this.res.sendStatus(200));
    //     })
    // }
    // changePassword(user: IUserDocument, newPass: string) {
    //     var passwordSalt = bcrypt.genSaltSync(10);
    //     var hash = bcrypt.hashSync(newPass, passwordSalt);
    //     user.password = hash;
    //     return user.save().then((user) => {
    //         return emailmanager.send(user.email, 'JDash Cloud - Password Change', 'passwordchange.ejs', {
    //         });
    //     })
    // }
    // @Auth.Anonymous()
    // changeSettingsRoute() {
    // }
    // changeSettings() {
    // }
    // @Auth.Anonymous()
    // startDemoRoute() {
    //     var email = this.req.body.email;
    //     return this.startDemo(email).then((token) => {
    //         var result = {
    //             usertoken: token
    //         }
    //         this.res.send(result);
    //     })
    // }
    // startDemo(email: string) {
    //     return this.retrieveByEMail(email).then((user) => {
    //         if (user) {
    //             return ApplicationModel.findOne({ account: user.account }).exec();
    //         } else {
    //             var randomPass = (Math.floor(Math.random() * 999999) + 100000).toString();
    //             var newUser: SignupModel = {
    //                 email: email,
    //                 password: randomPass
    //             }
    //             return this.create(newUser).then((createdUser) => {
    //                 return ApplicationModel.findOne({ account: createdUser.account }).exec();
    //             });
    //         }
    //     }).then((defaultApp) => {
    //         return JDashAuth.userToken(email, { secret: defaultApp.secret, apikey: defaultApp.apikey });
    //     });
    // }
    // delete(user: IUserDocument) {
    //     var promiseList = [];
    //     if (user.integrations.stripe && user.integrations.stripe.remoteId)
    //         promiseList.push(stripe.deleteCustomer(user.integrations.stripe.remoteId));
    //     promiseList.push(RefreshTokenModel.find({ userId: user._id }).remove());
    //     return Promise.all(promiseList).then(() => super.delete(user));
    // }
    // update(doc: IUserDocument, updateValues: any) {
    //     debugger;
    //     doc.country = updateValues.country || doc.country;
    //     doc.language = updateValues.language || doc.language;
    //     return doc.save().then((doc) => null);
    // }
    // protected static generateCreateRoute(url: string, router: express.Router) {
    //     router.post(url, this.BindRequest('createRoute'));
    // }
    static SetRoutes(router) {
        // UserRoute.SetCrudRoutes("/user", router, {
        //     create: true,
        //     update: true
        // });
        //router.post("/user/authenticate", UserRoute.BindRequest(this.prototype.authenticateRoute));
        router.post("/user/signup", UserRoute.BindRequest(this.prototype.signupRoute));
        router.post("/user/signupverify", UserRoute.BindRequest(this.prototype.verifysignupRoute));
        router.post("/user/signupcomplete", UserRoute.BindRequest(this.prototype.completesignupRoute));
        // router.post("/user/resetpassword", UserRoute.BindRequest('resetPasswordRequestRoute'));
        // router.post("/user/changepassword/:userid", UserRoute.BindRequest('changePasswordRoute'));
        // router.post("/user/useRefreshToken", UserRoute.BindRequest('useRefreshTokenRoute'));
        // router.post("/user/settings", UserRoute.BindRequest('changeSettingsRoute'));
        // router.post("/user/resetpasswordreturn/:token", UserRoute.BindRequest('passwordResetReturnRoute'));
        // router.post("/user/startdemo", UserRoute.BindRequest('startDemoRoute'));
    }
}
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

//# sourceMappingURL=user.js.map
