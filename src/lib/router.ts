import * as http from './http';
import * as express from "express";
import { auth } from '../middleware/auth';
import { Auth } from './common';
import 'reflect-metadata';
import { request } from 'https';
import * as stream from 'stream';
import * as _ from 'lodash';
import * as moment from 'moment';
import sequelize = require('sequelize');
import config from "../config";
import * as path from "path";
import Area from '../db/models/area';
import Category from '../db/models/category';
import Product from '../db/models/product';
import { where } from 'sequelize';
let ellipsis = require('text-ellipsis');
import { PreferredAddress } from '../db/models/user';
var MarkdownIt = require('markdown-it')

import * as fs from "fs"

export enum ResponseStatus {
    success = 0,
    warning = 1,
    error = 2
}

export interface ApiResponse {
    $status: ResponseStatus,
    result?: any;
}

export interface ICredentialIdentifier {
    _id: string;
    roles: Array<string>;
}

export interface IRequestParams {
    req: http.AppRequest;
    res: express.Response;
    next: Function;
}

export default class BaseRouter {
    protected req: http.AppRequest;
    protected res: express.Response;
    protected next: Function;
    private _markdown = null;

    protected constructorParams: any;

    get Markdown() {
        this._markdown = this._markdown || new MarkdownIt();
        return this._markdown;
    }

    forceAuthenticate(req, res, next) {
        return auth.force(req, res, next);
    }

    get publicDir() {
        return (config.publicDir == '') ? "public/" : config.publicDir
    }

    

    protected static BindRequest(method: string | Function) {

        var self = this;

        return (req, res, next) => BaseRouter.CreateRouterInstance(req, res, next, self, method);
    }

    protected static AuthenticateRequest() {
        var self = this;
        return (req, res, next) => BaseRouter.CreateRouterInstance(req, res, next, self, 'forceAuthenticate');
    }


    protected static CreateRouterInstance(req: http.AppRequest, res: express.Response, next: Function, constructor: typeof BaseRouter, method: string | Function, methodParams?: any): BaseRouter {
        var instance = new constructor({
            req: req,
            res: res,
            next: next
        });

        let handler = typeof (method) == "string" ? instance[method] : instance[method.name];
        var anonymous = Auth.GetAnonymous(handler);

        if (!anonymous && !req.user)
            return next(new http.PermissionError());


        var promise = handler.apply(instance, methodParams);

        if (promise && (typeof promise['catch'] == 'function')) {
            promise.catch((err) => {
                next(err);
            });
        }

        return instance;
    }

    validateOwnership(ownerOfResource: string) {
        return new Promise((resolve, reject) => {
            var user = this.req.user;
            var id = user.id.toString() || user.id;
            var ownerId = ownerOfResource.toString() || ownerOfResource;
            if (ownerId == id)
                resolve();
            else if (user.roles.indexOf('admin') >= 0)
                resolve();
            else reject(new http.PermissionError());
        });
    }

    sendFile(file: string, fromRoot: boolean = true) {
        return new Promise((resolve, reject) => {
            let fpath = fromRoot ? path.resolve(path.join(config.projectDir, file)) : file;

            //var stats = fs.statSync(fpath);
            //var mtime = stats.mtime;

            //this.res.append("Last-Modified", mtime.toUTCString())
            //this.res.append("Cache-Control", "public")
            //this.res.append("Expires", moment.utc().toString())

            // this.res.append('Last-Modified', (new Date(lastModifiedStringDate)).toUTCString());

            this.res.sendFile(fpath, (err) => { err ? reject(err) : resolve(); });
        })
    }

    getPreferredAddress() {

    }


    constructor(reqParams?: IRequestParams) {
        if (reqParams) {
            this.req = reqParams.req;
            this.res = reqParams.res;
            this.next = reqParams.next;
        }
        this.constructorParams = reqParams;
    }
}

export class ApiRouter extends BaseRouter {

}

interface CategoryMenuData {
    categories: Category[];
    products: { key: string, value: Product }
}

export class ViewRouter extends BaseRouter {

    selectedArea: any;
    categoryData: CategoryMenuData;

    constructor(reqParams?: IRequestParams) {
        super(reqParams);
        if (this.req && this.req["session"] && this.req["session"].areal1 != null) {
            this.selectedArea = this.req["session"].areal1
        }
    }

    async createCategoryMenu() {
        let categories = await Category.findAll({
            where: {
                type: ['reyon', 'amac']
            },
            order: ["displayOrder"]
        });
        let products = await Product.findAll({
            where: {
                "ProductCategory.categoryId": categories.map(p => p.id)
            },
            limit: 5
        }
        )
        let prods = {};

        return {
            categories: categories,
            products: null
        }
    }

    viewData(data) {
        return {
            ...{
                res: this.res,
                req: this.req,
                config: config,
                controller: this,
            },
            ...data
        }
    }


    protected renderView(view: string, pageKey: string = null, vdata = {}) {
        pageKey = pageKey || view;
        let dbViewData = this.req.__webpages[pageKey] || {};        
        let result = { ...dbViewData, ...vdata };
        this.res.render(view, this.viewData(result))
    }


    @Auth.Anonymous()
    protected sendView(view: string, vdata = {}) {
        this.renderView(view, view, vdata)
    }


    protected static BindToView(view: string, viewData = {}) {
        var self = this;
        return (req, res, next) => BaseRouter.CreateRouterInstance(req, res, next, self, "sendView", [view, viewData]);
    }


}


export interface crudRouteOptions {
    create?: boolean,
    delete?: boolean,
    update?: boolean,
    retrieve?: boolean,
    query?: boolean
}

export enum CrudOperation {
    read, create, update, delete
}

export interface RetrieveOptions {
    lean?: boolean,
    fields?: string;
    toClient?: boolean;
    disableOwnership?: boolean
}

