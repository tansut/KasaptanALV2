// import { IUserDocument } from '../db/models/user';

import * as express from 'express';
import User, { PreferredAddress } from '../db/models/user';
import { ShopCard } from '../models/shopcard';
import { RequestHelper } from './RequestHelper';
import Category from '../db/models/category';
import { ResourceCacheItem, ProductCacheItem, CategoryProductItem, ButcherCacheItem, WebPageCacheItem } from './cache';
import Content from '../db/models/content';

export class ApplicationError extends Error {
    protected constructor(message?: string) {
        super(message);
    }
}

export class BusinessError extends ApplicationError {
    protected constructor(message?: string) {
        super(message);
    }
}

export class TehnicalError extends ApplicationError {
    protected constructor(message?: string) {
        super(message);
    }
}

export class HttpError extends ApplicationError {
    static dbErrorCodes = {
        11000: 'It seems there already exists a record with this id'
    }
    protected constructor(public statusCode: number, message?: string) {
        super(message);
    }

    static createFromDbError(err: any, overides: { [key: number]: string }) {
        var code = err.code, errorText = overides[code] || this.dbErrorCodes[code] || 'Unknown database error';
        return new HttpError(500, errorText)
    }
}


export class PermissionError extends HttpError {
    constructor(msg?: string) {
        super(401, msg || 'unauthorized');
    }
}

export class NotFoundError extends HttpError {
    constructor(msg?: string) {
        super(404, msg || 'notfound');
    }
}

export class ValidationError extends HttpError {
    constructor(msg: string, code: number=422) {
        super(code, msg || 'invaliddata');
    }
}

export interface AppRequest extends express.Request {
    user: User;
    session: any;
    helper: RequestHelper;
    prefAddr: PreferredAddress;
    __categories: Category[];
    __resources: { [key: string]: [ResourceCacheItem]; }
    __products: { [key: string]: ProductCacheItem; }
    __recentBlogs: Content[];
    __categoryProducts: { [key: string]: CategoryProductItem[]; }
    __butchers: { [key: string]: ButcherCacheItem; }
    __webpages: { [key: string]: WebPageCacheItem; }

}
 