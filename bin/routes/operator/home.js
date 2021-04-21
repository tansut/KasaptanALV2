"use strict";
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
const user_1 = require("../api/user");
let ellipsis = require('text-ellipsis');
var MarkdownIt = require('markdown-it');
var MarkdownIt = require('markdown-it');
class Route extends router_1.ViewRouter {
    ViewRoute() {
        return __awaiter(this, void 0, void 0, function* () {
            this.renderView("pages/operator.home.ejs");
        });
    }
    postViewRoute() {
        return __awaiter(this, void 0, void 0, function* () {
            let ur = new user_1.default(this.constructorParams);
            let user = yield ur.retrieveByEMailOrPhone(this.req.body.userphone);
            if (user && !user.hasRole('admin') && !user.hasRole('operator')) {
                //await ur.signOff();
                yield ur.loginAs(user);
                return this.res.redirect("/");
            }
            this.renderView("pages/operator.home.ejs");
        });
    }
    static SetRoutes(router) {
        router.get('/', Route.BindRequest(Route.prototype.ViewRoute));
        router.post('/', Route.BindRequest(Route.prototype.postViewRoute));
    }
}
exports.default = Route;
