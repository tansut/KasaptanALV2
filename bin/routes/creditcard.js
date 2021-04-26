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
const common_1 = require("../lib/common");
let ellipsis = require('text-ellipsis');
var MarkdownIt = require('markdown-it');
const order_1 = require("./api/order");
const paymentrouter_1 = require("../lib/paymentrouter");
class Route extends paymentrouter_1.PaymentRouter {
    constructor() {
        super(...arguments);
        this.orders = [];
    }
    paySessionRoute() {
        return __awaiter(this, void 0, void 0, function* () {
            debugger;
        });
    }
    payRoute() {
        return __awaiter(this, void 0, void 0, function* () {
            let orderids = this.req.body.ordernum.split(',');
            let orderApi = new order_1.default(this.constructorParams);
            let userMessage = "";
            for (let i = 0; i < orderids.length; i++)
                this.orders.push(yield orderApi.getOrder(orderids[i]));
            if (this.pageHasPaymentId) {
                let threedPaymentMade = yield this.created3DPayment();
                if (threedPaymentMade) {
                    //await this.paymentSuccess(threedPaymentMade);
                    userMessage = "Başarılı 3d ödemesi";
                }
                else {
                    userMessage = "Hatalı 3d ödemesi";
                }
            }
            else if (this.req.body.makepayment == "true") {
                let req = yield this.paymentProvider.requestFromOrder(this.orders);
                let paymentResult;
                if (this.threeDPaymentRequested) {
                    try {
                        yield this.init3dPayment(req);
                    }
                    catch (err) {
                        userMessage = err.message || err.errorMessage;
                    }
                }
                else {
                    let creditCard = this.getCreditCard();
                    try {
                        paymentResult = yield this.createPayment(req, creditCard);
                        yield this.paymentSuccess(req, paymentResult);
                        userMessage = "başarılı";
                    }
                    catch (err) {
                        userMessage = err.message || err.errorMessage;
                    }
                }
            }
            yield this.sendView("pages/testcard.ejs", {
                _usrmsg: userMessage ? { text: userMessage } : null
            });
        });
    }
    static SetRoutes(router) {
        router.post("/testcard", Route.BindRequest(Route.prototype.payRoute));
        router.get("/3dpaymentHtml", Route.BindRequest(Route.prototype.threeDRoute));
        router.post("/3dnotify", Route.BindRequest(Route.prototype.threeDNotifyRoute));
        router.post("/pay-session", Route.BindRequest(Route.prototype.paySessionRoute));
        router.get('/testcard', Route.BindToView("pages/testcard.ejs"));
    }
}
__decorate([
    common_1.Auth.Anonymous(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], Route.prototype, "paySessionRoute", null);
__decorate([
    common_1.Auth.Anonymous(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], Route.prototype, "payRoute", null);
exports.default = Route;
