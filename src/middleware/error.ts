import { HttpError, AppRequest } from "../lib/http"
import ErrorRoute from "../routes/error";
import * as express from "express";
import * as moment from 'moment';
import Middleware from "./base";
import email from "../lib/email";
import config from "../config";
import Helper from "../lib/helper";

var errormw: ErrorMiddleware;

class ErrorMiddleware extends Middleware {

    

    logErrors(err, req, res, next) {
        Helper.logError(err, null, req);
        next(err)
    }

    clientErrorHandler(err, req, res, next) {
        if (ErrorMiddleware.isXhr(req)) {
            let isHttpErr = err instanceof HttpError
            let httpErr = isHttpErr ? <HttpError>err : null;
            let msg = httpErr ? httpErr.message : (err.message || err.name) ;
            // if (config.nodeenv == 'production') {
            //     email.send('tansut@gmail.com', 'hata/XHR: kasaptanAl.com', "error.ejs", {
            //         text: Helper.getErrorLog(err, req),
            //         stack: err.stack
            //     })
            // }

            res.status((httpErr && httpErr.statusCode) ? httpErr.statusCode : 500).send({ msg: msg })
        } else {
            next(err)
        }
    }

    errorHandler(err, req, res, next) {
        let httpErr = err instanceof HttpError ? null : <HttpError>err;
        res.status((httpErr && httpErr.statusCode) ? httpErr.statusCode : 500);
        // if (config.nodeenv == 'production') {
        //     email.send('tansut@gmail.com', 'hata: kasaptanAl.com', "error.ejs", {
        //         text: Helper.getErrorLog(err, req),
        //         stack: err.stack
        //     })
        // }

        new ErrorRoute({
            req: req, res: res, next: next
        }).renderPage(err, `pages/error.ejs`)
    }

    static isXhr(req) {
        return req.xhr || (req.headers.accept && req.headers.accept.indexOf('json') > -1);
    }

    error404Handler(req: AppRequest, res, next) {
        let redirect = req.__redirects[req.path];
        if (redirect) {
            let q = req.originalUrl.replace(req.path, '')
            return res.redirect(redirect.toUrl + (q), redirect.permanent ? 301 : 302)
        }
        if (ErrorMiddleware.isXhr(req))
            res.status(404).send("Sorry can't find that!")
        else
            new ErrorRoute({
                req: req, res: res, next: next
            }).renderPage(new Error(), "pages/error.404.ejs", 404)
    }


    constructor(app: express.IRouter) {
        super(app);
        app.use(this.logErrors)
        app.use(this.clientErrorHandler)
        app.use(this.errorHandler)
        app.use(this.error404Handler)

    }
}

export default (app: express.Application) => errormw = new ErrorMiddleware(app);



// curl - X POST  https://rest.nexmo.com/sms/json \
// -d api_key = c20d0a9e \
// -d api_secret = rv6URkJ64TTYP7AD \
// -d to = 905326274151 \
// -d from = "NEXMO" \
// -d text = "Hello from Nexmo"