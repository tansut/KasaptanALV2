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
const helper_1 = require("../lib/helper");
let ellipsis = require('text-ellipsis');
var MarkdownIt = require('markdown-it');
const order_1 = require("./api/order");
const accountmodel_1 = require("../db/models/accountmodel");
const account_1 = require("../models/account");
const paymentrouter_1 = require("../lib/paymentrouter");
const email_1 = require("../lib/email");
const order_2 = require("../models/order");
class Route extends paymentrouter_1.PaymentRouter {
    constructor() {
        super(...arguments);
        this.paySession = {};
        this.shouldBePaid = 0.00;
        this.earnedPuanButcher = 0.00;
        this.earnedPuanKalitte = 0.00;
        this.earnedPuanTotal = 0.00;
        this.mayEarnPuanTotal = 0.00;
        this.productTotal = 0.00;
        this.possiblePuanList = [];
    }
    renderPage(userMessage, view) {
        let pageInfo = {};
        if (this.shouldBePaid > 0.00) {
            let pageTitle = '', pageDescription = '';
            if (this.mayEarnPuanTotal > 0.00) {
                pageTitle = `Online ödeyin, ${this.mayEarnPuanTotal} TL değerinde puan kazanın: ${helper_1.default.formatDate(this.order.creationDate)} tarihli ${this.order.butcherName} siparişiniz`;
                pageDescription = `Nefis ürünlerinizi güvenle online ödeyin, puan kazanın, zaman kazanın, sağlığınızı koruyun.`;
            }
            else {
                pageTitle = `Online Ödeyin: ${helper_1.default.formatDate(this.order.creationDate)} tarihli ${this.order.butcherName} siparişiniz`;
                pageDescription = `Nefis ürünlerinizi güvenle online ödeyin, hem zamandan kazanın, hem sağlığınızı koruyun.`;
            }
            pageInfo = {
                pageTitle: pageTitle,
                pageDescription: pageDescription
            };
        }
        else {
        }
        this.sendView(view, Object.assign(Object.assign(Object.assign(Object.assign({}, pageInfo), { _usrmsg: { text: userMessage } }), this.api.getView(this.order)), { enableImgContextMenu: true }));
    }
    getOrderSummary() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.order.workedAccounts.length == 1) {
                let initial = this.api.generateInitialAccounting(this.order);
                yield this.api.saveAccountingOperations([initial]);
                yield this.getOrder();
            }
            this.productTotal = this.api.calculateProduct(this.order);
            this.balance = this.order.workedAccounts.find(p => p.code == 'total');
            this.shouldBePaid = helper_1.default.asCurrency(this.balance.alacak - this.balance.borc);
            this.puanBalanceKalitte = this.order.kalittePuanAccounts.find(p => p.code == 'total');
            this.puanBalanceButcher = this.order.butcherPuanAccounts.find(p => p.code == 'total');
            this.earnedPuanKalitte = this.puanBalanceKalitte ? helper_1.default.asCurrency(this.puanBalanceKalitte.alacak - this.puanBalanceKalitte.borc) : 0.00;
            this.earnedPuanButcher = this.puanBalanceButcher ? helper_1.default.asCurrency(this.puanBalanceButcher.alacak - this.puanBalanceButcher.borc) : 0.00;
            this.earnedPuanTotal = helper_1.default.asCurrency(this.earnedPuanKalitte + this.earnedPuanButcher);
            this.mayEarnPuanTotal = 0.00;
            if (this.shouldBePaid > 0 && this.order.orderSource == order_2.OrderSource.kasaptanal) {
                this.possiblePuanList = this.api.getPossiblePuanGain(this.order, this.productTotal);
                this.possiblePuanList.forEach(pg => this.mayEarnPuanTotal += pg.earned);
                this.mayEarnPuanTotal = helper_1.default.asCurrency(this.mayEarnPuanTotal);
            }
        });
    }
    get hideOrderDetails() {
        if (this.req.user && this.req.user.hasRole('admin'))
            return false;
        // const diffTime = Math.abs(Helper.Now() - new Date(this.order.creationDate));
        // const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
        //if (this.shouldBePaid)
        return true;
    }
    paymentSuccess(request, payment) {
        const _super = Object.create(null, {
            paymentSuccess: { get: () => super.paymentSuccess }
        });
        return __awaiter(this, void 0, void 0, function* () {
            yield this.api.completeCreditcardPayment([this.order], request, payment);
            yield _super.paymentSuccess.call(this, request, payment);
            yield this.getOrder();
            yield this.getOrderSummary();
        });
    }
    getPaymentRequest() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.shouldBePaid <= 0.00)
                throw new Error("Geçersiz ödeme işlemi, siparişin borcu yoktur");
            let debt = {};
            debt[this.order.butcherid] = 0.00;
            if (this.order.orderSource == order_2.OrderSource.kasaptanal) {
                this.api.fillPuanAccounts(this.order, this.productTotal);
                let butcherDebptAccounts = yield accountmodel_1.default.summary([account_1.Account.generateCode("kasaplardan-alacaklar", [this.order.butcherid], true)]);
                let butcherDebt = helper_1.default.asCurrency(butcherDebptAccounts.borc - butcherDebptAccounts.alacak);
                debt[this.order.butcherid] = butcherDebt;
            }
            let request = this.paymentProvider.requestFromOrder([this.order], debt);
            request.callbackUrl = this.url + '/3dnotify?provider=' + this.paymentProvider.providerKey;
            if (this.shouldBePaid != request.paidPrice)
                throw new Error("Geçersiz sipariş ve muhasebesel tutarlar");
            return request;
        });
    }
    payOrderRoute() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.getOrder();
            if (!this.order)
                return this.next();
            yield this.getOrderSummary();
            let userMessage = "";
            let req = null;
            try {
                if (this.pageHasPaymentId) {
                    req = yield this.getPaymentRequest();
                    let threedPaymentMade = yield this.created3DPayment();
                    if (threedPaymentMade) {
                        yield this.paymentSuccess(req, threedPaymentMade);
                        userMessage = "Ödemeniz başarıyla alındı";
                    }
                    else {
                        throw new Error("Ödeme işlemi başarısız");
                    }
                }
                else if (this.req.body.makepayment == "true") {
                    req = yield this.getPaymentRequest();
                    if (this.req.body.secureship == 'on') {
                        this.order.noInteraction = true;
                        yield this.order.save();
                    }
                    else {
                        this.order.noInteraction = false;
                        yield this.order.save();
                    }
                    let paymentResult;
                    if (this.threeDPaymentRequested) {
                        yield this.init3dPayment(req);
                    }
                    else {
                        let creditCard = this.getCreditCard();
                        paymentResult = yield this.createPayment(req, creditCard);
                        yield this.paymentSuccess(req, paymentResult);
                        userMessage = "Ödemenizi başarıyla aldık";
                    }
                }
            }
            catch (err) {
                userMessage = err.message || err.errorMessage;
                this.paySession = yield this.paymentProvider.paySession(req);
                email_1.default.send('tansut@gmail.com', 'hata/payment: kasaptanAl.com', "error.ejs", {
                    text: JSON.stringify(err || {}) + '/' + userMessage + ' ' + this.order.ordernum,
                    stack: err.stack
                });
            }
            this.renderPage(userMessage, "pages/payorder.ejs");
        });
    }
    getOrder() {
        return __awaiter(this, void 0, void 0, function* () {
            let ordernum = this.req.params.ordernum;
            this.api = new order_1.default(this.constructorParams);
            this.order = yield this.api.getOrder(ordernum, true);
        });
    }
    payOrderViewRoute() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.getOrder();
            if (!this.order)
                return this.next();
            yield this.getOrderSummary();
            if (this.shouldBePaid > 0) {
                let payRequest = yield this.getPaymentRequest();
                this.paySession = yield this.paymentProvider.paySession(payRequest);
            }
            this.renderPage(null, "pages/payorder.ejs");
        });
    }
    static SetRoutes(router) {
        router.get('/pay/:ordernum', Route.BindRequest(Route.prototype.payOrderViewRoute));
        router.post('/pay/:ordernum', Route.BindRequest(Route.prototype.payOrderRoute));
    }
}
__decorate([
    common_1.Auth.Anonymous(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], Route.prototype, "payOrderRoute", null);
__decorate([
    common_1.Auth.Anonymous(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], Route.prototype, "payOrderViewRoute", null);
exports.default = Route;
