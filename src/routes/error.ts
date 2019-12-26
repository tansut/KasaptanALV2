import { ApiRouter, ViewRouter } from '../lib/router';
import * as express from "express";
import * as maps from "@google/maps"
import ButcherModel from '../db/models/butcher';
import moment = require('moment');
import { Auth } from '../lib/common';
import AreaModel from '../db/models/area';
import Helper from '../lib/helper';
import Area from '../db/models/area';
import Category from '../db/models/category';
import Content from '../db/models/content';
import config from '../config';
import * as path from 'path';
import * as fs from 'fs';
import { readFileSync } from 'fs';
import { HttpError } from '../lib/http';
let ellipsis = require('text-ellipsis');
var MarkdownIt = require('markdown-it')

export default class Route extends ViewRouter {

    renderPage(err, page) {
        let httpErr = err instanceof HttpError ? null : <HttpError>err;
        //this.res.status(httpErr && httpErr.statusCode ? httpErr.statusCode : 500).send({ error: httpErr ? httpErr.message : err.message })
        this.res.status(404)
        this.res.render(page, this.viewData({
            error: err
        }))
    }


    static SetRoutes(router: express.Router) {

    }
}