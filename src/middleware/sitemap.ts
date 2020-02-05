import * as express from "express";
import * as moment from 'moment';
import Middleware from "./base";
import SiteMapManager from '../lib/sitemap'
import { AppRequest } from '../lib/http'
import { SitemapStream, streamToPromise } from 'sitemap'
import { createGzip } from "zlib"

var passport = require('passport')
    , LocalStrategy = require('passport-local').Strategy;

export var sm: SitemapMiddleware;

class SitemapMiddleware extends Middleware {

    sitemap: any;

    sitemapXML(req: AppRequest, res: express.Response) {
        res.header('Content-Type', 'application/xml');
        res.header('Content-Encoding', 'gzip');       
        this.sitemap = null;
        if (this.sitemap) {
            res.send(this.sitemap)
            return;
          }
          try {
            const smStream = SiteMapManager.getStream();
            const pipeline = smStream.pipe(createGzip())

            SiteMapManager.fill(smStream).then(()=> {
                smStream.end() 

                streamToPromise(pipeline).then(sm => this.sitemap = sm)
                // stream the response
                pipeline.pipe(res).on('error', (e) => {throw e})
            }).catch(e=>{
                console.error(e)
                res.status(500).end()
            });

          } catch (e) {
            console.error(e)
            res.status(500).end()
          }
    }

    constructor(app: express.IRouter) {
        super(app);
        app.get('/sitemap.xml', this.sitemapXML.bind(this));
    }
}


export default (app: express.Application) => sm = new SitemapMiddleware(app);
