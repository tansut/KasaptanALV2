"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = require("../lib/http");
const error_1 = require("../routes/error");
const base_1 = require("./base");
const email_1 = require("../lib/email");
const config_1 = require("../config");
var errormw;
class ErrorMiddleware extends base_1.default {
    logErrors(err, req, res, next) {
        console.error(err.stack);
        next(err);
    }
    clientErrorHandler(err, req, res, next) {
        if (ErrorMiddleware.isXhr(req)) {
            let isHttpErr = err instanceof http_1.HttpError;
            let httpErr = isHttpErr ? err : null;
            let msg = httpErr ? httpErr.message : err.name || err.message;
            if (config_1.default.nodeenv != 'development') {
                email_1.default.send('tansut@gmail.com', 'hata/XHR: kasaptanAl.com', "error.ejs", {
                    text: err + '/' + err.sql,
                    stack: err.stack
                });
            }
            res.status((httpErr && httpErr.statusCode) ? httpErr.statusCode : 500).send({ msg: msg });
        }
        else {
            next(err);
        }
    }
    errorHandler(err, req, res, next) {
        let httpErr = err instanceof http_1.HttpError ? null : err;
        res.status((httpErr && httpErr.statusCode) ? httpErr.statusCode : 500);
        email_1.default.send('tansut@gmail.com', 'hata: kasaptanAl.com', "error.ejs", {
            text: err + '/' + err.sql,
            stack: err.stack
        });
        new error_1.default({
            req: req, res: res, next: next
        }).renderPage(err, `pages/error.ejs`);
    }
    static isXhr(req) {
        return req.xhr || (req.headers.accept && req.headers.accept.indexOf('json') > -1);
    }
    error404Handler(req, res, next) {
        let redirect = req.__redirects[req.path];
        if (redirect) {
            let q = req.originalUrl.replace(req.path, '');
            return res.redirect(redirect.toUrl + (q), redirect.permanent ? 301 : 302);
        }
        if (ErrorMiddleware.isXhr(req))
            res.status(404).send("Sorry can't find that!");
        else
            new error_1.default({
                req: req, res: res, next: next
            }).renderPage(new Error(), "pages/error.404.ejs", 404);
    }
    constructor(app) {
        super(app);
        app.use(this.logErrors);
        app.use(this.clientErrorHandler);
        app.use(this.errorHandler);
        app.use(this.error404Handler);
    }
}
exports.default = (app) => errormw = new ErrorMiddleware(app);
// curl - X POST  https://rest.nexmo.com/sms/json \
// -d api_key = c20d0a9e \
// -d api_secret = rv6URkJ64TTYP7AD \
// -d to = 905326274151 \
// -d from = "NEXMO" \
// -d text = "Hello from Nexmo"
