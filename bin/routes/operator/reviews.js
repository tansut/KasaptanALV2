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
let ellipsis = require('text-ellipsis');
var MarkdownIt = require('markdown-it');
var MarkdownIt = require('markdown-it');
class Route extends router_1.ViewRouter {
    ViewRoute() {
        return __awaiter(this, void 0, void 0, function* () {
            this.renderView("pages/operator.reviews.ejs");
        });
    }
    static SetRoutes(router) {
        router.get('/reviews', Route.BindRequest(Route.prototype.ViewRoute));
    }
}
exports.default = Route;
