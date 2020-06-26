"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sm = void 0;
const base_1 = require("./base");
const sitemap_1 = require("../lib/sitemap");
const sitemap_2 = require("sitemap");
const zlib_1 = require("zlib");
var passport = require('passport'), LocalStrategy = require('passport-local').Strategy;
class SitemapMiddleware extends base_1.default {
    constructor(app) {
        super(app);
        app.get('/sitemap.xml', this.sitemapXML.bind(this));
    }
    sitemapXML(req, res) {
        res.header('Content-Type', 'application/xml');
        res.header('Content-Encoding', 'gzip');
        this.sitemap = null;
        if (this.sitemap) {
            res.send(this.sitemap);
            return;
        }
        try {
            const smStream = sitemap_1.default.getStream();
            const pipeline = smStream.pipe(zlib_1.createGzip());
            sitemap_1.default.fill(smStream).then(() => {
                smStream.end();
                sitemap_2.streamToPromise(pipeline).then(sm => this.sitemap = sm);
                // stream the response
                pipeline.pipe(res).on('error', (e) => { throw e; });
            }).catch(e => {
                console.error(e);
                res.status(500).end();
            });
        }
        catch (e) {
            console.error(e);
            res.status(500).end();
        }
    }
}
exports.default = (app) => exports.sm = new SitemapMiddleware(app);

//# sourceMappingURL=sitemap.js.map
