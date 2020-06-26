"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class MiddlewareLoader {
    static use(app) {
        return [
            require('./auth').default(app),
            require('./sitemap').default(app)
        ];
    }
}
exports.default = MiddlewareLoader;
