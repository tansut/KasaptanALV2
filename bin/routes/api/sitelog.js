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
const common_1 = require("../../lib/common");
const router_1 = require("../../lib/router");
const sitelog_1 = require("../../db/models/sitelog");
const email_1 = require("../../lib/email");
// type express.response : {
//     session: any
// }
class SiteLogRoute extends router_1.ApiRouter {
    log(content) {
        return __awaiter(this, void 0, void 0, function* () {
            var objectC = Object.assign(Object.assign({}, content), {
                sessionid: this.req["session"] ? this.req["session"].id : null,
                userid: this.req.user ? this.req.user.id : null,
                ip: this.req.header("x-forwarded-for") || this.req.connection.remoteAddress
            });
            yield sitelog_1.default.create(objectC);
        });
    }
    logRoute() {
        return __awaiter(this, void 0, void 0, function* () {
            // if (this.req["session"].id != this.req.body.sessionid)
            //     return this.res.sendStatus(400)
            yield sitelog_1.default.create({
                userid: this.req.user ? this.req.user.id : null,
                sessionid: this.req["session"] ? this.req["session"].id : null,
                f1: this.req.body.city,
                f2: this.req.body.district,
                logtype: this.req.body.logtype,
                email: this.req.body.email,
                ip: this.req.header("x-forwarded-for") || this.req.connection.remoteAddress
            });
            if (this.req.body.email) {
                if (this.req.body.logtype == "anonymous-user-download-meat-guide") {
                    yield email_1.default.send(this.req.body.email, "iyi et rehberi", "meatguide.ejs", {
                        email: this.req.body.email
                    });
                }
            }
            this.res.sendStatus(200);
        });
    }
    static SetRoutes(router) {
        router.post("/sitelog/create", SiteLogRoute.BindRequest(this.prototype.logRoute));
    }
}
__decorate([
    common_1.Auth.Anonymous(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SiteLogRoute.prototype, "logRoute", null);
exports.default = SiteLogRoute;
