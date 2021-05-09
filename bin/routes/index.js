"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
let appRoutes = [
    './default',
    './shopcard',
    './product.list',
    './anonymous',
    './error',
    './category',
    './content',
    './area',
    './resource',
    './product',
    './pricecategory',
    './creditcard',
    './payorder',
    './butcherfeecalculator',
    './manageorder',
    './butcherview'
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
