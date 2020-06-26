"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Payment = exports.PaymentTypeDesc = void 0;
exports.PaymentTypeDesc = {
    "onlinepayment": "Online ödeme",
    "cashondoor": "Teslim alırken nakit",
    "creditcardondoor": "Teslim alırken kredi kartı"
};
class Payment {
    constructor() {
        this.type = 'cashondoor';
        this.desc = exports.PaymentTypeDesc["cashondoor"];
    }
}
exports.Payment = Payment;
