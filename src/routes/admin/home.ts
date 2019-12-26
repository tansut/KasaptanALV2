import * as express from "express";
import { ViewRouter } from '../../lib/router';
import moment = require('moment');
import { CacheManager } from "../../lib/cache";

export default class Route extends ViewRouter {



    clearCache()  {
        CacheManager.clear();
        this.res.redirect('/pages/admin/home')
    }

    static SetRoutes(router: express.Router) {
        router.get("/home", Route.BindToView("pages/admin/home.ejs"));
        router.get("/admin/clearcache", Route.BindRequest(Route.prototype.clearCache));
    }
}

