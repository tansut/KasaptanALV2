import RefreshToken from '../../db/models/refreshToken';
import { ApiRouter } from '../../lib/router';
import * as express from "express";
import UserModel from '../../db/models/user';
import config from '../../config';
import * as um from '../../db/models/user';
import * as http from '../../lib/http';
import * as bcrypt from 'bcryptjs';
import * as moment from 'moment';
import * as crypto from 'crypto';
//import emailmanager from '../../lib/email';
import * as authorization from '../../lib/authorizationToken';
import { Auth, UserRoles } from '../../lib/common';
import { SignupModel, AppUser, LoginResult } from '../../models/user';
import Helper from '../../lib/helper';
import { Sms } from '../../lib/sms';
import email from '../../lib/email';
var validator = require("validator");
var generator = require('generate-password');
let passport = require("passport")

 
interface GeneratedTokenData {
    accessToken: authorization.IEncryptedAccessTokenData;
    refreshToken: string;
}

export interface UserCreateResult {
    user: AppUser;
}

export default class UserRoute extends ApiRouter {

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
    @Auth.Anonymous()
    async verifysignupRoute() {
        
        let user = await UserModel.findOne({
            where: {
                mphone: Helper.getPhoneNumber(this.req.body.phone)
            }
        });
        if (!user) throw new http.ValidationError("Geçersiz telefon: " + Helper.getPhoneNumber(this.req.body.phone));
        if (!user.verifyPassword(this.req.body.password))
            throw new http.ValidationError("SMS kodu hatalıdır:" + Helper.getPhoneNumber(this.req.body.phone));
        user.mphoneverified = true;
        await user.save();
        this.res.sendStatus(200)
    }

    @Auth.Anonymous()
    async completesignupRoute() {
        let user = await UserModel.findOne({
            where: {
                mphone: Helper.getPhoneNumber(this.req.body.phone)                
            }
        });

        
        if (!user) throw new http.ValidationError("invalid phone: " + Helper.getPhoneNumber(this.req.body.phone));
        if (!user.verifyPassword(this.req.body.password))
            throw new http.ValidationError("SMS kodu hatalıdır: " + Helper.getPhoneNumber(this.req.body.phone) );
        if (!validator.isEmail(this.req.body.email))
            throw new http.ValidationError("Geçersiz e-posta adresi");
        if (validator.isEmpty(this.req.body.name))
            throw new http.ValidationError("Geçersiz ad soyad");
        user.email = this.req.body.email;
        user.name = this.req.body.name;
        await user.save();
        await email.send( user.email, "iyi et rehberi", "meatguide.ejs", {
            email:  user.email
        })
        await this.authenticateRoute()
    }

    @Auth.Anonymous()
    async signupRoute() {
        var model = <SignupModel>this.req.body;
        model.phone = model.phone || "";
        if (validator.isEmpty(model.phone))
            throw new http.ValidationError('Cep telefonu gereklidir');
        if (!validator.isMobilePhone(model.phone))
            throw new http.ValidationError('Cep telefonu geçersiz');
        // if (!validator.isLength(model.password, {
        //     min: 6,
        //     max: 20
        // })) return Promise.reject(new http.ValidationError('Password should be at least 6 characters'));
        try {
            await this.create(this.req.body)
            this.res.sendStatus(200);
        } catch (err) {
            if (err.original && err.original.code == 'ER_DUP_ENTRY') {
                let existingUser = await this.retrieveByEMailOrPhone(model.phone);
                if (existingUser.mphoneverified)
                    throw new http.ValidationError(model.phone + ' nolu telefon ile hesabınız mevcut. Giriş yapabilirsiniz veya şifrenizi hatırlamıyorsanız Şifremi Unuttum sayfasını ziyaret edebilirsiniz.', 400);
                else {
                    let pwd = await this.sendPassword(this.generatePwd(), existingUser.mphone)
                    existingUser.setPassword(pwd);
                    await existingUser.save()
                    this.res.sendStatus(200);
                }
            } else
                throw err;
        }

    }

    generatePwd() {
        let pwd = generator.generate({
            length: 5,
            numbers: true,
            uppercase: false
        });

        if (config.nodeenv == 'development')
            console.log(pwd)
        return pwd;
    }

    async sendPassword(pwd: string, phoneNumber: string) {
        await Sms.send('90' + phoneNumber, `kasaptanal.com giris sifreniz ve onay kodunuz: ${pwd}`);
        return pwd;
    }

    async sendNewPassword(user: UserModel) {
        let pwd = await this.generatePwd()
        user.setPassword(pwd);
        await user.save();
        await this.sendPassword(pwd, user.mphone);        
    }


    async create(model: SignupModel): Promise<UserModel> {
        var user = new UserModel();
        user.mphone = Helper.getPhoneNumber(model.phone);
        user.email = user.mphone + '@unverified.kasaptanal.com';
        user.ivCode = (Math.random() * 999999).toString();
        let pwd = await this.generatePwd()
        user.setPassword(pwd);
        await user.save();
        await this.sendPassword(pwd, user.mphone);
        return user;
    }

    authenticate(email: string, password: string): Promise<UserModel> {
        return new Promise((resolve, reject) => {
            this.retrieveByEMailOrPhone(email).then((doc: UserModel) => {
                if (!doc) return reject(new http.PermissionError());
                if (bcrypt.compareSync(password, doc.password)) {
                    doc.lastLogin = moment.utc().toDate();
                    this.req && (this.req.user = doc);
                    doc.save().then(() => resolve(doc), (err) => reject(err));
                }
                else reject(new http.PermissionError())
            })
        });
    }

    retrieveByEMailOrPhone(email: string) {
        return UserModel.retrieveByEMailOrPhone(email)
    }

    private createTokens(user: UserModel): Promise<any> {
        var accessToken = user.generateAccessToken();
        var accessTokenEncrypted = authorization.default.encryptAccessToken(accessToken);
        return authorization.default.encryptRefreshToken(user.id, accessToken).then((encryptedRefreshToken: string) => {
            return { accessToken: accessTokenEncrypted, refreshToken: encryptedRefreshToken };
        });
    }

    signOff() {
        // this.res.cookie("auth", "", {
        //     expires: new Date(0)
        // })
        this.req.session.shopcard = this.req.user.shopcard;
        (<any>this.req).logout();
    }

    setAccessToken(accessToken: authorization.IEncryptedAccessTokenData) {
        this.res.cookie("auth", accessToken, {
            maxAge: 0.5 * 60 * 60 * 1000
        });
    }

    login({ email, password, req }) {
        return new Promise((resolve, reject) => {
          passport.authenticate('local', (err, user) => {
            if (err) { reject(err); }
            if (!user) { reject('Invalid credentials.'); }
      
            req.login(user, () => resolve(user));
          })({ body: { email, password } });
        });
      }

    @Auth.Anonymous()
    async authenticateRoute() {
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
            }).then(user=>{
                this.res.sendStatus(200);
                return user;
            }).catch(err=>this.res.sendStatus(401))

            // return this.createTokens(user).then((generatedTokens: GeneratedTokenData) => {
            //     this.setAccessToken(generatedTokens.accessToken);
            //     this.res.redirect("/")
            //     //this.res.send(<LoginResult>{ user: user.toClient(), token: generatedTokens });
            // })
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

    static SetRoutes(router: express.Router) {
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
