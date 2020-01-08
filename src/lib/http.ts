// import { IUserDocument } from '../db/models/user';

import * as express from 'express';
import User, { PreferredAddress } from '../db/models/user';
import { ShopCard } from '../models/shopcard';
import { RequestHelper } from './RequestHelper';
import Category from '../db/models/category';
import { ResourceCacheItem, ProductCacheItem, CategoryProductItem } from './cache';
import Content from '../db/models/content';

export class ApplicationError extends Error {
    protected constructor(public name: string) {
        super();
    }
}

export class BusinessError extends ApplicationError {
    protected constructor(public name: string) {
        super(name);
    }
}

export class TehnicalError extends ApplicationError {
    protected constructor(public name: string) {
        super(name);
    }
}

export class HttpError extends ApplicationError {
    static dbErrorCodes = {
        11000: 'It seems there already exists a record with this id'
    }
    protected constructor(public statusCode: number, public name: string) {
        super(name);
    }

    static createFromDbError(err: any, overides: { [key: number]: string }) {
        var code = err.code, errorText = overides[code] || this.dbErrorCodes[code] || 'Unknown database error';
        return new HttpError(500, errorText)
    }
}


export class PermissionError extends HttpError {
    constructor(msg: string = null) {
        super(401, msg || 'unauthorized');
    }
}

export class NotFoundError extends HttpError {
    constructor(msg: string = null) {
        super(404, msg || 'notfound');
    }
}

export class ValidationError extends HttpError {
    constructor(msg: string = null) {
        super(422, msg || 'invaliddata');
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
}
