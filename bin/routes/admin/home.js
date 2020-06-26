"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const router_1 = require("../../lib/router");
const cache_1 = require("../../lib/cache");
class Route extends router_1.ViewRouter {
    clearCache() {
        cache_1.CacheManager.clear();
        this.res.redirect('/pages/admin/home');
    }
    static SetRoutes(router) {
        router.get("/home", Route.BindToView("pages/admin/home.ejs"));
        router.get("/admin/clearcache", Route.BindRequest(Route.prototype.clearCache));
    }
}
exports.default = Route;

//# sourceMappingURL=home.js.map
