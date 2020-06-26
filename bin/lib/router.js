"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CrudOperation = exports.ViewRouter = exports.ApiRouter = exports.ResponseStatus = void 0;
const http = require("./http");
const auth_1 = require("../middleware/auth");
const common_1 = require("./common");
require("reflect-metadata");
const config_1 = require("../config");
const path = require("path");
const category_1 = require("../db/models/category");
const product_1 = require("../db/models/product");
let ellipsis = require('text-ellipsis');
var MarkdownIt = require('markdown-it');
var ResponseStatus;
(function (ResponseStatus) {
    ResponseStatus[ResponseStatus["success"] = 0] = "success";
    ResponseStatus[ResponseStatus["warning"] = 1] = "warning";
    ResponseStatus[ResponseStatus["error"] = 2] = "error";
})(ResponseStatus = exports.ResponseStatus || (exports.ResponseStatus = {}));
class BaseRouter {
    constructor(reqParams) {
        this._markdown = null;
        if (reqParams) {
            this.req = reqParams.req;
            this.res = reqParams.res;
            this.next = reqParams.next;
        }
        this.constructorParams = reqParams;
    }
    get Markdown() {
        this._markdown = this._markdown || new MarkdownIt();
        return this._markdown;
    }
    get url() {
        let proto = this.req.header("x-forwarded-proto") || this.req.protocol;
        let host = config_1.default.nodeenv == "development" ? this.req.get('Host') : 'www.kasaptanal.com';
        return proto + '://' + host;
    }
    forceAuthenticate(req, res, next) {
        return auth_1.auth.force(req, res, next);
    }
    get publicDir() {
        return (config_1.default.publicDir == '') ? "public/" : config_1.default.publicDir;
    }
    static BindRequest(method, methodParams) {
        var self = this;
        return (req, res, next) => BaseRouter.CreateRouterInstance(req, res, next, self, method, methodParams);
    }
    static AuthenticateRequest() {
        var self = this;
        return (req, res, next) => BaseRouter.CreateRouterInstance(req, res, next, self, 'forceAuthenticate');
    }
    static CreateRouterInstance(req, res, next, constructor, method, methodParams) {
        var instance = new constructor({
            req: req,
            res: res,
            next: next
        });
        let handler = typeof (method) == "string" ? instance[method] : instance[method.name];
        var anonymous = common_1.Auth.GetAnonymous(handler);
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
    validateOwnership(ownerOfResource) {
        return new Promise((resolve, reject) => {
            var user = this.req.user;
            var id = user.id.toString() || user.id;
            var ownerId = ownerOfResource.toString() || ownerOfResource;
            if (ownerId == id)
                resolve();
            else if (user.roles.indexOf('admin') >= 0)
                resolve();
            else
                reject(new http.PermissionError());
        });
    }
    sendFile(file, fromRoot = true) {
        return new Promise((resolve, reject) => {
            let fpath = fromRoot ? path.resolve(path.join(config_1.default.projectDir, file)) : file;
            //var stats = fs.statSync(fpath);
            //var mtime = stats.mtime;
            //this.res.append("Last-Modified", mtime.toUTCString())
            //this.res.append("Cache-Control", "public")
            //this.res.append("Expires", moment.utc().toString())
            // this.res.append('Last-Modified', (new Date(lastModifiedStringDate)).toUTCString());
            this.res.sendFile(fpath, (err) => { err ? reject(err) : resolve(); });
        });
    }
    getPreferredAddress() {
    }
}
exports.default = BaseRouter;
class ApiRouter extends BaseRouter {
}
exports.ApiRouter = ApiRouter;
class ViewRouter extends BaseRouter {
    constructor(reqParams) {
        super(reqParams);
        if (this.req && this.req["session"] && this.req["session"].areal1 != null) {
            this.selectedArea = this.req["session"].areal1;
        }
    }
    createCategoryMenu() {
        return __awaiter(this, void 0, void 0, function* () {
            let categories = yield category_1.default.findAll({
                where: {
                    type: ['reyon', 'amac']
                },
                order: ["displayOrder"]
            });
            let products = yield product_1.default.findAll({
                where: {
                    "ProductCategory.categoryId": categories.map(p => p.id)
                },
                limit: 5
            });
            let prods = {};
            return {
                categories: categories,
                products: null
            };
        });
    }
    viewData(data) {
        return Object.assign({
            res: this.res,
            req: this.req,
            config: config_1.default,
            controller: this,
        }, data);
    }
    renderView(view, pageKey = null, vdata = {}) {
        pageKey = pageKey || view;
        let dbViewData = this.req.__webpages[pageKey] || {};
        let result = Object.assign(Object.assign({}, dbViewData), vdata);
        this.res.render(view, this.viewData(result));
    }
    sendView(view, vdata = {}) {
        this.renderView(view, view, vdata);
    }
    static BindToView(view, viewData = {}) {
        var self = this;
        return (req, res, next) => BaseRouter.CreateRouterInstance(req, res, next, self, "sendView", [view, viewData]);
    }
}
__decorate([
    common_1.Auth.Anonymous(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ViewRouter.prototype, "sendView", null);
exports.ViewRouter = ViewRouter;
var CrudOperation;
(function (CrudOperation) {
    CrudOperation[CrudOperation["read"] = 0] = "read";
    CrudOperation[CrudOperation["create"] = 1] = "create";
    CrudOperation[CrudOperation["update"] = 2] = "update";
    CrudOperation[CrudOperation["delete"] = 3] = "delete";
})(CrudOperation = exports.CrudOperation || (exports.CrudOperation = {}));
