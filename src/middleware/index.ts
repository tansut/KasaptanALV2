import * as express from "express";

export default class MiddlewareLoader {
    static use(app: express.IRouter) {
        return [
            require('./auth').default(app),
            //require('./error').default(app)
        ]
    }
}
