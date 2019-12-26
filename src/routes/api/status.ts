import { Auth } from '../../lib/common';
import { ApiRouter } from '../../lib/router';
import * as express from "express";

export default class Route extends ApiRouter {

    status() {
        return new Promise((resolve, reject) => {
            resolve('Oh yeah!');
        });
    }

    @Auth.Anonymous()
    statusRoute() {
        return this.status().then((data) => this.res.send(data));
    }

    static SetRoutes(router: express.Router) {
        router.get("/status", Route.BindRequest(this.prototype.statusRoute));
    }
}


