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
const router_1 = require("../lib/router");
const common_1 = require("../lib/common");
const helper_1 = require("../lib/helper");
const user_1 = require("./api/user");
let ellipsis = require('text-ellipsis');
var MarkdownIt = require('markdown-it');
class Route extends router_1.ViewRouter {
    constructor() {
        super(...arguments);
        this.showLogin = false;
        this.loginUser = '';
        this.redirect = "";
    }
    renderPage(msg = undefined) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.sendView(`pages/resetpassword.ejs`, {
                _usrmsg: msg
            });
        });
    }
    renderPage2(msg = undefined) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.sendView(`pages/resetpasswordnew.ejs`, {
                _usrmsg: msg
            });
        });
    }
    resetRoute() {
        return __awaiter(this, void 0, void 0, function* () {
            let email = (this.req.body["recover-email"] || "").toLowerCase();
            let phone = this.req.body["recover-tel"];
            if (email && phone) {
                let userRoute = new user_1.default(this.constructorParams);
                let user = yield userRoute.retrieveByEMailOrPhone(phone);
                if (user) {
                    if (user.email.toLowerCase() == email) {
                        yield userRoute.sendNewPassword(user);
                        this.showLogin = true;
                        this.loginUser = helper_1.default.getPhoneNumber(phone);
                        this.redirect = this.req.query.r;
                        yield this.renderPage({ text: "Yeni şifreniz telefonunuza gönderildi. Şifrenizi kullanarak giriş yapabilirsiniz.", type: "info" });
                    }
                    else {
                        yield this.renderPage({ text: "Geçersiz e-posta adresi/telefon numarası.", type: "danger" });
                    }
                }
                else
                    yield this.renderPage({ text: "Geçersiz telefon numarası", type: "danger" });
            }
            else
                yield this.renderPage({ text: "Geçersiz e-posta adresi veya telefon numarası.", type: "danger" });
        });
    }
    viewRoute() {
        return __awaiter(this, void 0, void 0, function* () {
            this.renderPage();
        });
    }
    viewRoute2() {
        return __awaiter(this, void 0, void 0, function* () {
            this.renderPage2();
        });
    }
    resetRoute2() {
        return __awaiter(this, void 0, void 0, function* () {
            let resetkey = this.req.body["k"];
            let newPassword = this.req.body["newpass"];
            if (resetkey && newPassword) {
                let userRoute = new user_1.default(this.constructorParams);
                try {
                    let user = yield userRoute.resetPasswordWithToken(resetkey, newPassword);
                    this.showLogin = true;
                    this.loginUser = helper_1.default.getPhoneNumber(user.mphone);
                    this.redirect = this.req.query.r;
                    this.renderPage2({ text: 'Şifrenizi başarıyla oluşturduk, giriş yapabilirsiniz.', type: "info" });
                }
                catch (err) {
                    this.renderPage2({ text: err.message, type: "danger" });
                }
            }
            else
                this.renderPage2({ text: 'Geçersiz işlem', type: "danger" });
        });
    }
    static SetRoutes(router) {
        router.get("/reset-password", Route.BindRequest(Route.prototype.viewRoute));
        router.post("/reset-password", Route.BindRequest(Route.prototype.resetRoute));
        router.get("/rpwd", Route.BindRequest(Route.prototype.viewRoute2));
        router.post("/rpwd", Route.BindRequest(Route.prototype.resetRoute2));
        router.get('/login', Route.BindToView("pages/login.ejs"));
        router.get('/signup', Route.BindToView("pages/signup.ejs"));
    }
}
__decorate([
    common_1.Auth.Anonymous(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], Route.prototype, "resetRoute", null);
__decorate([
    common_1.Auth.Anonymous(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], Route.prototype, "viewRoute", null);
__decorate([
    common_1.Auth.Anonymous(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], Route.prototype, "viewRoute2", null);
__decorate([
    common_1.Auth.Anonymous(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], Route.prototype, "resetRoute2", null);
exports.default = Route;
