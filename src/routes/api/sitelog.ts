import { Auth } from '../../lib/common';
import { ApiRouter } from '../../lib/router';
import * as express from "express";
import SiteLog from '../../db/models/sitelog';
import email from '../../lib/email';
import {Op} from "sequelize";
import { ISiteLogger } from '../../models/common';
 

import Helper from '../../lib/helper';

// type express.response : {
//     session: any
// }



export default class SiteLogRoute extends ApiRouter implements ISiteLogger {

    async countBy(where: any, seconds: number) {
        var t = Helper.Now();
        
        t.setTime(t.getTime() - seconds * 1000);

        where = where || {};
        where['creationDate'] = {
            [Op.gt]: t
        }
        return await SiteLog.count({
            where: where
        })
    }

    async isFraud(where: any) {
        const seconds = 360, ccount = 5;
        let count = await this.countBy(where, seconds);
        if (count > ccount) return true;
        // if (this.userIp)
        // {
        //     count = await this.countBy({ip: this.userIp}, seconds);
        // }  
        // if (count > ccount) return true;
        return false;
    }


    async log(content: any) {
        var objectC = {...content, ...{
            sessionid: (this.req && this.req["session"]) ? this.req["session"].id: null,
            userid: (this.req && this.req.user) ? this.req.user.id: null,
            ip: this.req ? (this.req.header("x-forwarded-for") || this.req.connection.remoteAddress): null
        }};
        await SiteLog.create(objectC)
    }

    @Auth.Anonymous()
    async logRoute() {
        // if (this.req["session"].id != this.req.body.sessionid)
        //     return this.res.sendStatus(400)
        await SiteLog.create({
            userid: this.req.user ? this.req.user.id: null,
            sessionid: this.req["session"] ? this.req["session"].id: null,
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
                }, 'user/meatguide')
            }
        }
        this.res.sendStatus(200)
    }

    static SetRoutes(router: express.Router) {
        router.post("/sitelog/create", SiteLogRoute.BindRequest(this.prototype.logRoute));
    }
}


