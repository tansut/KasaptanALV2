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
exports.PaymentRouter = void 0;
const common_1 = require("./common");
require("reflect-metadata");
let ellipsis = require('text-ellipsis');
const router_1 = require("./router");
const creditcard_1 = require("./payment/creditcard");
const sitelog_1 = require("../routes/api/sitelog");
var MarkdownIt = require('markdown-it');
const payment_1 = require("../db/models/payment");
class PaymentRouter extends router_1.ViewRouter {
    paymentSuccess(request, payment) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.req.body.paymentId) {
                yield payment_1.default.update({
                    status: 'used'
                }, {
                    where: {
                        paymentId: this.req.body.paymentId
                    }
                });
            }
        });
    }
    get pageHasPaymentId() {
        return this.req.body.paymentId;
    }
    get threeDPaymentRequested() {
        return this.req.body['3d'] == "on";
    }
    init3dPayment(req) {
        return __awaiter(this, void 0, void 0, function* () {
            req.callbackUrl = this.url + '/3dnotify?provider=' + this.paymentProvider.providerKey;
            let creditCard = this.getCreditCard();
            let paymentResult;
            try {
                paymentResult = yield this.paymentProvider.pay3dInit(req, creditCard);
                this.req.session.threeDhtml = paymentResult.threeDSHtmlContent;
                yield new Promise((resolve, reject) => {
                    this.req.session.save(err => (err ? reject(err) : resolve()));
                });
                this.threeDhtml = "/3dpaymentHtml";
            }
            catch (err) {
                throw err;
            }
        });
    }
    createPayment(req, card) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.paymentProvider.pay(req, card);
        });
    }
    created3DPayment() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.req.body.paymentId) {
                let payment = yield payment_1.default.findOne({
                    where: {
                        paymentId: this.req.body.paymentId,
                        status: 'unused'
                    }
                });
                return payment ? JSON.parse(payment.response) : null;
            }
            else
                return null;
        });
    }
    threeDRoute() {
        return __awaiter(this, void 0, void 0, function* () {
            this.res.send(this.req.session.threeDhtml);
            this.req.session.threeDhtml = undefined;
        });
    }
    threeDNotifyRoute() {
        return __awaiter(this, void 0, void 0, function* () {
            let result = this.req.body;
            let view = `pages/_partial/paymentprovider/${this.paymentProvider.providerKey}.3dcomplete.ejs`;
            try {
                let shakeResult = yield this.paymentProvider.pay3dHandshakeSuccess(result);
                if (!shakeResult)
                    throw new Error("3d işlemi başarısız");
                let threedResult = yield this.paymentProvider.pay3dComplete(result);
                this.res.render(view, {
                    paymentId: threedResult.paymentId,
                    ordernum: result.merchantPaymentId,
                });
            }
            catch (err) {
                this.res.status(500);
                this.res.render(view, {
                    paymentId: 'NONE',
                    ordernum: result.merchantPaymentId
                });
            }
        });
    }
    getCreditCard() {
        this.req.body.pan = this.req.body.pan || "";
        this.req.body.expiry = this.req.body.expiry || "";
        let expireMonth = "";
        let expireYear = "";
        if (this.req.body.expiry.includes("/")) {
            expireMonth = this.req.body.expiry.split('/')[0];
            expireYear = this.req.body.expiry.split('/')[1];
        }
        else {
            if (this.req.body.expiry.length == 4) {
                expireMonth = this.req.body.expiry.slice(0, 2);
                expireYear = this.req.body.expiry.slice(2, 4);
            }
            else if (this.req.body.expiry.length == 6) {
                expireMonth = this.req.body.expiry.slice(0, 2);
                expireYear = this.req.body.expiry.slice(2, 6);
            }
        }
        if (expireYear.length == 2) {
            expireYear = "20" + expireYear;
        }
        if (expireMonth.length == 1) {
            expireMonth = "0" + expireMonth;
        }
        return {
            cardHolderName: this.req.body.cardOwner,
            cardNumber: this.req.body.pan.replace(/\s+/g, ''),
            cvc: this.req.body.cvv,
            expireMonth: expireMonth.replace(/\s+/g, ''),
            expireYear: expireYear.replace(/\s+/g, '')
        };
    }
    get paymentProvider() {
        if (!this._paymentProvider) {
            let payment = creditcard_1.CreditcardPaymentFactory.getInstance(this.req.query.provider);
            let log = new sitelog_1.default(this.constructorParams);
            payment.logger = log;
            payment.userid = this.req.user ? this.req.user.id : null;
            payment.ip = this.req.header("x-forwarded-for") || this.req.connection.remoteAddress;
            this._paymentProvider = payment;
        }
        return this._paymentProvider;
    }
}
__decorate([
    common_1.Auth.Anonymous(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], PaymentRouter.prototype, "threeDRoute", null);
__decorate([
    common_1.Auth.Anonymous(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], PaymentRouter.prototype, "threeDNotifyRoute", null);
exports.PaymentRouter = PaymentRouter;
