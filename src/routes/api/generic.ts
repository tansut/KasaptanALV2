import { Auth } from '../../lib/common';
import { ApiRouter } from '../../lib/router';
import * as express from "express";

export default class Route extends ApiRouter {

    search() {
        return new Promise((resolve, reject) => {
            resolve('Oh yeah!');
        });
    }

    @Auth.Anonymous()
    searchRoute() {
        return this.search().then((data) => this.res.send(data));
    }

    static SetRoutes(router: express.Router) {
        router.get("/search", Route.BindRequest(this.prototype.searchRoute));
    }
}


