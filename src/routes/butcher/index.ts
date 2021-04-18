import * as express from "express";

let appRoutes = [
    './home',
    './products',
    './products2',
    './payment',
    './orders'
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
