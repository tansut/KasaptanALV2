"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const router_1 = require("../lib/router");
const http_1 = require("../lib/http");
let ellipsis = require('text-ellipsis');
var MarkdownIt = require('markdown-it');
class Route extends router_1.ViewRouter {
    renderPage(err, page, status = 500) {
        let httpErr = err instanceof http_1.HttpError ? null : err;
        //this.res.status(httpErr && httpErr.statusCode ? httpErr.statusCode : 500).send({ error: httpErr ? httpErr.message : err.message })
        this.res.status(status);
        this.res.render(page, this.viewData({
            error: err,
            JSON: JSON
        }));
    }
    static SetRoutes(router) {
    }
}
exports.default = Route;
