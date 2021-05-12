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
const common_1 = require("../../lib/common");
const router_1 = require("../../lib/router");
const order_1 = require("../../db/models/order");
const area_1 = require("../../db/models/area");
const email_1 = require("../../lib/email");
const shipment_1 = require("../../models/shipment");
const dispatcher_1 = require("../../db/models/dispatcher");
const payment_1 = require("../../models/payment");
const butcher_1 = require("../../db/models/butcher");
const accountmodel_1 = require("../../db/models/accountmodel");
const product_1 = require("../../db/models/product");
const order_2 = require("../api/order");
const sitelog_1 = require("../api/sitelog");
const context_1 = require("../../db/context");
const sms_1 = require("../../lib/sms");
const account_1 = require("../../models/account");
const helper_1 = require("../../lib/helper");
const order_3 = require("../../models/order");
const commissionHelper_1 = require("../../lib/commissionHelper");
const sequelize_1 = require("sequelize");
const core_1 = require("../../lib/logistic/core");
const user_1 = require("../../db/models/user");
const moment = require("moment");
const http_1 = require("../../lib/http");
const review_1 = require("../../db/models/review");
const orderid = require('order-id')('dkfjsdklfjsdlkg450435034.,');
class Route extends router_1.ApiRouter {
    getButcherPuanAccounts(o) {
        return __awaiter(this, void 0, void 0, function* () {
            let list = [
                account_1.Account.generateCode("musteri-kasap-kazanilan-puan", [o.userId, o.butcherid, o.ordernum])
            ];
            let accounts = yield accountmodel_1.default.list(list);
            return accounts;
        });
    }
    getButcherPuanAccountsSummary(o) {
        return __awaiter(this, void 0, void 0, function* () {
            let list = [
                account_1.Account.generateCode("musteri-kasap-kazanilan-puan", [o.userId, o.butcherid, o.ordernum])
            ];
            let accounts = yield accountmodel_1.default.summary(list);
            return accounts;
        });
    }
    fillButcherDebtAccounts(o) {
        return __awaiter(this, void 0, void 0, function* () {
            let list = [
                account_1.Account.generateCode("kasaplardan-alacaklar", [o.butcherid, 1, o.ordernum]),
                account_1.Account.generateCode("kasaplardan-alacaklar", [o.butcherid, 2, o.ordernum]),
                account_1.Account.generateCode("kasap-borc-tahakkuk", [1, o.butcherid, o.ordernum])
            ];
            let accounts = yield accountmodel_1.default.list(list);
            o.butcherDeptAccounts = accounts;
            return accounts;
        });
    }
    fillButcherComissionAccounts(o) {
        return __awaiter(this, void 0, void 0, function* () {
            let list = [
                account_1.Account.generateCode("kasaplardan-kesilen-komisyonlar", [100, o.butcherid, o.ordernum]),
                account_1.Account.generateCode("kasaplardan-kesilen-komisyonlar", [200, o.butcherid, o.ordernum])
            ];
            let accounts = yield accountmodel_1.default.list(list);
            o.butcherComissiomAccounts = accounts;
            return accounts;
        });
    }
    getKalittePuanAccounts(o) {
        return __awaiter(this, void 0, void 0, function* () {
            let list = [
                account_1.Account.generateCode("musteri-kalitte-kazanilan-puan", [o.userId, 1, o.ordernum]),
                account_1.Account.generateCode("musteri-kalitte-kazanilan-puan", [o.userId, 2, o.ordernum])
            ];
            let accounts = yield accountmodel_1.default.list(list);
            return accounts;
        });
    }
    getKalittePuanAccountsSummary(o) {
        return __awaiter(this, void 0, void 0, function* () {
            let list = [
                account_1.Account.generateCode("musteri-kalitte-kazanilan-puan", [o.userId, 1, o.ordernum]),
                account_1.Account.generateCode("musteri-kalitte-kazanilan-puan", [o.userId, 2, o.ordernum])
            ];
            let accounts = yield accountmodel_1.default.summary(list);
            return accounts;
        });
    }
    getWorkingAccounts(o) {
        return __awaiter(this, void 0, void 0, function* () {
            let list = [
                account_1.Account.generateCode("odeme-bekleyen-satislar", [o.userId, o.ordernum]),
                account_1.Account.generateCode("satis-indirimleri", [o.userId, o.ordernum])
            ];
            let accounts = yield accountmodel_1.default.list(list);
            return accounts;
        });
    }
    getAllAccounts(o) {
        return __awaiter(this, void 0, void 0, function* () {
            let list = [
                account_1.Account.generateCode("odeme-bekleyen-satislar", [o.userId, o.ordernum]),
                account_1.Account.generateCode("satis-indirimleri", [o.userId, o.ordernum])
            ];
            let accounts = yield accountmodel_1.default.listByOperations([o.ordernum]);
            return accounts;
        });
    }
    getAccountsSummary(o) {
        return __awaiter(this, void 0, void 0, function* () {
            let list = [
                account_1.Account.generateCode("odeme-bekleyen-satislar", [o.userId, o.ordernum]),
                account_1.Account.generateCode("satis-indirimleri", [o.userId, o.ordernum])
            ];
            let accounts = yield accountmodel_1.default.summary(list);
            return accounts;
        });
    }
    calculatePaid(o) {
        let codeCredit = account_1.Account.generateCode("odeme-bekleyen-satislar", [o.userId, o.ordernum, 500]);
        let codeManual = account_1.Account.generateCode("odeme-bekleyen-satislar", [o.userId, o.ordernum, 600]);
        let codePuan = account_1.Account.generateCode("odeme-bekleyen-satislar", [o.userId, o.ordernum, 1100]);
        let total = 0.00;
        o.workedAccounts.forEach(a => {
            if (a.code == codeCredit || a.code == codeManual || a.code == codePuan)
                total += a.borc;
        });
        return helper_1.default.asCurrency(total);
    }
    calculateTeslimatOfButcher(o) {
        let codeButcher = account_1.Account.generateCode("odeme-bekleyen-satislar", [o.userId, o.ordernum, 200]);
        let total = 0.00;
        o.workedAccounts.forEach(a => {
            if (a.code == codeButcher)
                total += a.alacak;
        });
        return helper_1.default.asCurrency(total);
    }
    calculateTeslimatOfKasaptanAl(o) {
        let codeKasaptanAl = account_1.Account.generateCode("odeme-bekleyen-satislar", [o.userId, o.ordernum, 201]);
        let total = 0.00;
        o.workedAccounts.forEach(a => {
            if (a.code == codeKasaptanAl)
                total += a.alacak;
        });
        return helper_1.default.asCurrency(total);
    }
    calculateTeslimatTotal(o) {
        let codeButcher = account_1.Account.generateCode("odeme-bekleyen-satislar", [o.userId, o.ordernum, 200]);
        let codeKasaptanAl = account_1.Account.generateCode("odeme-bekleyen-satislar", [o.userId, o.ordernum, 201]);
        let total = 0.00;
        o.workedAccounts.forEach(a => {
            if (a.code == codeButcher || a.code == codeKasaptanAl)
                total += a.alacak;
        });
        return helper_1.default.asCurrency(total);
    }
    calculateProduct(o) {
        let code = account_1.Account.generateCode("odeme-bekleyen-satislar", [o.userId, o.ordernum, 100]);
        let total = 0.00;
        o.workedAccounts.forEach(a => {
            if (a.code == code)
                total += a.alacak;
        });
        return helper_1.default.asCurrency(total);
    }
    calculateUsedPuan(o) {
        let code = account_1.Account.generateCode("odeme-bekleyen-satislar", [o.userId, o.ordernum, 1100]);
        let total = 0.00;
        o.workedAccounts.forEach(a => {
            if (a.code == code)
                total += a.borc;
        });
        return helper_1.default.asCurrency(total);
    }
    getOrders(where) {
        return __awaiter(this, void 0, void 0, function* () {
            let res = yield order_1.Order.findAll({
                where: where,
                order: [['ID', 'DESC']],
                limit: 500,
                include: [{
                        model: butcher_1.default
                    }, {
                        model: order_1.OrderItem,
                        include: [{
                                model: butcher_1.default,
                                all: true
                            }, {
                                model: product_1.default,
                                all: true
                            }]
                    }]
            });
            return res;
        });
    }
    arrangeKalittePuans(o) {
        o.kalitteOnlyPuanAccounts = [];
        o.kalitteByButcherPuanAccounts = [];
        let kalitteCode = account_1.Account.generateCode("musteri-kalitte-kazanilan-puan", [o.userId, 1, o.ordernum]);
        let kalitteByButcherCode = account_1.Account.generateCode("musteri-kalitte-kazanilan-puan", [o.userId, 2, o.ordernum]);
        o.kalittePuanAccounts.forEach(a => {
            if (a.code == kalitteCode) {
                o.kalitteOnlyPuanAccounts.push(a);
            }
            else if (a.code == kalitteByButcherCode) {
                o.kalitteByButcherPuanAccounts.push(a);
            }
        });
        accountmodel_1.default.addTotals(o.kalitteOnlyPuanAccounts);
        accountmodel_1.default.addTotals(o.kalitteByButcherPuanAccounts);
    }
    getOrder(num, checkFirst = false) {
        return __awaiter(this, void 0, void 0, function* () {
            let order = yield order_1.Order.findOne({
                where: {
                    ordernum: num
                },
                include: [{
                        model: butcher_1.default
                    }, {
                        model: order_1.OrderItem,
                        include: [{
                                model: butcher_1.default,
                                all: true
                            }, {
                                model: product_1.default,
                                all: true
                            }]
                    }, {
                        model: dispatcher_1.default,
                        all: true
                    }]
            });
            if (!order)
                return null;
            order.allAccounts = yield this.getAllAccounts(order);
            order.workedAccounts = yield this.getWorkingAccounts(order);
            order.butcherPuanAccounts = yield this.getButcherPuanAccounts(order);
            order.kalittePuanAccounts = yield this.getKalittePuanAccounts(order);
            this.arrangeKalittePuans(order);
            if (checkFirst) {
                order.isFirstButcherOrder = (yield order_1.Order.findOne({ where: { userid: order.userId, butcherid: order.butcherid, status: order_3.OrderItemStatus.success, ordernum: { [sequelize_1.Op.ne]: order.ordernum } } })) == null;
                order.isFirstOrder = (yield order_1.Order.findOne({ where: { userid: order.userId } })) == null;
            }
            return order;
        });
    }
    completeOrderStatus(o, newStatus) {
        return __awaiter(this, void 0, void 0, function* () {
            let res = context_1.default.getContext().transaction((t) => {
                return this.changeOrderStatus(o, newStatus, t);
            });
            yield res;
        });
    }
    changeOrderStatus(o, newStatus, t) {
        return __awaiter(this, void 0, void 0, function* () {
            let promises = [], ops = [];
            // if (o.status != newStatus) {
            //     if (newStatus.startsWith('iptal') && o.status.startsWith('iptal')) {
            //     } else {
            //         if (newStatus.startsWith('iptal')) {
            //             let summary = await this.getAccountsSummary(o);
            //             let balance = Helper.asCurrency(summary.alacak - summary.borc);
            //             if (balance > 0.00) {
            //                 let op = new AccountingOperation(`${o.ordernum} iptali`);
            //                 op.accounts.push(new Account("odeme-bekleyen-satislar", [o.userId, o.ordernum]).dec(balance))
            //                 op.accounts.push(new Account("satis-alacaklari", [o.userId, o.ordernum]).dec(balance))
            //                 ops.push(op);
            //             }
            //             o.items.forEach(oi => {
            //                 if (!oi.status.startsWith('iptal')) {
            //                     oi.status = newStatus;
            //                     promises.push(oi.save({ transaction: t }))
            //                 }
            //             })
            //         } else if (o.status.startsWith('iptal')) {
            //         } else {
            //             o.items.forEach(oi => {
            //                 if (!oi.status.startsWith('iptal')) {
            //                     oi.status = newStatus;
            //                     promises.push(oi.save({ transaction: t }))
            //                 }
            //             })
            //         }
            //     }
            //await this.saveAccountingOperations(ops, t)
            o.status = newStatus;
            yield o.save({ transaction: t });
            //}
        });
    }
    lastOrders(userId, limit = 8) {
        return __awaiter(this, void 0, void 0, function* () {
            return order_1.Order.findAll({
                where: {
                    userId: userId
                },
                include: [{
                        model: butcher_1.default
                    }],
                limit: limit,
                order: [['id', 'desc']]
            });
        });
    }
    completeOrderItemStatus(oi, newStatus) {
        return __awaiter(this, void 0, void 0, function* () {
            let res = context_1.default.getContext().transaction((t) => {
                return this.changeOrderItemStatus(oi, newStatus, t);
            });
            yield res;
        });
    }
    changeOrderItemStatus(oi, newStatus, t) {
        let promises = [], ops = [];
        if (oi.status != newStatus) {
            if (newStatus.startsWith('iptal') && oi.status.startsWith('iptal')) {
            }
            else {
                if (newStatus.startsWith('iptal')) {
                    let op = new account_1.AccountingOperation(`${oi.productName} ${newStatus}`);
                    op.accounts.push(new account_1.Account("odeme-bekleyen-satislar", [oi.order.userId, oi.order.ordernum]).dec(oi.price));
                    op.accounts.push(new account_1.Account("satis-alacaklari", [oi.order.userId, oi.order.ordernum]).dec(oi.price));
                    ops.push(op);
                }
                else if (oi.status.startsWith('iptal')) {
                    let op = new account_1.AccountingOperation(`${oi.productName} iptalin iptali`);
                    op.accounts.push(new account_1.Account("odeme-bekleyen-satislar", [oi.order.userId, oi.order.ordernum]).inc(oi.price));
                    op.accounts.push(new account_1.Account("satis-alacaklari", [oi.order.userId, oi.order.ordernum]).inc(oi.price));
                    ops.push(op);
                }
            }
            promises.push(this.saveAccountingOperations(ops, t));
            oi.status = newStatus;
            promises.push(oi.save({ transaction: t }));
        }
        return Promise.all(promises);
    }
    getView(order) {
        let shipment = {};
        let payment = {};
        let butchers = {};
        order.items.forEach((item, i) => {
            let bi = item.butcher.id;
            let prodMan = common_1.ProductTypeFactory.create(item.productType, {});
            prodMan.loadFromOrderItem(item);
            if (!butchers[bi]) {
                butchers[bi] = item.butcher;
                butchers[bi].products = [i];
                butchers[bi].subTotal = item.butcherSubTotal;
                butchers[bi].total = item.butcherTotal;
                butchers[bi].discountTotal = item.discountTotal;
                butchers[bi].shippingTotal = item.shippingTotal;
            }
            else {
                butchers[bi].products.push(i);
            }
            if (!shipment[bi])
                shipment[bi] = Object.assign(new shipment_1.Shipment(), {
                    howTo: item.shipmentHowTo,
                    securityCode: order.securityCode,
                    type: item.shipmentType,
                    days: [item.shipmentdate ? item.shipmentdate.toDateString() : ''],
                    hours: [item.shipmenthour],
                    informMe: item.shipmentInformMe,
                    daysText: [[item.shipmentdate ? item.shipmentdate.toDateString() : '']],
                    hoursText: [item.shipmenthourText],
                });
            // if (item.dispatcherid) {
            //     shipment[bi].dispatcher = Object.assign(new Dispatcher(), {
            //         id: item.dispatcherid,
            //         type: item.dispatcherType,
            //         name: item.dispatcherName,
            //         fee: item.dispatcherFee,
            //         totalForFree: item.dispatchertotalForFree
            //     })
            // }
            if (!payment[bi])
                payment[bi] = Object.assign(new payment_1.Payment(), {
                    type: item.paymentType,
                    desc: item.paymentTypeText
                });
        });
        return {
            order: order,
            butchers: butchers,
            shipment: shipment,
            payment: payment,
            items: order.items
        };
    }
    createOrder(t, order, card) {
        return order.save({
            transaction: t
        }).then((order) => {
            let promises = [];
            let butcher = card.butchers[order.butcherid];
            butcher.products.forEach((pi, i) => {
                let item = card.items[pi];
                let oi = order_1.OrderItem.fromShopcardItem(card, item);
                oi.orderid = order.id;
                promises.push(oi.save({
                    transaction: t
                }));
            });
            if (card.address.saveaddress) {
                this.req.user.lastAddress = card.address.adres;
                this.req.user.lastKat = card.address.kat;
                this.req.user.lastBina = card.address.bina;
                this.req.user.lastDaire = card.address.daire;
                this.req.user.lastLocation = card.address.geolocation;
                this.req.user.lastLocationType = card.address.geolocationType;
                this.req.user.lastTarif = card.address.addresstarif;
                promises.push(this.req.user.save());
            }
            return Promise.all(promises);
        }).then((orderItems) => {
            let promises = [];
            orderItems.forEach(oi => {
                if (oi.dispatcherid) {
                    promises.push(dispatcher_1.default.update({
                        lastorderitemid: oi.id
                    }, {
                        transaction: t,
                        where: {
                            id: oi.dispatcherid
                        }
                    }));
                }
            });
            return Promise.all(promises);
        });
    }
    getPreAccountingOperations(ol, paymentInfo) {
        return __awaiter(this, void 0, void 0, function* () {
            let result = [];
            if (paymentInfo) {
                let remaining = paymentInfo.paid;
                for (let i = 0; i < ol.length; i++) {
                    let o = ol[i];
                    let total = helper_1.default.asCurrency(o.total);
                    remaining = helper_1.default.asCurrency(remaining - total);
                    if (remaining >= 0.00) {
                        let op = new account_1.AccountingOperation(`${o.name} ${o.ordernum} siparişi ön provizyon ödeme işlemi`);
                        op.accounts.push(new account_1.Account("kredi-karti-provizyon", [o.userId, o.ordernum, paymentInfo.paymentId]).inc(total));
                        op.accounts.push(new account_1.Account("havuz-hesabi", [o.userId, o.ordernum, paymentInfo.paymentId]).inc(total));
                        op.validate();
                        result.push(op);
                    }
                }
            }
            return result;
        });
    }
    saveAccountingOperations(ops, t) {
        return __awaiter(this, void 0, void 0, function* () {
            let result = [];
            if (t) {
                for (var i = 0; i < ops.length; i++) {
                    ops[i].validate();
                    result.push(accountmodel_1.default.saveOperation(ops[i], {
                        transaction: t
                    }));
                }
                return Promise.all(result);
            }
            else {
                let res = context_1.default.getContext().transaction((t) => {
                    for (var i = 0; i < ops.length; i++) {
                        ops[i].validate();
                        result.push(accountmodel_1.default.saveOperation(ops[i], {
                            transaction: t
                        }));
                    }
                    return Promise.all(result);
                });
                yield res;
            }
        });
    }
    updateOrderByCreditcardPayment(o, paymentInfo, t) {
        return __awaiter(this, void 0, void 0, function* () {
            let promises = [];
            o.paymentId = paymentInfo.paymentId;
            o.paymentType = "onlinepayment";
            o.status = order_3.OrderItemStatus.supplying;
            o.paymentTypeText = payment_1.PaymentTypeDesc.onlinepayment;
            promises.push(o.save({
                transaction: t
            }));
            paymentInfo.itemTransactions.forEach(it => {
                if (it.itemId == o.ordernum) {
                    o.paymentTransactionId = it.paymentTransactionId;
                    o.paidTotal = it.paidPrice;
                    promises.push(o.save({ transaction: t }));
                }
            });
            return o.isNewRecord ? null : Promise.all(promises);
        });
    }
    completeCreditcardPayment(ol, paymentRequest, paymentInfo) {
        return __awaiter(this, void 0, void 0, function* () {
            let res = context_1.default.getContext().transaction((t) => {
                return this.makeCreditcardPayment(ol, paymentRequest, paymentInfo, t);
            });
            yield new Promise((resolve, reject) => {
                res.then((result) => {
                    resolve(result);
                }).catch((err) => {
                    reject(err);
                });
            });
        });
    }
    fillFirstOrderDetails(o) {
        return __awaiter(this, void 0, void 0, function* () {
            o.isFirstButcherOrder = (yield order_1.Order.findOne({ where: { userid: o.userId, butcherid: o.butcherid, status: order_3.OrderItemStatus.success, ordernum: { [sequelize_1.Op.ne]: o.ordernum } } })) == null;
            o.isFirstOrder = (yield order_1.Order.findOne({ where: { userid: o.userId } })) == null;
        });
    }
    getUsablePuans(o) {
        return __awaiter(this, void 0, void 0, function* () {
            o.workedAccounts = o.workedAccounts.length == 0 ? this.generateInitialAccounting(o).accounts.map(a => accountmodel_1.default.fromAccount(a)) : o.workedAccounts;
            let user = (this.req.user && this.req.user.id == o.userId) ? this.req.user : null;
            if (!user) {
                user = yield user_1.default.findByPk(o.userId);
                if (user)
                    yield user.loadPuanView();
            }
            if (user && user.usablePuans > 0 && o.butcher.enablePuan) {
                let butcherShip = this.calculateTeslimatOfButcher(o);
                let kasaptanAlShip = this.calculateTeslimatOfKasaptanAl(o);
                let productPrice = this.calculateProduct(o);
                let puanAccounts = this.getEarnedPuanAccounts(o, productPrice);
                this.fillEarnedPuanAccounts(o, productPrice);
                let rate = o.getButcherRate("butcher");
                let fee = o.getButcherFee("butcher");
                let calc = new commissionHelper_1.ComissionHelper(rate, fee, o.butcher.vatRate);
                let totalFee = calc.calculateButcherComission(productPrice + butcherShip);
                let max = helper_1.default.asCurrency(totalFee.kalitteFee * 0.80);
                return Math.min(user.usablePuans, max);
            }
            return 0.00;
        });
    }
    getPossiblePuanGain(o, total, includeAvailable = false) {
        let calculator = new commissionHelper_1.PuanCalculator();
        let result = [];
        // let firstOrder: Puan = {
        //     minPuanForUsage: 0.00,
        //     minSales: 0.00,
        //     name: 'ilk sipariş indirimi',
        //     rate: 0.00
        // }
        let kalittePuan = null;
        //         let kalittePuan: Puan = {
        //         platforms: 'app',
        //     minPuanForUsage: 0.00,
        //     minSales: 250.00,
        //     name: `KasaptanAl Mobil Uygulaması Puan Kazancı`,
        //     fixed: 10.00
        // }
        if (o.butcher.enableCreditCard) {
            if (o.isFirstButcherOrder && o.orderType != 'kurban') {
                //let firstOrderPuan = calculator.calculateCustomerPuan(firstOrder, total);
                // if (firstOrderPuan > 0.00 || includeAvailable) {
                //     result.push({
                //         type: "kalitte-by-butcher",
                //         earned: firstOrderPuan,
                //         id: o.butcherid.toString(),
                //         title: `Kasap Kart™ programı ilk sipariş puanı`,
                //         desc: `${o.ordernum} nolu ${o.butcherName} siparişi KasaptanAl.com Puan`,
                //         based: firstOrder
                //     })
                // }
            }
            if (o.butcher.enablePuan) {
                let butcherPuan = o.butcher.getPuanData(o.orderType);
                let earnedPuanb = calculator.calculateCustomerPuan(butcherPuan, total, this.platform);
                let earnedPuanByKalitte = kalittePuan ? calculator.calculateCustomerPuan(kalittePuan, total, this.platform) : 0.00;
                if ((earnedPuanByKalitte > 0.00 || includeAvailable) && kalittePuan) {
                    result.push({
                        type: "kalitte",
                        earned: earnedPuanByKalitte,
                        id: o.butcherid.toString(),
                        title: kalittePuan.name,
                        desc: `${o.ordernum} nolu ${o.butcherName} sipariş Kasap Puan`,
                        based: kalittePuan
                    });
                }
                if (earnedPuanb > 0.00 || includeAvailable) {
                    if (earnedPuanb == 0) {
                        result.push({
                            type: "butcher",
                            earned: earnedPuanb,
                            id: o.butcherid.toString(),
                            title: o.butcher.name + ' Kasap Kart™ programı',
                            desc: `${o.ordernum} nolu ${o.butcherName} sipariş Kasap Puan`,
                            based: butcherPuan
                        });
                    }
                    else {
                        let toKalitteRatio = o.orderType == order_3.OrderType.kurban ? 1 : 0.0;
                        let toKalitte = helper_1.default.asCurrency(earnedPuanb * toKalitteRatio);
                        let toButcher = helper_1.default.asCurrency(earnedPuanb - toKalitte);
                        if (toButcher > 0.00) {
                            result.push({
                                type: "butcher",
                                earned: toButcher,
                                id: o.butcherid.toString(),
                                title: o.butcher.name + ' Kasap Kart™ programı',
                                desc: `${o.ordernum} nolu ${o.butcherName} sipariş Kasap Puan`,
                                based: butcherPuan
                            });
                        }
                        if (toKalitte > 0.00) {
                            result.push({
                                type: "kalitte-by-butcher",
                                earned: toKalitte,
                                id: o.butcherid.toString(),
                                title: `kasaptanAl.com Kasap Kart™ programı`,
                                desc: `${o.ordernum} nolu ${o.butcherName} sipariş kasaptanAl.com Puan`,
                                based: butcherPuan
                            });
                        }
                    }
                }
            }
        }
        // if (o.isFirstOrder) {
        //     let earnedPuan = calculator.calculateCustomerPuan({
        //         minPuanForUsage: 0.00,
        //         minSales: 0.00,
        //         name:'kalitte ilk sipariş',
        //         rate: 0.01
        //     }, total);
        //     if (earnedPuan > 0.00) {
        //         result.push(
        //             {
        //                 type:"kalitte",
        //                 desc: `${o.ordernum} kasaptanAl.com ilk sipariş kazanılan puan bedeli `,
        //                 earned: earnedPuan,
        //                 id: 'kasaptanAl.com',
        //                 title: 'kasaptanAl.com ilk sipariş hediye puanı'
        //             }
        //         )                
        //     }
        // } 
        return result;
    }
    getComissionAccounts(o, total, kasaptanAlShip, usablePuan) {
        let result = new account_1.AccountingOperation(`${o.ordernum} nolu ${o.butcherName} kasap komisyon hesabı`, o.ordernum);
        let butcherFee = o.getButcherComission(total, usablePuan);
        let earnedPuan = o.getPuanTotal();
        if (butcherFee)
            result.accounts.push(new account_1.Account("kasaplardan-kesilen-komisyonlar", [100, o.butcherid, o.ordernum], `${o.ordernum} nolu satış kasaptanal.com komisyonu`).inc(butcherFee));
        if (earnedPuan > 0.00) {
            result.accounts.push(new account_1.Account("kasaplardan-kesilen-komisyonlar", [200, o.butcherid, o.ordernum], `${o.ordernum} nolu müşteriye iletilen puan`).inc(earnedPuan));
        }
        if (kasaptanAlShip > 0.00) {
            result.accounts.push(new account_1.Account("banka", [300, o.ordernum], `${o.ordernum} nolu satış kasaptanal.com müşteriden alınan teslimat bedeli`).inc(kasaptanAlShip));
        }
        let income = butcherFee + earnedPuan + kasaptanAlShip;
        if (income)
            result.accounts.push(new account_1.Account("gelirler", [100, o.butcherid], `${o.ordernum} nolu ${o.butcherName} satış işlemi`).inc(income));
        return result;
    }
    // getKasaptanAlShipAccounts(o: Order, total: number): AccountingOperation {
    //     let result: AccountingOperation = new AccountingOperation(`${o.ordernum} nolu tahsil edilen teslimat bedeli`);        
    //     result.accounts.push(new Account("banka", [300, o.ordernum], `${o.ordernum} nolu satış kasaptanal.com müşteriden alınan teslimat bedeli`).inc(butcherFee))
    //     result.accounts.push(new Account("gelirler", [100, o.ordernum], `${o.ordernum} nolu ${o.butcherName} satış geliri`).inc(butcherFee + puanTotal))
    //     return result;
    // }    
    getEarnedPuanAccounts(o, total) {
        let gains = this.getPossiblePuanGain(o, total);
        let result = new account_1.AccountingOperation(`${o.ordernum} nolu ${o.butcherName} siparişi puan kazancı`, o.ordernum);
        gains.forEach(pg => {
            if (pg.earned > 0.00) {
                if (pg.type == "butcher") {
                    result.accounts.push(new account_1.Account("kasap-puan-giderleri", [o.butcherid, o.userId, o.ordernum], pg.title).inc(pg.earned));
                    result.accounts.push(new account_1.Account("musteri-kasap-kazanilan-puan", [o.userId, o.butcherid, o.ordernum], pg.title).inc(pg.earned));
                }
                if (pg.type == "kalitte") {
                    result.accounts.push(new account_1.Account("kalitte-puan-giderleri", [o.userId, 1, o.ordernum], pg.title).inc(pg.earned));
                    result.accounts.push(new account_1.Account("musteri-kalitte-kazanilan-puan", [o.userId, 1, o.ordernum], pg.title).inc(pg.earned));
                }
                if (pg.type == "kalitte-by-butcher") {
                    result.accounts.push(new account_1.Account("kalitte-puan-giderleri", [o.userId, 2, o.ordernum], pg.title).inc(pg.earned));
                    result.accounts.push(new account_1.Account("musteri-kalitte-kazanilan-puan", [o.userId, 2, o.ordernum], pg.title).inc(pg.earned));
                }
            }
        });
        return result;
    }
    fillEarnedPuanAccounts(o, paidPrice) {
        o.butcherPuanAccounts = [];
        o.kalittePuanAccounts = [];
        o.kalitteOnlyPuanAccounts = [];
        o.kalitteByButcherPuanAccounts = [];
        let accounts = this.getEarnedPuanAccounts(o, paidPrice).accounts;
        let butcherCode = account_1.Account.generateCode("musteri-kasap-kazanilan-puan", [o.userId, o.butcherid, o.ordernum]);
        let kalitteCode = account_1.Account.generateCode("musteri-kalitte-kazanilan-puan", [o.userId, 1, o.ordernum]);
        let kalitteByButcherCode = account_1.Account.generateCode("musteri-kalitte-kazanilan-puan", [o.userId, 2, o.ordernum]);
        accounts.forEach(a => {
            let acc = accountmodel_1.default.fromAccount(a);
            if (a.code == butcherCode) {
                o.butcherPuanAccounts.push(acc);
            }
            else if (a.code == kalitteCode) {
                o.kalittePuanAccounts.push(acc);
            }
            else if (a.code == kalitteByButcherCode) {
                o.kalittePuanAccounts.push(acc);
            }
        });
        this.arrangeKalittePuans(o);
        accountmodel_1.default.addTotals(o.butcherPuanAccounts);
        accountmodel_1.default.addTotals(o.kalittePuanAccounts);
    }
    getUsedPuanAccounts(o, puan) {
        let result = new account_1.AccountingOperation(`${o.ordernum} nolu ${o.butcherName} siparişi puan kullanımı`, o.ordernum);
        if (puan > 0) {
            let acc1 = new account_1.Account("musteri-harcanan-puan", [o.userId, o.ordernum]).inc(puan);
            let acc2 = new account_1.Account("kullanilan-puanlar", [o.userId], `${o.ordernum} nolu sipariş puan kullanımı`).inc(puan);
            result.accounts.push(acc1);
            result.accounts.push(acc2);
        }
        result.validate();
        return result;
    }
    getEarnedPuans(o) {
        return __awaiter(this, void 0, void 0, function* () {
            let puans = yield accountmodel_1.default.summary([
                account_1.Account.generateCode("musteri-kalitte-kazanilan-puan", [o.userId, 1, o.ordernum]),
                account_1.Account.generateCode("musteri-kalitte-kazanilan-puan", [o.userId, 2, o.ordernum]),
                account_1.Account.generateCode("musteri-kasap-kazanilan-puan", [o.userId, o.butcherid, o.ordernum])
            ]);
            return puans;
        });
    }
    completeManuelPayment(o, total) {
        return __awaiter(this, void 0, void 0, function* () {
            // let res = db.getContext().transaction((t: Transaction) => {
            //     return this.makeManuelPayment(o, total, t)
            // })
            // await new Promise((resolve, reject) => {
            //     res.then((result) => {
            //         resolve(result)
            //     }).catch((err) => {
            //         reject(err);
            //     })
            // })
            yield this.makeManuelPayment(o, total);
        });
    }
    // async loadPuan(o: Order, total: number, t?: Transaction): Promise<any> {
    //     let ops: AccountingOperation[] = [];
    //     let promises: Promise<any>[] = [];
    //     let puanAccounts = this.getPuanAccounts(o, total);
    //     ops.push(puanAccounts);
    //     promises = promises.concat(this.saveAccountingOperations(ops, t));
    //     return Promise.all(promises)
    // }
    // async completeLoadPuan(o: Order, total: number) {
    //     let res = db.getContext().transaction((t: Transaction) => {
    //         return this.loadPuan(o, total, t)
    //     })
    //     await new Promise((resolve, reject) => {
    //         res.then((result) => {
    //             resolve(result)
    //         }).catch((err) => {
    //             reject(err);
    //         })
    //     })
    // }
    updateButcherDebtAfterPayment(o, paymentRequest, paymentInfo, t) {
        return __awaiter(this, void 0, void 0, function* () {
            let promises = [];
            for (let i = 0; i < paymentInfo.itemTransactions.length; i++) {
                let it = paymentInfo.itemTransactions[i];
                if (it.itemId == o.ordernum) {
                    let req = paymentRequest.basketItems.find(pr => pr.id == o.ordernum);
                    if (req.merchantDebtApplied) {
                        let result = new account_1.AccountingOperation(`${o.ordernum} nolu ${o.butcherName} siparişi düşülen borç`, o.ordernum);
                        result.accounts.push(new account_1.Account("kasaplardan-alacaklar", [o.butcherid, 5], `${o.ordernum} nolu sipariş düşülen tutar`).dec(req.merchantDebtApplied));
                        result.accounts.push(new account_1.Account("kasap-borc-tahakkuk", [1, o.butcherid, o.ordernum], `${o.ordernum} nolu siparişten düşülen ödemesi`).dec(req.merchantDebtApplied));
                        promises = promises.concat(this.saveAccountingOperations([result], t));
                    }
                }
            }
            return promises;
        });
    }
    completeManualPaymentDept(o) {
        return __awaiter(this, void 0, void 0, function* () {
            // let res = db.getContext().transaction((t: Transaction) => {
            //     return this.createManualPaymentDept(o, t)
            // })
            let res = this.createManualPaymentDept(o);
            yield res;
        });
    }
    createManualPaymentDept(o, t) {
        return __awaiter(this, void 0, void 0, function* () {
            if (o.butcher.manualPaymentsAsDebt == "add") {
                yield this.fillButcherComissionAccounts(o);
                let butcherDebtAcc = o.butcherComissiomAccounts.find(p => p.code == 'total');
                let butcherDebt = helper_1.default.asCurrency(butcherDebtAcc.borc - butcherDebtAcc.alacak);
                let result = new account_1.AccountingOperation(`${o.ordernum} nolu ${o.butcherName} siparişi kasaptan alacak`, o.ordernum);
                result.accounts.push(new account_1.Account("kasaplardan-alacaklar", [o.butcherid, 1, o.ordernum], `${o.ordernum} nolu siparişten doğan komisyon ve puan borcu`).inc(butcherDebt));
                result.accounts.push(new account_1.Account("kasap-borc-tahakkuk", [1, o.butcherid, o.ordernum], `${o.ordernum} nolu manuel ödemesi`).inc(helper_1.default.asCurrency(butcherDebt)));
                return this.saveAccountingOperations([result], t);
            }
        });
    }
    addButcherDept(o, t, reason, total) {
        return __awaiter(this, void 0, void 0, function* () {
            let result = new account_1.AccountingOperation(`${reason}`, o.ordernum);
            result.accounts.push(new account_1.Account("kasaplardan-alacaklar", [o.butcherid, 1, o.ordernum], `${reason}`).inc(total));
            result.accounts.push(new account_1.Account("kasap-borc-tahakkuk", [1, o.butcherid, o.ordernum], `${reason}`).inc(helper_1.default.asCurrency(total)));
            return this.saveAccountingOperations([result], t);
        });
    }
    makeManuelPayment(o, total, t) {
        return __awaiter(this, void 0, void 0, function* () {
            let ops = [];
            let promises = [];
            let productPrice = this.calculateProduct(o);
            let paymentId = "manuel";
            let usablePuan = helper_1.default.asCurrency(0);
            this.fillEarnedPuanAccounts(o, productPrice);
            let op = new account_1.AccountingOperation(`${o.ordernum} ödemesi - ${paymentId}`, o.ordernum);
            op.accounts.push(new account_1.Account("odeme-bekleyen-satislar", [o.userId, o.ordernum, 600], "kapıda ödeme").dec(total - usablePuan));
            // if (usablePuan) {
            //     op.accounts.push(new Account("odeme-bekleyen-satislar", [o.userId, o.ordernum, 1100], "puan kullanımı").dec(usablePuan));
            // }
            op.accounts.push(new account_1.Account("satis-alacaklari", [o.userId, o.ordernum]).dec(total));
            ops.push(op);
            let butcherShip = this.calculateTeslimatOfButcher(o);
            let kasaptanAlShip = this.calculateTeslimatOfKasaptanAl(o);
            let puanAccounts = this.getEarnedPuanAccounts(o, productPrice);
            //let usedPuanAccounts = this.getUsedPuanAccounts(o, usablePuan);
            let comissionAccounts = this.getComissionAccounts(o, butcherShip + productPrice, kasaptanAlShip, usablePuan);
            ops.push(puanAccounts);
            //ops.push(usedPuanAccounts);
            ops.push(comissionAccounts);
            o.paidTotal = total;
            promises.push(o.save({
                transaction: t
            }));
            promises = promises.concat(this.saveAccountingOperations(ops, t));
            let res = yield Promise.all(promises);
            this.sendPuanNotification(o);
            return res;
        });
    }
    sendPuanNotification(o) {
        return __awaiter(this, void 0, void 0, function* () {
            let puans = yield this.getEarnedPuans(o);
            let total = puans.alacak - puans.borc;
            if (total > 0.00) {
                let text = `Tebrikler! KasaptanAl.com tercihiniz size ${helper_1.default.formattedCurrency(total)} puan kazandirdi. Bir sonraki siparisinizde kullanmayi unutmayin`;
                sms_1.Sms.send(o.phone, text, false, new sitelog_1.default(this.constructorParams));
            }
        });
    }
    makeCreditcardPayment(ol, paymentRequest, paymentInfo, t) {
        return __awaiter(this, void 0, void 0, function* () {
            let ops = [];
            let promises = [];
            for (let i = 0; i < ol.length; i++) {
                let o = ol[i];
                //let usablePuan = Math.min(o.requestedPuan, await this.getUsablePuans(o));
                let usablePuan = o.requestedPuan;
                let op = new account_1.AccountingOperation(`${o.ordernum} kredi kartı ödemesi - ${paymentInfo.paymentId}`, o.ordernum);
                if (o.orderSource == order_3.OrderSource.butcher) {
                    op.accounts.push(new account_1.Account("odeme-bekleyen-satislar", [o.userId, o.ordernum, 1000]).dec(paymentInfo.paidPrice));
                    op.accounts.push(new account_1.Account("satis-alacaklari", [o.userId, o.ordernum]).dec(paymentInfo.paidPrice));
                    let comissionAccounts = this.getComissionAccounts(o, paymentInfo.paidPrice, 0, 0);
                    ops.push(comissionAccounts);
                    ops.push(op);
                    promises = promises.concat(this.updateOrderByCreditcardPayment(o, paymentInfo, t));
                }
                else {
                    op.accounts.push(new account_1.Account("odeme-bekleyen-satislar", [o.userId, o.ordernum, 500], "kart ödemesi").dec(paymentInfo.paidPrice));
                    if (usablePuan) {
                        op.accounts.push(new account_1.Account("odeme-bekleyen-satislar", [o.userId, o.ordernum, 1100], "puan kullanımı").dec(usablePuan));
                    }
                    op.accounts.push(new account_1.Account("satis-alacaklari", [o.userId, o.ordernum]).dec(paymentInfo.paidPrice + usablePuan));
                    ops.push(op);
                    let butcherShip = this.calculateTeslimatOfButcher(o);
                    let kasaptanAlShip = this.calculateTeslimatOfKasaptanAl(o);
                    let productPrice = this.calculateProduct(o);
                    let puanAccounts = this.getEarnedPuanAccounts(o, productPrice);
                    let usedPuanAccounts = this.getUsedPuanAccounts(o, usablePuan);
                    let comissionAccounts = this.getComissionAccounts(o, butcherShip + productPrice, kasaptanAlShip, usablePuan);
                    ops.push(puanAccounts);
                    ops.push(usedPuanAccounts);
                    ops.push(comissionAccounts);
                    promises = promises.concat(this.updateOrderByCreditcardPayment(o, paymentInfo, t));
                    promises = promises.concat(this.updateButcherDebtAfterPayment(o, paymentRequest, paymentInfo, t));
                }
            }
            promises = promises.concat(this.saveAccountingOperations(ops, t));
            let result = yield Promise.all(promises);
            for (let i = 0; i < ol.length; i++) {
                let notifyMobilePhones = (ol[i].butcher.notifyMobilePhones || "").split(',');
                notifyMobilePhones.push('5531431988');
                notifyMobilePhones.push('5326274151');
                notifyMobilePhones.push('5316857306');
                email_1.default.send(ol[i].email, "siparişinizin ödemesi yapıldı", "order.paid.ejs", this.getView(ol[i]), 'order/paid');
                for (var p = 0; p < notifyMobilePhones.length; p++) {
                    if (notifyMobilePhones[p].trim()) {
                        let payUrl = `${this.url}/manageorder/${ol[i].ordernum}`;
                        sms_1.Sms.send(notifyMobilePhones[p].trim(), `${ol[i].butcherName} yeni siparis[${ol[i].displayName}]: ${helper_1.default.formattedCurrency(paymentInfo.paidPrice)} online odeme yapildi. LUTFEN SIPARISI YANITLAYIN: ${payUrl} `, false, new sitelog_1.default(this.constructorParams));
                    }
                }
                this.sendPuanNotification(ol[i]);
            }
            return result;
        });
    }
    generateInitialAccounting(o) {
        let op = new account_1.AccountingOperation(`${o.ordernum} numaralı sipariş`, o.ordernum);
        if (o.orderSource == order_3.OrderSource.butcher) {
            op.accounts.push(new account_1.Account("odeme-bekleyen-satislar", [o.userId, o.ordernum, 100], "Kasabın Kendi Sipariş Bedeli").inc(o.subTotal));
            op.accounts.push(new account_1.Account("satis-alacaklari", [o.userId, o.ordernum]).inc(o.total));
        }
        else {
            op.accounts.push(new account_1.Account("odeme-bekleyen-satislar", [o.userId, o.ordernum, 100], "Ürün Bedeli").inc(o.subTotal));
            if (o.shippingTotal > 0.00) {
                if (o.dispatcherType == "butcher" || o.dispatcherType == "butcher/auto") {
                    op.accounts.push(new account_1.Account("odeme-bekleyen-satislar", [o.userId, o.ordernum, 200], "Kasap Teslimat Bedeli").inc(o.shippingTotal));
                }
                else
                    op.accounts.push(new account_1.Account("odeme-bekleyen-satislar", [o.userId, o.ordernum, 201], "KasaptanAl.com Teslimat Bedeli").inc(o.shippingTotal));
            }
            if (Math.abs(o.discountTotal) > 0.00) {
                op.accounts.push(new account_1.Account("satis-indirimleri", [o.userId, o.ordernum, 100], "Uygulanan İndirimler").inc(Math.abs(o.discountTotal)));
            }
            op.accounts.push(new account_1.Account("satis-alacaklari", [o.userId, o.ordernum]).inc(o.total));
        }
        op.validate();
        return op;
        return;
        // op.accounts.push(new Account("kredi-karti-provizyon", [o.userId, o.ordernum]).inc(total))
        // op.accounts.push(new Account("havuz-hesabi", [o.userId, o.ordernum]).inc(total))
        // let kasapKarOran = 0.10;
        // let kasapPuanOran = 0.2;
        // let odemeSirketiKomisyonOran = 0.032;
        // let kalittePuanOran = 0.00;
        // let musteriIadeToplam = Helper.asCurrency(total * 0.05);
        // let gerceklesenSatisToplam = Helper.asCurrency(total - musteriIadeToplam);
        // let kasapSatisToplam = Helper.asCurrency(gerceklesenSatisToplam * (1.00 - kasapKarOran));
        // let kasapPuanToplam = Helper.asCurrency(gerceklesenSatisToplam * kasapPuanOran);
        // let kasapUrunToplam = Helper.asCurrency(kasapSatisToplam - kasapPuanToplam);
        // let kalittePuanToplam = Helper.asCurrency(gerceklesenSatisToplam * kalittePuanOran);
        // let odemeSirketiKomisyonToplam = Helper.asCurrency(gerceklesenSatisToplam * odemeSirketiKomisyonOran);
        // let netKar = Helper.asCurrency(gerceklesenSatisToplam - kalittePuanToplam - kasapPuanToplam - kasapUrunToplam - odemeSirketiKomisyonToplam);
        // op.accounts.push(new Account("kredi-karti-provizyon", [o.userId, o.ordernum]).dec(gerceklesenSatisToplam))
        // op.accounts.push(new Account("havuz-hesabi", [o.userId, o.ordernum]).dec(total))
        // op.accounts.push(new Account("kredi-karti-provizyon-iade", [o.userId, o.ordernum]).inc(musteriIadeToplam))
        // op.accounts.push(new Account("kredi-karti-odemeleri", [o.userId, o.ordernum]).inc(gerceklesenSatisToplam))
        // op.accounts.push(new Account("banka", [o.userId, o.ordernum]).inc(netKar))
        // op.accounts.push(new Account("kasap-puan-giderleri", [o.userId, o.ordernum]).inc(kasapPuanToplam))
        // op.accounts.push(new Account("kasap-urun-giderleri", [o.userId, o.ordernum]).inc(kasapUrunToplam))
        // kalittePuanToplam > 0 ? op.accounts.push(new Account("kalitte-puan-giderleri", [o.userId, o.ordernum]).inc(kalittePuanToplam)) : null;
        // op.accounts.push(new Account("odeme-sirketi-giderleri", [o.userId, o.ordernum]).inc(odemeSirketiKomisyonToplam))
        // op.validate()
        // return op;
    }
    getFromShopcard(card) {
        return __awaiter(this, void 0, void 0, function* () {
            let butchers = card.butchers;
            let groupid = orderid.generate();
            // let l3 = await Area.findByPk(card.address.level3Id);
            // let l2 = l3 ? await Area.findByPk(l3.parentid) : null;
            let orders = [];
            // let payment = CreditcardPaymentFactory.getInstance();
            // let log = new SiteLogRoute(this.constructorParams);
            // payment.logger = log;
            for (var bi in butchers) {
                let order = yield order_1.Order.fromShopcard(card, bi);
                order.platform = this.platform;
                order.appPlatform = this.appPlatform;
                order.ordergroupnum = groupid;
                order.butcherid = parseInt(bi);
                order.butcher = yield butcher_1.default.findByPk(order.butcherid);
                order.butcherSelection = butchers[bi].userSelected ? "user" : "default";
                order.butcherName = butchers[bi].name;
                order.securityCode = `${butchers[bi].name[0]}-${helper_1.default.getRandomInt(999) + 1000}`;
                order.userId = this.req.user ? this.req.user.id : 0;
                if (!order.userId) {
                    order.isFirstButcherOrder = true;
                    order.isFirstOrder = true;
                }
                orders.push(order);
            }
            return orders;
        });
    }
    createAsButcherOrder(o) {
        return __awaiter(this, void 0, void 0, function* () {
            o.orderSource = "butcher";
            o.ordernum = orderid.generate();
            let result = [];
            let res = context_1.default.getContext().transaction((t) => {
                result.push(o.save({
                    transaction: t
                }));
                let accOperation = this.generateInitialAccounting(o);
                result.push(this.saveAccountingOperations([accOperation], t));
                return Promise.all(result);
            });
            yield res;
            return o;
        });
    }
    create(card) {
        return __awaiter(this, void 0, void 0, function* () {
            let result = [];
            let orders = yield this.getFromShopcard(card);
            let res = context_1.default.getContext().transaction((t) => {
                for (var i = 0; i < orders.length; i++) {
                    let dbOrder = this.createOrder(t, orders[i], card);
                    let accOperation = this.generateInitialAccounting(orders[i]);
                    result.push(dbOrder);
                    result.push(accountmodel_1.default.saveOperation(accOperation, {
                        transaction: t
                    }));
                }
                return Promise.all(result);
            });
            yield res;
            let fres = [];
            for (var oi = 0; oi < orders.length; oi++) {
                let order = orders[oi];
                let api = new order_2.default(this.constructorParams);
                let dbOrder = yield api.getOrder(order.ordernum);
                let view = this.getView(dbOrder);
                let viewUrl = `${this.url}/user/orders/${order.ordernum}`;
                yield email_1.default.send(dbOrder.email, "siparişinizi aldık", "order.started.ejs", view, 'order/created');
                yield sms_1.Sms.send(dbOrder.phone, `KasaptanAl.com ${dbOrder.butcherName} siparisinizi aldik, Teslimat kodu: ${order.securityCode}. ${order.paymentType == 'onlinepayment' ? 'Simdi odeme yapabilirsiniz' : 'Bilgi'}: ${viewUrl}`, false, new sitelog_1.default(this.constructorParams));
                if (order.paymentType != "onlinepayment") {
                    let notifyMobilePhones = (order.butcher.notifyMobilePhones || "").split(',');
                    notifyMobilePhones.push('5531431988');
                    notifyMobilePhones.push('5326274151');
                    notifyMobilePhones.push('5316857306');
                    for (var p = 0; p < notifyMobilePhones.length; p++) {
                        if (notifyMobilePhones[p].trim()) {
                            let manageUrl = `${this.url}/manageorder/${order.ordernum}`;
                            sms_1.Sms.send(notifyMobilePhones[p].trim(), `${order.butcherName} yeni siparis [${order.displayName}]. LUTFEN SIPARISI YANITLAYIN: ${manageUrl} `, false, new sitelog_1.default(this.constructorParams));
                        }
                    }
                }
                fres.push(dbOrder);
            }
            return fres;
        });
    }
    getOrderRoute() {
        return __awaiter(this, void 0, void 0, function* () {
            let order = yield this.getOrder(this.req.params.ordernum);
            if (!order)
                return this.next();
            let view = this.getView(order);
            this.res.send(view);
        });
    }
    requestDispatcher(o) {
        return __awaiter(this, void 0, void 0, function* () {
        });
    }
    approveRoute() {
        return __awaiter(this, void 0, void 0, function* () {
            let ordernum = this.req.params.ordernum;
            let order = yield this.getOrder(ordernum, true);
            if (!order)
                return this.res.sendStatus(404);
            let newStatus = order_3.OrderItemStatus.shipping;
            order.status = order_3.OrderItemStatus.shipping;
            order.statusDesc ? null : (order.statusDesc = '');
            order.statusDesc += `\n- ${helper_1.default.formatDate(helper_1.default.Now(), true)}: ${order.status} -> ${newStatus}`;
            yield order.save();
            // if (config.nodeenv == 'production') {
            //     let notifyMobilePhones = [];
            //     notifyMobilePhones.push('5531431988');
            //     notifyMobilePhones.push('5326274151');
            //     let payUrl = `${this.url}/manageorder/${order.ordernum}`;
            //     let text =`${order.butcherName} teslim edeceğini iletti[${order.name}]. ${payUrl}`;
            //     await Sms.sendMultiple(notifyMobilePhones, text, false, new SiteLogRoute(this.constructorParams))    
            // }
            this.res.send(200);
        });
    }
    changeStatus(order, newStatus, userMsg, notifyButcher) {
        return __awaiter(this, void 0, void 0, function* () {
            order.statusDesc ? null : (order.statusDesc = '');
            let oldStatus = order.status;
            order.status = newStatus;
            order.statusDesc += `\n- ${helper_1.default.formatDate(helper_1.default.Now(), true)}: ${oldStatus} -> ${order.status}, ${userMsg}`;
            yield order.save();
            if (notifyButcher) {
                let manageUrl = `${this.url}/manageorder/${order.ordernum}`;
                let text = `DURUM DEGISTI: ${order.butcherName} siparis [${order.displayName}]. ${oldStatus} -> ${order.status}. Not: ${userMsg}. Bilgi ${manageUrl} `;
                yield this.sendButcherNotifications(order, text);
            }
        });
    }
    sendButcherNotifications(order, text) {
        return __awaiter(this, void 0, void 0, function* () {
            let notifyMobilePhones = (order.butcher.notifyMobilePhones || "").split(',');
            notifyMobilePhones.push('5531431988');
            notifyMobilePhones.push('5326274151');
            for (var p = 0; p < notifyMobilePhones.length; p++) {
                if (notifyMobilePhones[p].trim()) {
                    yield sms_1.Sms.send(notifyMobilePhones[p].trim(), text, false, new sitelog_1.default(this.constructorParams));
                }
            }
        });
    }
    sendPlanNotifications(order) {
        return __awaiter(this, void 0, void 0, function* () {
            let notifyMobilePhones = (order.butcher.notifyMobilePhones || "").split(',');
            notifyMobilePhones.push('5531431988');
            notifyMobilePhones.push('5326274151');
            let manageUrl = `${this.url}/manageorder/${order.ordernum}`;
            let text = `${order.butcherName} musteriniz ${order.displayName} teslimat icin bilgilendirildi: ${order.shipmentStartText}. Siparis: ${manageUrl}`;
            yield this.sendButcherNotifications(order, text);
            let customerText = `KasaptanAl.com siparisiniz icin ${order.butcherName} teslimat planlamasi yapti: ${order.shipmentStartText}. Kasap tel: ${order.butcher.phone}`;
            yield sms_1.Sms.send(order.phone, customerText, false, new sitelog_1.default(this.constructorParams));
            email_1.default.send(order.email, `KasaptanAl.com ${order.butcherName} siparişiniz teslimat bilgisi`, "order.planed.ejs", this.getView(order), 'order/planned');
        });
    }
    // @Auth.Anonymous()
    // async kuryeCagirRoute() {
    //     let ordernum = this.req.params.ordernum;
    //     let order = await this.getOrder(ordernum, true);
    //     if (!order)
    //         return this.res.send(404);
    //     let provider = LogisticFactory.getInstance(order.dispatcherType, {
    //         dispatcher: await Dispatcher.findByPk(order.dispatcherid, {
    //             include: [{
    //                 model: Butcher,
    //                 as: 'butcher',
    //             }]
    //         })
    //     });
    //     let hour = Number.parseInt(this.req.body.hour);
    //     provider.safeRequests = false;
    //     let day = Helper.newDate(this.req.body.day);
    //     let shour = Math.round(hour / 100);
    //     let fHour = hour % 100;
    //     order.shipmentstart = Helper.newDate2(day.getFullYear(), day.getMonth(), day.getDate(), shour, fHour, 0);
    //     if (order.shipmentstart < Helper.Now())
    //         order.shipmentstart = Helper.Now();
    //     order.shipmentStartText = Helper.formatDate(order.shipmentstart, true) + ' kasap çıkış olarak kurye planlandı';
    //     let request = provider.orderFromOrder(order);
    //     try {
    //         let offer = await provider.createOrder(request);
    //         order.deliveryOrderId = offer.orderId;
    //     } catch (err) {
    //         throw err;
    //     }
    //     await order.save();
    //     await this.sendPlanNotifications(order);
    //     this.res.send(200);
    // }
    markAsShippedRoute() {
        return __awaiter(this, void 0, void 0, function* () {
            let ordernum = this.req.params.ordernum;
            let order = yield this.getOrder(ordernum, true);
            if (!order)
                return this.res.send(404);
            let balance = order.workedAccounts.find(p => p.code == 'total');
            let shouldBePaid = helper_1.default.asCurrency(balance.alacak - balance.borc);
            if (shouldBePaid > 0) {
                yield this.completeManuelPayment(order, shouldBePaid);
                order = yield this.getOrder(ordernum, true);
                yield this.completeManualPaymentDept(order);
            }
            if (order.status != order_3.OrderItemStatus.success) {
                order.statusDesc ? null : (order.statusDesc = '');
                order.statusDesc += `\n- ${helper_1.default.formatDate(helper_1.default.Now(), true)} tarihinde ${order.status} -> ${order_3.OrderItemStatus.success}`;
                yield this.completeOrderStatus(order, order_3.OrderItemStatus.success);
            }
            this.res.send('OK');
        });
    }
    cancelDeliveryRoute() {
        return __awaiter(this, void 0, void 0, function* () {
            let ordernum = this.req.params.ordernum;
            let order = yield this.getOrder(ordernum, true);
            if (!order)
                return this.res.send(404);
            if ((order.dispatcherType == 'banabikurye' || order.dispatcherType == 'banabikurye/car') && order.deliveryOrderId) {
                let provider = core_1.LogisticFactory.getInstance(order.dispatcherType, {
                    dispatcher: yield dispatcher_1.default.findByPk(order.dispatcherid, {
                        include: [{
                                model: butcher_1.default,
                                as: 'butcher',
                            }]
                    }),
                    initialDistance: 0
                });
                provider.safeRequests = false;
                yield provider.cancelOrder(order.deliveryOrderId);
                order.deliveryOrderId = null;
                yield order.save();
            }
            this.res.send(200);
        });
    }
    setDeliveryRoute() {
        return __awaiter(this, void 0, void 0, function* () {
            let ordernum = this.req.params.ordernum;
            let order = yield this.getOrder(ordernum, true);
            if (!order)
                return this.res.send(404);
            let hour = Number.parseInt(this.req.body.hour);
            let day = helper_1.default.newDate(this.req.body.day);
            let shour = Math.round(hour / 100);
            let fHour = hour % 100;
            order.shipmentstart = helper_1.default.newDate2(day.getFullYear(), day.getMonth(), day.getDate(), shour, fHour, 0);
            let max = new Date(order.shipmentstart);
            max.setTime(max.getTime() + (4 * 60 * 60 * 1000));
            //if (max < Helper.Now())
            //    throw new Error("Lütfen teslimat gün ve saatini kontrol edin, hatalı gözüküyor.")
            if (order.dispatcherType == 'banabikurye' || order.dispatcherType == 'banabikurye/car') {
                let provider = core_1.LogisticFactory.getInstance(order.dispatcherType, {
                    dispatcher: yield dispatcher_1.default.findByPk(order.dispatcherid, {
                        include: [{
                                model: butcher_1.default,
                                as: 'butcher',
                            }]
                    }),
                    initialDistance: 0
                });
                provider.safeRequests = false;
                order.shipmentStartText = helper_1.default.formatDate(order.shipmentstart, true) + ' kasap çıkış olarak kurye planlandı';
                let request = provider.orderFromOrder(order);
                try {
                    let offer = yield provider.createOrder(request);
                    order.deliveryOrderId = offer.orderId;
                    order.dispatcherFee = offer.totalFee;
                }
                catch (err) {
                    throw err;
                }
            }
            else {
                order.shipmentStartText = `${helper_1.default.formatDate(order.shipmentstart)} ${shipment_1.ShipmentHours[hour]}`;
                order.statusDesc ? null : (order.statusDesc = '');
                order.statusDesc += `\n- ${helper_1.default.formatDate(helper_1.default.Now(), true)}: Teslimat ${order.shipmentStartText} olarak planlandı`;
            }
            order.status = order_3.OrderItemStatus.shipping;
            order.deliveryStatus = 'planned';
            yield order.save();
            yield this.sendPlanNotifications(order);
            this.res.send(200);
        });
    }
    bnbCallbackRoute() {
        return __awaiter(this, void 0, void 0, function* () {
            let order = null;
            if (this.req.body.event_type == "order_created" || this.req.body.event_type == "order_changed") {
                order = yield this.getOrder(this.req.body.order.points[0].client_order_id, false);
                order.statusDesc ? null : (order.statusDesc = '');
                order.deliveryOrderId = this.req.body.order.order_id;
                if (this.req.body.order.status == 'available') {
                    order.status = order_3.OrderItemStatus.shipping;
                    order.deliveryStatus = order.deliveryStatus || 'planned';
                    order.statusDesc += `\n- ${helper_1.default.formatDate(helper_1.default.Now(), true)}: kurye atama bekleniyor.`;
                }
                if (this.req.body.order.status == 'new') {
                    order.statusDesc += `\n- ${helper_1.default.formatDate(helper_1.default.Now(), true)}: teslimat talebi oluşturuldu.`;
                    order.deliveryStatus = order.deliveryStatus || 'planned';
                }
                if (this.req.body.order.status == 'active') {
                    order.status = order_3.OrderItemStatus.onway;
                    order.statusDesc += `\n- ${helper_1.default.formatDate(helper_1.default.Now(), true)}: teslimat süreci başladı, yolda.`;
                    let notifyMobilePhones = (order.butcher.notifyMobilePhones || "").split(',');
                    notifyMobilePhones.push('5326274151');
                    for (var p = 0; p < notifyMobilePhones.length; p++) {
                        if (notifyMobilePhones[p].trim()) {
                            let manageUrl = `${this.url}/manageorder/${order.ordernum}`;
                            sms_1.Sms.send(notifyMobilePhones[p].trim(), `${order.butcherName} kurye yola cikti. Siparis[${order.displayName}]: ${manageUrl} `, false, new sitelog_1.default(this.constructorParams));
                        }
                    }
                    let userUrl = `${this.url}/user/orders/${order.ordernum}`;
                    yield sms_1.Sms.send(order.phone, `Siparişiniz yola cikti. Bilgi: ${userUrl} `, false, new sitelog_1.default(this.constructorParams));
                }
                if (this.req.body.order.status == 'canceled') {
                    order.statusDesc += `\n- ${helper_1.default.formatDate(helper_1.default.Now(), true)}: teslimat iptal edildi.`;
                    order.deliveryStatus = "canceled";
                    order.deliveryOrderId = null;
                }
                if (this.req.body.order.status == 'completed') {
                    order.status = order_3.OrderItemStatus.success;
                    order.statusDesc += `\n- ${helper_1.default.formatDate(helper_1.default.Now(), true)}: başarıyla teslim edildi`;
                }
                yield order.save();
            }
            else if (this.req.body.event_type == "delivery_created" || this.req.body.event_type == "delivery_changed") {
                order = yield this.getOrder(this.req.body.delivery.client_order_id, false);
                order.statusDesc ? null : (order.statusDesc = '');
                order.deliveryStatus = this.req.body.delivery.status;
                order.statusDesc += `\n- ${helper_1.default.formatDate(helper_1.default.Now(), true)}: teslimat şu aşamada: ${order_3.DeliveryStatusDesc[order.deliveryStatus] || ''}`;
                yield order.save();
            }
            let log = new sitelog_1.default(this.constructorParams);
            let data = {
                logData: JSON.stringify(this.req.body),
                f1: order ? order.ordernum : undefined,
                status: this.req.body.event_type + '/' + (order ? order.deliveryStatus : ""),
                logtype: "BNB"
            };
            yield log.log(data);
            this.res.send(200);
        });
    }
    getManuelOrder() {
        return __awaiter(this, void 0, void 0, function* () {
            let user = this.req.user;
            let order = this.req.body;
            order.orderDate = helper_1.default.Now();
            order.semt = this.req.prefAddr.display;
            order.ip = this.userIp;
            user.lastManuealOrder = JSON.stringify(order);
            user.lastAddress = this.req.body.custAddress;
            user.lastLocation = {
                type: 'Point',
                coordinates: [order.prefAdr.lat, order.prefAdr.lng]
            };
            yield user.save();
            yield sms_1.Sms.sendMultiple(['5326274151', '5531431988'], `yeni manuel sipariş: www.kasaptanal.com/pages/operator/manuelorders`, false, new sitelog_1.default(this.constructorParams));
            this.res.sendStatus(200);
        });
    }
    listOrders() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.req.user.hasRole('admin'))
                return this.next();
            let sdate = helper_1.default.newDate2(2000, 1, 1);
            let fdate = moment().endOf("month").toDate();
            let q = this.req.query.q || '3days';
            if (q == '3days') {
                sdate = moment().startOf('day').subtract(3, "days").toDate();
            }
            else if (q == '7days') {
                sdate = moment().startOf('day').subtract(7, "days").toDate();
            }
            else if (q == 'thismonth') {
                sdate = moment().startOf("month").toDate();
                fdate = moment().endOf("month").toDate();
            }
            else {
                sdate = moment().subtract(1, "month").startOf("month").toDate();
                fdate = moment(sdate).endOf("month").toDate();
            }
            let where = {
                creationDate: {
                    [sequelize_1.Op.and]: [
                        {
                            [sequelize_1.Op.gte]: sdate
                        },
                        {
                            [sequelize_1.Op.lte]: fdate
                        }
                    ]
                }
            };
            if (this.req.query.status) {
                where['status'] = this.req.query.status;
            }
            if (this.req.query.nopayment == 'true') {
                where['paidTotal'] = {
                    [sequelize_1.Op.eq]: 0
                };
            }
            let orders = yield order_1.Order.findAll({
                where: where,
                order: [['id', 'desc']]
            });
            let result = orders.map(o => {
                return {
                    ordernum: o.ordernum,
                    phone: o.phone,
                    date: o.creationDate,
                    semt: `${o.areaLevel4Text ? o.areaLevel4Text + ',' : ''} ${o.areaLevel3Text}, ${o.areaLevel2Text}/${o.areaLevel1Text}`,
                    butcher: o.butcherName,
                    status: o.status,
                    payment: o.paymentStatus,
                    dispatcherType: o.dispatcherType,
                    paymentType: o.paymentType,
                    paid: o.paidTotal,
                    name: o.name,
                    total: o.total
                };
            });
            this.res.send(result);
        });
    }
    listManuelOrders() {
        return __awaiter(this, void 0, void 0, function* () {
            let users = yield user_1.default.findAll({
                where: {
                    lastManuealOrder: {
                        [sequelize_1.Op.ne]: ''
                    }
                },
                limit: 50,
                order: [['updatedOn', 'desc']]
            });
            let result = users.map(o => {
                return {
                    userphone: o.mphone,
                    order: JSON.parse(o.lastManuealOrder)
                };
            });
            this.res.send(result);
        });
    }
    evaluateOrder() {
        return __awaiter(this, void 0, void 0, function* () {
            let ordernum = this.req.params.ordernum;
            let order = yield this.getOrder(ordernum, true);
            if (!order)
                return this.res.sendStatus(404);
            if (!order.canBeEvaluated())
                throw new http_1.ValidationError('Bu sipariş değerlendirme süresi maalesef geçmiş');
            let puan = helper_1.default.parseFloat(this.req.body.star);
            let review = yield review_1.default.findOne({
                where: {
                    userId: order.userId,
                    type: 'order',
                    ref1: order.id
                }
            });
            if (review == null) {
                review = new review_1.default();
                review.userId = order.userId;
                review.type = 'order';
                review.ref1 = order.id;
                review.ref2 = order.butcherid,
                    review.itemDate = order.creationDate;
                review.ref2Text = order.butcher.name;
                review.ref2slug = order.butcher.slug;
                review.level1Id = order.areaLevel1Id;
                review.level2Id = order.areaLevel2Id;
                review.level3Id = order.areaLevel3Id;
                review.level1Text = order.areaLevel1Text;
                review.level2Text = order.areaLevel2Text;
                review.level3Text = order.areaLevel3Text;
                review.areaSlug = (yield area_1.default.findByPk(review.level3Id)).slug;
                review.userRating1 = puan;
                review.published = false;
                review.tempContent = `Kasaba: ${this.req.body.butcherComment}\nSiteye:${this.req.body.siteComment}`;
                let words = order.name.match(/\S+/g).map(w => `${w}`);
                if (words.length >= 2)
                    review.displayUser = words[0] + ' ' + words[1][0] + '.';
                else
                    review.displayUser = words[0] + '.';
                yield review.save();
            }
            else if (review.published) {
                throw new http_1.ValidationError('Bu siparişle ilgili yorum yapılmış ve yayınlanmakta.');
            }
            this.res.sendStatus(200);
        });
    }
    static SetRoutes(router) {
        router.post('/order/:ordernum/approve', Route.BindRequest(Route.prototype.approveRoute));
        // router.post('/order/:ordernum/kuryeCagir', Route.BindRequest(Route.prototype.kuryeCagirRoute))
        router.post('/order/bnbCallback', Route.BindRequest(Route.prototype.bnbCallbackRoute));
        router.post('/order/:ordernum/setDelivery', Route.BindRequest(Route.prototype.setDeliveryRoute));
        router.post('/order/:ordernum/cancelDelivery', Route.BindRequest(Route.prototype.cancelDeliveryRoute));
        router.post('/order/:ordernum/markAsShipped', Route.BindRequest(Route.prototype.markAsShippedRoute));
        router.post('/order/manuelorders/create', Route.BindRequest(Route.prototype.getManuelOrder));
        router.get('/order/manuelorders/list', Route.BindRequest(Route.prototype.listManuelOrders));
        router.get('/order/list', Route.BindRequest(Route.prototype.listOrders));
        router.post('/order/:ordernum/evaluate', Route.BindRequest(Route.prototype.evaluateOrder));
        //router.get("/admin/order/:ordernum", Route.BindRequest(this.prototype.getOrderRoute));
    }
}
__decorate([
    common_1.Auth.Anonymous(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], Route.prototype, "approveRoute", null);
__decorate([
    common_1.Auth.Anonymous(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], Route.prototype, "markAsShippedRoute", null);
__decorate([
    common_1.Auth.Anonymous(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], Route.prototype, "cancelDeliveryRoute", null);
__decorate([
    common_1.Auth.Anonymous(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], Route.prototype, "setDeliveryRoute", null);
__decorate([
    common_1.Auth.Anonymous(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], Route.prototype, "bnbCallbackRoute", null);
__decorate([
    common_1.Auth.RequireCatcpha(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], Route.prototype, "getManuelOrder", null);
__decorate([
    common_1.Auth.Anonymous(),
    common_1.Auth.RequireCatcpha(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], Route.prototype, "evaluateOrder", null);
exports.default = Route;
