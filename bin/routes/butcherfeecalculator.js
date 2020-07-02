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
const router_1 = require("../lib/router");
const common_1 = require("../lib/common");
const commissionHelper_1 = require("../lib/commissionHelper");
let ellipsis = require('text-ellipsis');
var MarkdownIt = require('markdown-it');
class Route extends router_1.ViewRouter {
    renderPage(msg = undefined) {
        this.sendView(`pages/butcher.feecalculator.ejs`, {
            pageTitle: 'Komisyon Hesap Makinesi'
        });
    }
    viewRoute() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.req.query.go && this.req.query.total && this.req.query.rate) {
                this.calculateRoute(parseFloat(this.req.query.total), parseFloat(this.req.query.rate));
            }
            else
                this.renderPage();
        });
    }
    calculateRoute(totalSales = 0.00, ratePercParam = 0.00) {
        return __awaiter(this, void 0, void 0, function* () {
            let total = parseFloat(this.req.body.salesTotal) || totalSales;
            let ratePerc = ratePercParam || parseFloat(this.req.body.rate);
            let calc = new commissionHelper_1.ComissionHelper(ratePerc / 100, 0);
            this.feeResult = calc.calculateButcherComission(total);
            this.renderPage();
        });
    }
    static SetRoutes(router) {
        router.get("/gelir-hesapla", Route.BindRequest(Route.prototype.viewRoute));
        router.post("/gelir-hesapla", Route.BindRequest(Route.prototype.calculateRoute));
    }
}
__decorate([
    common_1.Auth.Anonymous(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], Route.prototype, "viewRoute", null);
__decorate([
    common_1.Auth.Anonymous(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", Promise)
], Route.prototype, "calculateRoute", null);
exports.default = Route;