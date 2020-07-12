"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
let appRoutes = [
    './home'
];
class RouteLoader {
    static use(router) {
        var routings = [];
        appRoutes.forEach((file) => {
            var routing = require(file).default.SetRoutes(router);
            routings.push(routing);
        });
        return routings;
    }
}
exports.default = RouteLoader;

//# sourceMappingURL=index.js.map
