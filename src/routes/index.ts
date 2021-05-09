import * as express from "express";

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

export default class RouteLoader {
    static use(router?: express.Router) {
        var routings = [];
        appRoutes.forEach((file) => {
            var routing = require(file).default.SetRoutes(router);
            routings.push(routing);
        });
        return routings;
    }
}
