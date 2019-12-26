import * as express from "express";

let appRoutes = [
    './butcher',
    './area',
    './resource',
    './product',
    './category',
    './content',
    './product.list',
    './default',
    './anonymous',
    './error',
    './shopcard'
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
