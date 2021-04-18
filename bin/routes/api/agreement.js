"use strict";
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
const router_1 = require("../../lib/router");
const butcher_1 = require("../../db/models/butcher");
const area_1 = require("../../db/models/area");
const ejs = require("ejs");
const config_1 = require("../../config");
const path = require("path");
class Route extends router_1.ApiRouter {
    getFile(template, data) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                ejs.renderFile(path.join(config_1.default.projectDir, 'src/views/legal/' + template), data, {}, (err, res) => {
                    err ? reject(err) : resolve(res);
                });
            });
        });
    }
    butchersales() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.req.query.butcherid)
                return this.next();
            let butcher = yield butcher_1.default.findByPk(parseInt(this.req.query.butcherid), {
                include: [{
                        model: area_1.default,
                        all: true,
                        as: "areaLevel1Id"
                    }]
            });
            if (!butcher)
                return this.next();
            let file = yield this.getFile("seller.sales-agreement.ejs", {
                butcher: butcher
            });
            let content = this.Markdown.render(file);
            this.res.send({
                title: 'Satış Sözleşmesi',
                content: content
            });
        });
    }
    butcherkvkk() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.req.query.butcherid)
                return this.next();
            let butcher = yield butcher_1.default.findByPk(parseInt(this.req.query.butcherid), {
                include: [{
                        model: area_1.default,
                        all: true,
                        as: "areaLevel1Id"
                    }]
            });
            if (!butcher)
                return this.next();
            let file = yield this.getFile("seller.kvkkaydinlatma.ejs", {
                butcher: butcher
            });
            let content = this.Markdown.render(file);
            this.res.send({
                title: 'KVKK Aydınlatma Metni',
                content: content
            });
        });
    }
    butcherriza() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.req.query.butcherid)
                return this.next();
            let butcher = yield butcher_1.default.findByPk(parseInt(this.req.query.butcherid), {
                include: [{
                        model: area_1.default,
                        all: true,
                        as: "areaLevel1Id"
                    }]
            });
            if (!butcher)
                return this.next();
            let file = yield this.getFile("seller.rizametni.ejs", {
                butcher: butcher
            });
            let content = this.Markdown.render(file);
            this.res.send({
                title: 'KVKK Açık Rıza Metni',
                content: content
            });
        });
    }
    static SetRoutes(router) {
        router.get("/agreement/content/butchersales", Route.BindRequest(this.prototype.butchersales));
        router.get("/agreement/content/butcherkvkk", Route.BindRequest(this.prototype.butcherkvkk));
        router.get("/agreement/content/butcherriza", Route.BindRequest(this.prototype.butcherriza));
    }
}
exports.default = Route;
