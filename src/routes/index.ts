import * as express from "express";

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
    './payorder'
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
