"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
let appRoutes = [
    './butcherview',
    './area',
    './resource',
    './product',
    './category',
    './pricecategory',
    './content',
    './product.list',
    './default',
    './anonymous',
    './error',
    './shopcard',
    './creditcard',
    './payorder',
    './butcherfeecalculator',
    './manageorder'
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
