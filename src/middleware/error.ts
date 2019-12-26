import { HttpError } from "../lib/http"
import ErrorRoute from "../routes/error";
import * as express from "express";
import * as moment from 'moment';
import Middleware from "./base";

var errormw: ErrorMiddleware;

class ErrorMiddleware extends Middleware {

    logErrors(err, req, res, next) {
        console.error(err.stack)
        next(err)
    }

    clientErrorHandler(err, req, res, next) {
        if (ErrorMiddleware.isXhr(req)) {
            let httpErr = err instanceof HttpError ? null : <HttpError>err;
            res.status((httpErr && httpErr.statusCode) ? httpErr.statusCode : 500).send({ msg: httpErr ? httpErr.message : err.name || err.message })
        } else {
            next(err)
        }
    }

    errorHandler(err, req, res, next) {
        let httpErr = err instanceof HttpError ? null : <HttpError>err;
        res.status((httpErr && httpErr.statusCode) ? httpErr.statusCode : 500);
        new ErrorRoute({
            req: req, res: res, next: next
        }).renderPage(err, `pages/error.ejs`)
    }

    static isXhr(req) {
        return req.xhr || (req.headers.accept && req.headers.accept.indexOf('json') > -1);
    }

    error404Handler(req, res, next) {
        if (ErrorMiddleware.isXhr(req))
            res.res.status(404).send("Sorry can't find that!")
        else
        new ErrorRoute({
            req: req, res: res, next: next
        }).renderPage(new Error(), "pages/error.404.ejs")
    }


    constructor(app: express.IRouter<any>) {
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