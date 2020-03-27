import { Auth } from '../../lib/common';
import { ApiRouter } from '../../lib/router';
import * as express from "express";
import SiteLog from '../../db/models/sitelog';
import email from '../../lib/email';

// type express.response : {
//     session: any
// }

export default class SiteLogRoute extends ApiRouter {


    async log(content: any) {
        var objectC = {...content, ...{
            sessionid: this.req["session"].id,
            ip: this.req.header("x-forwarded-for") || this.req.connection.remoteAddress
        }};
        await SiteLog.create(objectC)
    }

    @Auth.Anonymous()
    async logRoute() {
        // if (this.req["session"].id != this.req.body.sessionid)
        //     return this.res.sendStatus(400)
        await SiteLog.create({
            sessionid: this.req["session"].id,
            f1: this.req.body.city,
            f2: this.req.body.district,
            logtype: this.req.body.logtype,
            email: this.req.body.email,
            ip: this.req.header("x-forwarded-for") || this.req.connection.remoteAddress
        })
        if (this.req.body.email) {
            if (this.req.body.logtype == "anonymous-user-download-meat-guide") {
                await email.send(this.req.body.email, "iyi et rehberi", "meatguide.ejs", {
                    email: this.req.body.email
                })
            }
        }
        this.res.sendStatus(200)
    }

    static SetRoutes(router: express.Router) {
        router.post("/sitelog/create", SiteLogRoute.BindRequest(this.prototype.logRoute));
    }
}


