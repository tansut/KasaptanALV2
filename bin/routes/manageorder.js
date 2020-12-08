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
const helper_1 = require("../lib/helper");
let ellipsis = require('text-ellipsis');
var MarkdownIt = require('markdown-it');
const creditcard_1 = require("../lib/payment/creditcard");
const order_1 = require("./api/order");
const sitelog_1 = require("./api/sitelog");
const accountmodel_1 = require("../db/models/accountmodel");
const account_1 = require("../models/account");
const commissionHelper_1 = require("../lib/commissionHelper");
const order_2 = require("../models/order");
const geo_1 = require("../models/geo");
const shipment_1 = require("../models/shipment");
var MarkdownIt = require('markdown-it');
class Route extends router_1.ViewRouter {
    constructor() {
        super(...arguments);
        this.DeliveryStatusDesc = order_2.DeliveryStatusDesc;
        this.markdown = new MarkdownIt();
        this.LocationTypeDesc = geo_1.LocationTypeDesc;
        this.shouldBePaid = 0.00;
        this.paid = 0.00;
        this.productTotal = 0.00;
        this.teslimatKasaptan = 0.00;
        this.teslimatButcher = 0.00;
        this.earnedPuanButcher = 0.00;
        this.earnedPuanKalitte = 0.00;
        this.earnedPuanTotal = 0.00;
        this.mayEarnPuanTotal = 0.00;
        this.butcherDebt = 0.00;
        this.possiblePuanList = [];
        this.puanAccountsKalitte = [];
        this.puanAccountsButcher = [];
    }
    getOrderSummary() {
        return __awaiter(this, void 0, void 0, function* () {
            let acountingSummary = yield this.api.getWorkingAccounts(this.order);
            if (acountingSummary.length == 1) {
                let initial = this.api.generateInitialAccounting(this.order);
                yield this.api.saveAccountingOperations([initial]);
                yield this.getOrder();
            }
            this.productTotal = this.api.calculateProduct(this.order);
            this.teslimatButcher = this.api.calculateTeslimatOfButcher(this.order);
            this.teslimatKasaptan = this.api.calculateTeslimatOfKasaptanAl(this.order);
            this.balance = this.order.workedAccounts.find(p => p.code == 'total');
            this.shouldBePaid = helper_1.default.asCurrency(this.balance.alacak - this.balance.borc);
            this.paid = this.api.calculatePaid(this.order);
            this.puanBalanceKalitte = this.order.kalittePuanAccounts.find(p => p.code == 'total');
            this.puanBalanceButcher = this.order.butcherPuanAccounts.find(p => p.code == 'total');
            this.earnedPuanKalitte = this.puanBalanceKalitte ? helper_1.default.asCurrency(this.puanBalanceKalitte.alacak - this.puanBalanceKalitte.borc) : 0.00;
            this.earnedPuanButcher = this.puanBalanceButcher ? helper_1.default.asCurrency(this.puanBalanceButcher.alacak - this.puanBalanceButcher.borc) : 0.00;
            this.earnedPuanTotal = helper_1.default.asCurrency(this.earnedPuanKalitte + this.earnedPuanButcher);
            this.mayEarnPuanTotal = 0.00;
            if (this.shouldBePaid > 0) {
                this.possiblePuanList = this.api.getPossiblePuanGain(this.order, this.productTotal);
                this.possiblePuanList.forEach(pg => this.mayEarnPuanTotal += pg.earned);
                this.mayEarnPuanTotal = helper_1.default.asCurrency(this.mayEarnPuanTotal);
            }
            let calc = new commissionHelper_1.ComissionHelper(this.order.getButcherRate(), this.order.getButcherFee());
            this.butcherFee = calc.calculateButcherComission(this.productTotal + this.teslimatButcher);
            let kalitteByButcherPuanAccounts = this.order.kalitteByButcherPuanAccounts.find(p => p.code == 'total');
            let butcherToCustomer = helper_1.default.asCurrency((kalitteByButcherPuanAccounts.alacak - kalitteByButcherPuanAccounts.borc) + (this.puanBalanceButcher.alacak - this.puanBalanceButcher.borc));
            if (butcherToCustomer <= 0) {
                this.possiblePuanList = this.api.getPossiblePuanGain(this.order, this.productTotal);
                this.possiblePuanList.forEach(pg => butcherToCustomer += pg.earned);
            }
            this.butcherFee.butcherToCustomer = helper_1.default.asCurrency(butcherToCustomer);
            yield this.api.fillButcherDebtAccounts(this.order);
            let butcherDebptAccounts = yield accountmodel_1.default.summary([account_1.Account.generateCode("kasaplardan-alacaklar", [this.order.butcherid], true)]);
            this.butcherDebt = butcherDebptAccounts.borc - butcherDebptAccounts.alacak;
        });
    }
    get paymentProvider() {
        if (!this._paymentProvider) {
            let payment = creditcard_1.CreditcardPaymentFactory.getInstance();
            let log = new sitelog_1.default(this.constructorParams);
            payment.logger = log;
            payment.userid = this.req.user ? this.req.user.id : null;
            payment.ip = this.req.header("x-forwarded-for") || this.req.connection.remoteAddress;
            this._paymentProvider = payment;
        }
        return this._paymentProvider;
    }
    // async orderSaveRoute() {
    //     let userMessage = "";
    //     await this.getOrder();
    //     await this.getOrderSummary()
    //     if (!this.order)
    //         return this.next();
    //     if (this.req.body.saveOrderStatus == "true" && this.order.status != this.req.body.orderStatus) {
    //         this.order.statusDesc ? null : (this.order.statusDesc = '')
    //         this.order.statusDesc += `\n- ${Helper.formatDate(Helper.Now(), true)} tarihinde ${this.order.status} -> ${this.req.body.orderStatus}`
    //         await this.api.completeOrderStatus(this.order, this.req.body.orderStatus);
    //         if (this.req.body.orderStatus == OrderItemStatus.success)
    //             userMessage = "KASABA MAKBUZ İLETMEYİ UNUTMAYIN"
    //     }
    //     if (this.req.body.makeManuelPayment == "true") {
    //         if (this.shouldBePaid > 0) {
    //             await this.api.completeManuelPayment(this.order, this.shouldBePaid)
    //         } else userMessage = "Ödemesi yok siparişin";
    //     }
    //     if (this.req.body.makeManuelPaymentDebt == "true") {
    //         if (this.paid > 0) {
    //             let toKalitte = Helper.asCurrency(this.butcherFee.kalitteFee + this.butcherFee.kalitteVat)
    //             await this.api.completeManualPaymentDept(this.order)
    //         } else userMessage = "Ödemesi yok siparişin";
    //     }
    //     // if (this.req.body.loadPuans == "true") {
    //     //     if (this.shouldBePaid > 0) {
    //     //         userMessage = "Ödemesi henüz yapılmamış siparişin";
    //     //     } else await this.api.completeLoadPuan(this.order, this.paid)
    //     // }
    //     if (this.req.body["kurye-maliyet"] == "true" && this.order.butcher.logisticProvider) {
    //         let provider = LogisticFactory.getInstance(this.order.butcher.logisticProvider, {
    //             dispatcher: await Dispatcher.findByPk(this.order.dispatcherid, {
    //                 include: [{
    //                     model: Butcher,
    //                     as: 'butcher',
    //                 }]
    //             })
    //         });
    //         provider.safeRequests = false;
    //         let request = provider.offerFromOrder(this.order);
    //         try {
    //             let offer = await provider.requestOffer(request);
    //             userMessage = `Taşıma: ${offer.totalFee}, İndirim: ${offer.discount}`;
    //         } catch (err) {
    //             userMessage = err.message
    //         }
    //     }
    //     if (this.req.body["kurye-cagir"] == "true" && this.order.butcher.logisticProvider) {
    //         let provider = LogisticFactory.getInstance(this.order.butcher.logisticProvider, {
    //             dispatcher: await Dispatcher.findByPk(this.order.dispatcherid, {
    //                 include: [{
    //                     model: Butcher,
    //                     as: 'butcher',
    //                 }]
    //             })
    //         });
    //         provider.safeRequests = false;
    //         let request = provider.orderFromOrder(this.order);
    //         try {
    //             let offer = await provider.createOrder(request);
    //             userMessage = `Kurye çağrıldı:`;
    //         } catch (err) {
    //             userMessage = err.message
    //         }
    //     }
    //     if (this.req.body.approveOrderSubMerchant == "true") {
    //         await this.paymentProvider.approveItem({
    //             paymentTransactionId: this.order.paymentTransactionId
    //         })
    //         this.order.subMerchantStatus = 'approved';
    //         userMessage = `${this.order.ordernum} subMerchant ONAYLANDI`
    //         await this.order.save();
    //     }
    //     if (this.req.body.disApproveOrderSubMerchant == "true") {
    //         await this.paymentProvider.disApproveItem({
    //             paymentTransactionId: this.order.paymentTransactionId
    //         })
    //         this.order.subMerchantStatus = 'disapproved';
    //         userMessage = `${this.order.ordernum} subMerchant ONAY KALDIRILDI`
    //         await this.order.save();
    //     }
    //     if (this.req.body.addcomment) {
    //         let comment = this.req.body.comment;
    //         let puan = Helper.parseFloat(this.req.body.commentpuan);
    //         let review = await Review.findOne({
    //             where: {
    //                 userId: this.order.userId,
    //                 type: 'order',
    //                 ref1: this.order.id
    //             }
    //         })
    //         if (review == null) {
    //             review = new Review();
    //             review.userId = this.order.userId;
    //             review.type = 'order';
    //             review.ref1 = this.order.id;
    //             review.ref2 = this.order.butcherid,
    //                 review.itemDate = this.order.creationDate;
    //             review.ref2Text = this.order.butcher.name;
    //             review.ref2slug = this.order.butcher.slug;
    //             review.content = comment;
    //             review.level1Id = this.order.areaLevel1Id;
    //             review.level2Id = this.order.areaLevel2Id;
    //             review.level3Id = this.order.areaLevel3Id;
    //             review.level1Text = this.order.areaLevel1Text;
    //             review.level2Text = this.order.areaLevel2Text;
    //             review.level3Text = this.order.areaLevel3Text;
    //             review.areaSlug = (await AreaModel.findByPk(review.level3Id)).slug;
    //             review.userRating1 = puan;
    //             let words = this.order.name.match(/\S+/g).map(w => `${w}`)
    //             if (words.length >= 2)
    //                 review.displayUser = words[0] + ' ' + words[1][0] + '.';
    //             else review.displayUser = words[0] + '.'
    //         } else {
    //             review.content = comment;
    //             review.userRating1 = puan;
    //         }
    //         await review.save();
    //         userMessage = "Yorum eklendi"
    //     }
    //     //
    //     await this.getOrder();
    //     await this.getOrderSummary()
    //     this.sendView("pages/operator.manageorder.ejs", { ...{ _usrmsg: { text: userMessage } }, ...this.api.getView(this.order), ...{ enableImgContextMenu: true } });
    // }
    get hideOrderDetails() {
        if (this.req.user && this.req.user.hasRole('admin'))
            return false;
        if (this.order.dispatcherType == 'butcher' || this.order.dispatcherType == 'butcher/auto')
            return false;
        return true;
    }
    getOrder() {
        return __awaiter(this, void 0, void 0, function* () {
            let ordernum = this.req.params.ordernum;
            this.api = new order_1.default(this.constructorParams);
            this.order = yield this.api.getOrder(ordernum, true);
        });
    }
    ordersListRoute() {
        return __awaiter(this, void 0, void 0, function* () {
            this.api = new order_1.default(this.constructorParams);
            let orders = yield this.api.getOrders();
            this.sendView('pages/operator.orders.ejs', { orders: orders });
        });
    }
    orderItemUpdateRoute() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.getOrder();
            if (!this.order)
                return this.next();
            let itemid = this.req.body.itemid;
            let orderitem = this.order.items.find(p => p.id == parseInt(itemid));
            let userMessage = "";
            try {
                if (this.req.body.approveSubMerchant) {
                    yield this.paymentProvider.approveItem({
                        paymentTransactionId: orderitem.paymentTransactionId
                    });
                    orderitem.subMerchantStatus = 'approved';
                    userMessage = `${orderitem.productName} subMerchant ONAYLANDI`;
                    yield orderitem.save();
                }
                if (this.req.body.disApproveSubMerchant) {
                    yield this.paymentProvider.disApproveItem({
                        paymentTransactionId: orderitem.paymentTransactionId
                    });
                    orderitem.subMerchantStatus = 'disapproved';
                    userMessage = `${orderitem.productName} subMerchant ONAY KALDIRILDI`;
                    yield orderitem.save();
                }
                if (this.req.body.saveOrderItemStatus == "true") {
                    if (orderitem.status != this.req.body.orderItemStatus) {
                        orderitem.statusDesc ? null : (orderitem.statusDesc = '');
                        orderitem.statusDesc += `\n- ${helper_1.default.formatDate(helper_1.default.Now(), true)} tarihinde ${orderitem.status} -> ${this.req.body.orderItemStatus}\n`;
                        yield this.api.completeOrderItemStatus(orderitem, this.req.body.orderItemStatus);
                        userMessage = `${orderitem.productName} yeni durum: ${orderitem.status}`;
                    }
                }
            }
            catch (err) {
                userMessage = err.message || err.errorMessage;
            }
            yield this.getOrder();
            yield this.getOrderSummary();
            this.sendView("pages/operator.manageorder.ejs", Object.assign(Object.assign({ _usrmsg: { text: userMessage } }, this.api.getView(this.order)), { enableImgContextMenu: true }));
        });
    }
    availableTimes() {
        let shipmentHours = [];
        let oh = Math.round(this.order.shipmenthour - (this.order.shipmenthour % 100));
        let od = this.order.shipmentdate.setHours(oh);
        if (this.order.dispatcherType == 'banabikurye') {
            for (let i = 9; i < 20; i++) {
                let selected = true;
                if (helper_1.default.isToday(this.order.shipmentdate) && helper_1.default.Now().getHours() > i)
                    selected = false;
                shipmentHours.push({
                    hour: i * 100,
                    text: i.toString() + ':00',
                    selected: selected && (i * 100 == oh)
                });
                shipmentHours.push({
                    hour: i * 100 + 30,
                    text: i.toString() + ':30',
                    selected: selected && (i * 100 + 30 == oh)
                });
            }
        }
        else {
            let hours = shipment_1.ShipmentHours;
            Object.keys(hours).forEach(k => {
                shipmentHours.push({
                    hour: k,
                    text: hours[k],
                    selected: this.order.shipmenthour == parseInt(k)
                });
            });
        }
        return shipmentHours;
    }
    availableDays() {
        let res = {};
        let nextDay = helper_1.default.Now();
        for (let i = 0; i < 7; i++) {
            let text = i == 0 ? 'Bugün' : helper_1.default.formatDate(nextDay);
            res[nextDay.toDateString()] = text;
            nextDay = helper_1.default.NextDay(nextDay);
        }
        return res;
    }
    orderViewRoute() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.getOrder();
            if (!this.order)
                return this.next();
            yield this.getOrderSummary();
            let pageInfo = {};
            let pageTitle = '', pageDescription = '';
            pageTitle = `${this.order.butcherName} ${helper_1.default.formatDate(this.order.creationDate)} tarihli sipariş`;
            pageDescription = `KasaptanAl.com online siparişi`;
            let pageThumbnail = this.req.helper.imgUrl('butcher-google-photos', this.order.butcher.slug);
            pageInfo = {
                pageTitle: pageTitle,
                pageDescription: pageDescription,
                pageThumbnail: pageThumbnail
            };
            this.sendView("pages/manageorder.ejs", Object.assign(Object.assign(Object.assign({}, pageInfo), this.api.getView(this.order)), { enableImgContextMenu: true }));
        });
    }
    static SetRoutes(router) {
        router.get('/manageorder/:ordernum', Route.BindRequest(Route.prototype.orderViewRoute));
    }
}
__decorate([
    common_1.Auth.Anonymous(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], Route.prototype, "orderViewRoute", null);
exports.default = Route;
