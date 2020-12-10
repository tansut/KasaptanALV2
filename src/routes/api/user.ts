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
import SiteLogRoute from './sitelog';
import Area from '../../db/models/area';
var validator = require("validator");
var generator = require('generate-password');
let passport = require("passport")
import * as sq from 'sequelize';
import { add } from 'lodash';
import AccountModel from '../../db/models/accountmodel';


 
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
    async sendResetLink() {
        let phone: string = this.req.body.phone;
        let user = await this.retrieveByEMailOrPhone(phone);
        if (!user) throw Error('Geçersiz telefon no');
        user.resetToken = crypto.randomBytes(32).toString('hex');;
        let utc = Helper.UtcNow();
        let res = moment(utc).add('minutes', 30).toDate()
        user.resetTokenValid = res;
        await user.save();
        await Sms.send(user.mphone, `KasaptanAl.com sifrenizi yenilemek icin ${this.url}/rpwd?k=${user.resetToken}`, true, null)
        this.res.sendStatus(200);
    }

    @Auth.Anonymous()
    async resetPasswordWithToken(resetKey: string, newPassword: string) {
        let user = await UserModel.findOne({
            where: {
                resetToken: resetKey
            }
        })
        if (!user) throw new Error('Geçersiz işlem numarası');
        if (user.resetTokenValid) {
            var diff =(user.resetTokenValid.getTime() - Helper.UtcNow().getTime()) / 1000;
            let min = Math.round(diff /= 60);
            if (min < 0) throw new Error('İşlem süresi dolmuş, lütfen yeniden şifre yenileme talebi iletin')
        } else  throw new Error('Geçersiz işlem');
        user.resetTokenValid = null;
        user.resetToken = null;
        user.setPassword(newPassword);
        await user.save();
        return user;
    }


    cleanSMS(sms: string) {
        sms = sms || "";
        return  sms.match(/\S+/g)[0].toLowerCase();
    }
    
    @Auth.Anonymous()
    async verifysignupRoute() {
        
        let user = await UserModel.findOne({
            where: {
                mphone: Helper.getPhoneNumber(this.req.body.phone)
            }
        });
        if (!user) throw new http.ValidationError("Geçersiz telefon: " + Helper.getPhoneNumber(this.req.body.phone));
        let sms = this.cleanSMS(this.req.body.password);
        if (!user.verifyPassword(sms))
            throw new http.ValidationError("SMS şifreniz hatalıdır. SMS şifreniz 5 karakterden oluşmaktadır. Tel no: " +  Helper.getPhoneNumber(this.req.body.phone));
        user.mphoneverified = true;
        await user.save();
        this.res.sendStatus(200)
    }

    


    @Auth.Anonymous()
    async findSemtRoute() {
        let result = await Area.sequelize.query(`
        
        select id, name, slug, GLength(LineStringFromWKB(LineString(
            location, 
            GeomFromText('POINT(:lat :lng)')))) AS distance from Areas  where level=3 and location is not null ORDER BY distance ASC LIMIT 4
        `,            {
                replacements: { 
                     lat: parseFloat(this.req.body.lat as string), 
                     lng: parseFloat(this.req.body.lng as string) 
                    },
                type: sq.QueryTypes.SELECT,
                mapToModel: false,
                raw: true
            }
            )
            for(let i = 0; i < result.length;i++) {
                let area = await Area.findByPk(result[i]['id']);
                let addr = await area.getPreferredAddress();
                result[i] = {
                    display: addr.display,
                    url: addr.level3Slug,
                    distance: result[i]['distance']
                }
            }

        this.res.send(result)
    }

    @Auth.Anonymous()
    async completesignupRoute() {
        let user = await UserModel.findOne({
            where: {
                mphone: Helper.getPhoneNumber(this.req.body.phone)                
            }
        });

        
        if (!user) throw new http.ValidationError("invalid phone: " + Helper.getPhoneNumber(this.req.body.phone));
        let sms = this.cleanSMS(this.req.body.password);
        let userEmail: string = (this.req.body.email || "").toLowerCase();
        
        if (!user.verifyPassword(sms))
            throw new http.ValidationError("SMS kodu hatalıdır." + Helper.getPhoneNumber(this.req.body.phone) );
        if (!validator.isEmail(userEmail))
            throw new http.ValidationError("Geçersiz e-posta adresi");
        if (validator.isEmpty(this.req.body.name))
            throw new http.ValidationError("Geçersiz ad soyad");
        user.email = userEmail;
        user.name = this.req.body.name;
        try {
            await user.save();
        } catch(err) {
            if (err.original && err.original.code == 'ER_DUP_ENTRY') {
                throw new http.ValidationError(user.email + ' e-posta adresi sistemimizde mevcut. Lütfen başla bir e-posta adresi girin.', 400);

            }            
        }
        email.send( user.email, "iyi et rehberi", "meatguide.ejs", {
            email:  user.email
        })
        await this.authenticateRoute()
    }

    async createAsButcherCustomer(model: SignupModel, butcherId: number): Promise<UserModel> {
        if (!validator.isMobilePhone(model.phone))
            throw new http.ValidationError('Cep telefonu geçersiz:' + model.phone);        
        var user = new UserModel();
        user.mphone = Helper.getPhoneNumber(model.phone);
        user.email = user.mphone + '@unverified.kasaptanal.com';
        user.name = model.name;
        user.ivCode = (Math.random() * 999999).toString();
        user.source = "butcher";
        user.sourceId = butcherId;
        let pwd = await this.generatePwd()
        user.setPassword(pwd);
        await user.save();
        return user;
    }

    @Auth.Anonymous()
    async signupRoute() {
        var model = <SignupModel>this.req.body;
        model.phone = model.phone || "";
        
        
        if (validator.isEmpty(model.phone))
            throw new http.ValidationError('Cep telefonu gereklidir');
        if (!Helper.isValidPhone(model.phone))
            throw new http.ValidationError('Geçersiz telefon:' + model.phone);
        model.phone = Helper.getPhoneNumber(model.phone);
        let pwd = this.generatePwd();
        try {
            await this.create(this.req.body, pwd);
            if (Sms.canSend(model.phone)) {
                this.res.sendStatus(200);
            } else this.res.send({
                pwd: pwd
            })
            
        } catch (err) {
            if (err.original && err.original.code == 'ER_DUP_ENTRY') {
                let existingUser = await this.retrieveByEMailOrPhone(model.phone);
                if (existingUser.mphoneverified)
                    throw new http.ValidationError("Merhaba " + existingUser.name + ", hesabınıza giriş yapabilirsiniz.", 400);
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

    generatePwd(): string {
        let pwd = generator.generate({
            length: 5,
            numbers: true,
            uppercase: false,
            lowercase: true,
            excludeSimilarCharacters: true,
        });

        if (config.nodeenv == 'development')
            console.log(pwd)
        return pwd;
    }

    async sendPassword(pwd: string, phoneNumber: string) {
        await Sms.send(phoneNumber, `${pwd} kasaptanal.com giris sifreniz ile isleme devam edin.`, true, new SiteLogRoute(this.constructorParams));
        return pwd;
    }

    async sendNewPassword(user: UserModel) {
        let pwd = await this.generatePwd()
        user.setPassword(pwd);
        await user.save();
        await this.sendPassword(pwd, user.mphone);        
    }


    async create(model: SignupModel, pwd?: string): Promise<UserModel> {
        var user = new UserModel();
        user.mphone = Helper.getPhoneNumber(model.phone);
        user.email = user.mphone + '@unverified.kasaptanal.com';
        user.ivCode = (Math.random() * 999999).toString();
        pwd = pwd || this.generatePwd();
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
                else reject(new http.PermissionError("Giriş bilgileriniz hatalı:" + email))
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


    static SetRoutes(router: express.Router) {
   
        router.post("/user/signup", UserRoute.BindRequest(this.prototype.signupRoute));
        router.post("/user/signupverify", UserRoute.BindRequest(this.prototype.verifysignupRoute));
        router.post("/user/signupcomplete", UserRoute.BindRequest(this.prototype.completesignupRoute));
        router.post("/user/findsemt", UserRoute.BindRequest(this.prototype.findSemtRoute));
        router.post("/user/sendResetLink", UserRoute.BindRequest(this.prototype.sendResetLink));




    }
}
