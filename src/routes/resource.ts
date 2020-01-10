import { ApiRouter, ViewRouter } from '../lib/router';
import * as express from "express";
import * as maps from "@google/maps"
import ButcherModel from '../db/models/butcher';
import { Auth } from '../lib/common';
import Helper from '../lib/helper';
import Resource from '../db/models/resource';
import * as path from "path"
import * as Jimp2 from 'jimp'
const Jimp = <Jimp2.default>require('jimp');
import * as fs from "fs"
import moment = require('moment');
import { ResourceCacheItem } from '../lib/cache';
import config from '../config';


export default class Route extends ViewRouter {

    sendCachedPhoto(url) {
        //Get the image from filesystem
        let file = path.resolve(url);

        //var img = fs.readFileSync(file);

        //Get some info about the file
        var stats = fs.statSync(file);
        var mtime = stats.mtime;
        var size = stats.size;

        //Get the if-modified-since header from the request
        var modifiedHeader = this.req.headers["if-modified-since"];

        //check if if-modified-since header is the same as the mtime of the file 
        if (modifiedHeader != null) {
            let reqModDate = new Date(this.req.headers["if-modified-since"]);
            if (reqModDate.toUTCString() == mtime.toUTCString()) {
                //Yes: then send a 304 header without image data (will be loaded by cache)
                console.log("load from cache");
                this.res.writeHead(304, {
                    "Last-Modified": mtime.toUTCString()
                });

                this.res.end();
                return true;
            }
        } else {
            return false;
        }

    }

    // sendPhoto(url, resource: Resource, thumbnail: boolean) {
    //     return Jimp.read(path.resolve(url))
    //         .then(image => {
    //             let _img = image;
    //             thumbnail ? _img = _img.quality(80).cover(500, 500) : _img;

    //             return _img.getBufferAsync("image/jpeg").then(buff => {
    //                 var stats = fs.statSync(path.resolve(url));
    //                 var mtime = stats.mtime;
    //                 var size = stats.size;

    //                 this.res.set("jpeg")
    //                 this.res.header("Last-Modified", mtime.toUTCString())
    //                 this.res.header("Cache-Control", "public")
    //                 this.res.header("Expires", moment.utc().toString())

    //                 this.res.send(new Buffer(buff))
    //             })
    //         }).catch(e => {
    //             //this.res.send(path.resolve(url));
    //             this.res.sendStatus(404);
    //         })


    // }

    async sendDefaultFile(file: string) {
        return this.sendFile(file).catch(e => this.res.sendStatus(404))
    }

    async sendResource(resource: ResourceCacheItem, thumbnail: boolean, defaultPath: string) {
        let pathprefix = resource ? resource.folder : "";
        if (!resource) {
            if (defaultPath) {
                return this.sendDefaultFile(defaultPath)
            } else return this.next();
        }
        //let filePath = thumbnail ? `${this.publicDir}${pathprefix}/${resource.thumbnailUrl}` : `${this.publicDir}${pathprefix}/${resource.contentUrl}`
        let filePath = thumbnail ? `${pathprefix}/${resource.thumbnailUrl}` : `${pathprefix}/${resource.contentUrl}`


        return this.res.redirect(`http://static.kasaptanal.com/${filePath}`);

        //if (config.nodeenv == 'developmen')

        //return this.sendFile(path.resolve(filePath), false).catch(e => { return defaultPath ? this.sendDefaultFile(defaultPath) : Promise.reject(e) })
    }

    @Auth.Anonymous()
    async viewRoute() {
        if (!this.req.params.id) return this.next();
        let id = parseInt(this.req.params.id)
        let resource = await Resource.findByPk(id);
        return this.sendResource(resource, this.req.query.thumbnail ? true : false, null)
    }

    static SetRoutes(router: express.Router) {
        router.get("/resource/:id", Route.BindRequest(Route.prototype.viewRoute));
    }
}