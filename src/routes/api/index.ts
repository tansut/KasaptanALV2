import * as express from "express";

let appRoutes = [
    './butcher',
    './status',
    './area',
    './sitelog',
    './generic',
    './user',
    './shopcard',
    './fts',
    './order',
    './product'
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
