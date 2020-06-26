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
const creditcard_1 = require("./creditcard");
var Iyzipay = require('iyzipay');
class IyziPayment extends creditcard_1.CreditcardPaymentProvider {
    constructor(config) {
        super(config);
        this.iyzipay = new Iyzipay(config);
    }
    createIyzicoPaymentReq(request, card) {
        let req = request;
        req.paymentCard = card;
        return req;
    }
    get providerKey() {
        return IyziPayment.key;
    }
    approveItem(request) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                this.iyzipay.approval.create(request, (err, result) => {
                    this.logOperation("submerchant-approval", request, result).then(() => {
                        if (err)
                            reject(err);
                        else if (result.status == 'failure')
                            reject(result);
                        else
                            resolve(result);
                    }).catch(err => reject(err));
                });
            });
        });
    }
    disApproveItem(request) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                this.iyzipay.disapproval.create(request, (err, result) => {
                    this.logOperation("submerchant-disapproval", request, result).then(() => {
                        if (err)
                            reject(err);
                        else if (result.status == 'failure')
                            reject(result);
                        else
                            resolve(result);
                    }).catch(err => reject(err));
                });
            });
        });
    }
    pay3dInit(request, card) {
        return __awaiter(this, void 0, void 0, function* () {
            let req = this.createIyzicoPaymentReq(request, card);
            return new Promise((resolve, reject) => {
                this.iyzipay.threedsInitialize.create(req, (err, result) => {
                    this.logOperation("creditcard-3d-init", request, result).then(() => {
                        if (err)
                            reject(err);
                        else if (result.status == 'failure')
                            reject(result);
                        else {
                            let buff = new Buffer(result.threeDSHtmlContent, 'base64');
                            result.threeDSHtmlContent = buff.toString('ascii');
                        }
                        resolve(result);
                    }).catch(err => reject(err));
                });
            });
        });
    }
    pay3dHandshakeSuccess(result) {
        return __awaiter(this, void 0, void 0, function* () {
            result = result || {};
            if (result.mdStatus == "1" && result.status == 'success')
                return true;
            else {
                yield this.logOperation("3d-handshake-fail", result, {});
                return false;
            }
        });
    }
    pay3dComplete(request) {
        return __awaiter(this, void 0, void 0, function* () {
            let req = request;
            return new Promise((resolve, reject) => {
                this.iyzipay.threedsPayment.create(req, (err, result) => {
                    this.logOperation("creditcard-3d-complete", request, result).then(() => {
                        if (err)
                            reject(err);
                        else if (result.status == 'failure')
                            reject(result);
                        else
                            return this.savePayment("3d-iyzico", request, result).then(() => resolve(result)).catch(err => reject(err));
                    }).catch(err => reject(err));
                });
            });
        });
    }
    pay(request, card) {
        return __awaiter(this, void 0, void 0, function* () {
            let req = this.createIyzicoPaymentReq(request, card);
            return new Promise((resolve, reject) => {
                this.iyzipay.payment.create(req, (err, result) => {
                    this.logOperation("creditcard-payment-create", request, result).then(() => {
                        if (err)
                            reject(err);
                        else if (result.status == 'failure')
                            reject(result);
                        else
                            return this.savePayment('pos-iyzico', request, result).then(() => resolve(result)).catch(err => reject(err));
                    }).catch(err => reject(err));
                });
            });
        });
    }
    createSubMerchant(request) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                this.iyzipay.subMerchant.create(request, (err, result) => {
                    this.logOperation("submerchant-create", request, result).then(() => {
                        if (err)
                            reject(err);
                        else if (result.status == 'failure')
                            reject(result);
                        else
                            resolve(result);
                    }).catch(err => reject(err));
                });
            });
        });
    }
    static register() {
        creditcard_1.CreditcardPaymentFactory.register(IyziPayment.key, IyziPayment);
    }
}
exports.default = IyziPayment;
IyziPayment.key = "iyzico";

//# sourceMappingURL=iyzico.js.map
