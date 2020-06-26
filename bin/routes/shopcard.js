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
const butcher_1 = require("../db/models/butcher");
const moment = require("moment");
const common_1 = require("../lib/common");
const helper_1 = require("../lib/helper");
const area_1 = require("../db/models/area");
const shopcard_1 = require("../models/shopcard");
const shipment_1 = require("../models/shipment");
const payment_1 = require("../models/payment");
const dispatcher_1 = require("./api/dispatcher");
const order_1 = require("./api/order");
let ellipsis = require('text-ellipsis');
var MarkdownIt = require('markdown-it');
const commissionHelper_1 = require("../lib/commissionHelper");
class Route extends router_1.ViewRouter {
    constructor(reqp) {
        super(reqp);
        this.shipmentHours = shipment_1.ShipmentHours;
        this.shipmentDays = shipment_1.ShipmentDays;
        this.moment = moment;
        this.Shipment = shipment_1.Shipment;
        this.Butchers = null;
        this.mayEarnPuanTotal = 0.00;
        this.possiblePuanList = [];
        this.puanCalculator = new commissionHelper_1.PuanCalculator();
        this.orderapi = new order_1.default(this.constructorParams);
    }
    getOrderSummary() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.loadButchers();
            if (this.shopcard.items.length > 0) {
                let orders = yield this.orderapi.getFromShopcard(this.shopcard);
                for (var i = 0; i < orders.length; i++) {
                    let list = this.orderapi.getPossiblePuanGain(orders[i], this.shopcard.getButcherTotal(orders[i].butcherid), true);
                    this.possiblePuanList = this.possiblePuanList.concat(list);
                }
                this.possiblePuanList.forEach(pg => this.mayEarnPuanTotal += pg.earned);
                this.mayEarnPuanTotal = helper_1.default.asCurrency(this.mayEarnPuanTotal);
            }
        });
    }
    renderPage(page, userMessage) {
        userMessage = userMessage || {};
        this.sendView(page, Object.assign(Object.assign({}, userMessage), {
            shopcard: this.shopcard,
        }));
    }
    viewRoute() {
        return __awaiter(this, void 0, void 0, function* () {
            this.shopcard = yield shopcard_1.ShopCard.createFromRequest(this.req);
            yield this.getOrderSummary();
            this.renderPage(`pages/shopcard.ejs`);
        });
    }
    shipPossibleToday() {
        return Object.keys(this.Shipment.availableTimes()).length > 0;
    }
    savecardRoute() {
        return __awaiter(this, void 0, void 0, function* () {
            this.shopcard = yield shopcard_1.ShopCard.createFromRequest(this.req);
            this.shopcard.note = this.req.body["order-comments"] || "";
            // if (!this.shopcard.address.name) {
            //     this.shopcard.address.name = this.req.user.name;
            //     this.shopcard.address.email = this.req.user.email;
            //     this.shopcard.address.phone = this.req.user.mphone;
            // }
            yield this.setDispatcher();
            yield this.shopcard.saveToRequest(this.req);
            this.renderPage("pages/checkout.ship.ejs");
        });
    }
    adresViewRoute() {
        return __awaiter(this, void 0, void 0, function* () {
            this.shopcard = yield shopcard_1.ShopCard.createFromRequest(this.req);
            if (!this.shopcard.address.name) {
                this.shopcard.address.name = this.req.user.name;
                this.shopcard.address.email = this.req.user.email;
                this.shopcard.address.phone = this.req.user.mphone;
            }
            this.renderPage("pages/checkout.adres.ejs");
        });
    }
    getProductTypeManager(i) {
        let item = this.shopcard.items[i];
        let params = {};
        params = Object.assign(Object.assign({}, params), item.productTypeData);
        let result = common_1.ProductTypeFactory.create(item.product.productType, params);
        return result;
    }
    setDispatcher() {
        return __awaiter(this, void 0, void 0, function* () {
            let api = new dispatcher_1.default(this.constructorParams);
            for (let o in this.shopcard.shipment) {
                if (true) {
                    let dispatch = yield api.bestDispatcher(parseInt(o), {
                        level1Id: this.shopcard.address.level1Id,
                        level2Id: this.shopcard.address.level2Id,
                        level3Id: this.shopcard.address.level3Id
                    });
                    if (dispatch && !dispatch.takeOnly) {
                        this.shopcard.shipment[o].dispatcher = {
                            id: dispatch.id,
                            name: dispatch.name,
                            fee: dispatch.fee,
                            totalForFree: dispatch.totalForFree,
                            type: dispatch.type,
                            min: dispatch.min,
                            takeOnly: dispatch.takeOnly,
                            location: dispatch.butcher ? dispatch.butcher.location : null
                        };
                        if (dispatch.min > this.shopcard.butchers[o].subTotal) {
                            this.shopcard.shipment[o].howTo = 'ship';
                        }
                        else if (dispatch.takeOnly) {
                            this.shopcard.shipment[o].howTo = 'take';
                        }
                        else if (this.shopcard.shipment[o].howTo == 'unset') {
                            this.shopcard.shipment[o].howTo = 'ship';
                        }
                    }
                    else {
                        this.shopcard.shipment[o].dispatcher = null;
                        this.shopcard.shipment[o].howTo = 'take';
                    }
                }
            }
        });
    }
    saveadresTakeRoute() {
        return __awaiter(this, void 0, void 0, function* () {
            this.shopcard = yield shopcard_1.ShopCard.createFromRequest(this.req);
            this.shopcard.address.name = this.req.body.name;
            this.shopcard.address.email = this.req.body.email;
            this.shopcard.address.phone = this.req.body.phone;
            yield this.setDispatcher();
            yield this.shopcard.saveToRequest(this.req);
            yield this.getOrderSummary();
            this.renderPage("pages/checkout.payment.ejs");
        });
    }
    saveadresRoute() {
        return __awaiter(this, void 0, void 0, function* () {
            this.shopcard = yield shopcard_1.ShopCard.createFromRequest(this.req);
            this.shopcard.address.name = this.req.body.name;
            this.shopcard.address.email = this.req.body.email;
            this.shopcard.address.phone = this.req.body.phone;
            this.shopcard.address.adres = this.req.body.address;
            if (this.req.body.lat && this.req.body.long && (parseFloat(this.req.body.lat) > 0) && (parseFloat(this.req.body.long) > 0)) {
                this.shopcard.address.location = {
                    type: 'Point',
                    coordinates: [parseFloat(this.req.body.lat), parseFloat(this.req.body.long)]
                };
                this.shopcard.address.accuracy = parseFloat(this.req.body.accuracy);
            }
            else
                this.shopcard.address.location = null;
            // this.shopcard.address.level1Id = parseInt(this.req.body.ordercity);
            // this.shopcard.address.level3Id = parseInt(this.req.body.orderdistrict);
            // this.shopcard.address.level1Text = this.req.body.ordercitytext;
            // this.shopcard.address.level3Text = this.req.body.orderdistricttext;
            yield this.setDispatcher();
            yield this.shopcard.saveToRequest(this.req);
            yield this.getOrderSummary();
            this.renderPage("pages/checkout.payment.ejs");
        });
    }
    shipViewRoute() {
        return __awaiter(this, void 0, void 0, function* () {
            this.shopcard = yield shopcard_1.ShopCard.createFromRequest(this.req);
            yield this.setDispatcher();
            yield this.shopcard.saveToRequest(this.req);
            this.renderPage("pages/checkout.ship.ejs");
        });
    }
    saveshipRoute() {
        return __awaiter(this, void 0, void 0, function* () {
            this.shopcard = yield shopcard_1.ShopCard.createFromRequest(this.req);
            yield this.setDispatcher();
            let needAddress = false;
            for (let k in this.shopcard.butchers) {
                let butcher = this.shopcard.butchers[k];
                this.shopcard.shipment[k].type = this.req.body[`shipping-method${k}`];
                this.shopcard.shipment[k].dispatcher && (this.shopcard.shipment[k].howTo = this.req.body[`howto${k}`]);
                needAddress = !needAddress ? (this.shopcard.shipment[k].howTo == 'ship') : true;
                // this.shopcard.shipment[k].desc = ShipmentTypeDesc[this.shopcard.shipment[k].type];
                // this.shopcard.shipment[k].howToDesc = ShipmentHowToDesc[this.shopcard.shipment[k].howTo];
                this.shopcard.shipment[k].informMe = this.req.body[`informme${k}`] == 'on';
                if (this.shopcard.shipment[k].type == 'plan') {
                    this.shopcard.shipment[k].days = [this.req.body[`planday${k}`]];
                    this.shopcard.shipment[k].hours = [this.req.body[`plantime${k}`]];
                    this.shopcard.shipment[k].daysText = [shipment_1.Shipment.availableDays()[this.req.body[`planday${k}`]]];
                    this.shopcard.shipment[k].hoursText = [this.shipmentHours[parseInt(this.req.body[`plantime${k}`])]];
                }
                else if (this.shopcard.shipment[k].type == 'sameday') {
                    this.shopcard.shipment[k].days = [helper_1.default.Now().toDateString()];
                    this.shopcard.shipment[k].hours = [this.req.body[`samedaytime${k}`]];
                    this.shopcard.shipment[k].daysText = ['Bugün - ' + helper_1.default.formatDate(helper_1.default.Now())];
                    this.shopcard.shipment[k].hoursText = [this.shipmentHours[parseInt(this.req.body[`samedaytime${k}`])]];
                }
            }
            this.shopcard.calculateShippingCosts();
            if (needAddress && !this.shopcard.address.name) {
                this.shopcard.address.name = this.req.user.name;
                this.shopcard.address.email = this.req.user.email;
                this.shopcard.address.phone = this.req.user.mphone;
            }
            this.shopcard.address.adres = this.shopcard.address.adres || this.req.user.lastAddress;
            yield this.shopcard.saveToRequest(this.req);
            //this.renderPage("pages/checkout.adres.ejs")
            needAddress ? this.renderPage("pages/checkout.adres.ejs") : this.renderPage("pages/checkout.adres-take.ejs");
        });
    }
    loadButchers() {
        return __awaiter(this, void 0, void 0, function* () {
            this.Butchers = this.Butchers || (yield butcher_1.default.findAll({
                include: [{
                        model: area_1.default,
                        all: true,
                        as: "areaLevel1Id"
                    }], where: { id: Object.keys(this.shopcard.butchers) }
            }));
        });
    }
    paymentViewRoute() {
        return __awaiter(this, void 0, void 0, function* () {
            this.shopcard = yield shopcard_1.ShopCard.createFromRequest(this.req);
            yield this.getOrderSummary();
            this.renderPage("pages/checkout.payment.ejs");
        });
    }
    savepaymentRoute() {
        return __awaiter(this, void 0, void 0, function* () {
            this.shopcard = yield shopcard_1.ShopCard.createFromRequest(this.req);
            for (let k in this.shopcard.butchers) {
                let butcher = this.shopcard.butchers[k];
                this.shopcard.payment[k].type = this.req.body[`paymentmethod${k}`];
                this.shopcard.payment[k].desc = payment_1.PaymentTypeDesc[this.shopcard.payment[k].type];
                this.shopcard.shipment[k].nointeraction = this.req.body[`nointeraction${k}`] == "on";
            }
            this.shopcard.arrangeButchers();
            this.setDispatcher();
            this.shopcard.calculateShippingCosts();
            yield this.shopcard.saveToRequest(this.req);
            yield this.getOrderSummary();
            this.renderPage("pages/checkout.review.ejs");
        });
    }
    reviewViewRoute(userMessage) {
        return __awaiter(this, void 0, void 0, function* () {
            this.shopcard = yield shopcard_1.ShopCard.createFromRequest(this.req);
            this.shopcard.arrangeButchers();
            this.setDispatcher();
            this.shopcard.calculateShippingCosts();
            yield this.shopcard.saveToRequest(this.req);
            yield this.getOrderSummary();
            this.renderPage("pages/checkout.review.ejs", userMessage);
        });
    }
    savereviewRoute() {
        return __awaiter(this, void 0, void 0, function* () {
            this.shopcard = yield shopcard_1.ShopCard.createFromRequest(this.req);
            let creditCard = null;
            try {
                // if (this.shopcard.getPaymentTotal('onlinepayment') > 0) {
                //     creditCard = {
                //         cardHolderName: this.req.body.name,
                //         cardNumber: this.req.body.number,
                //         cvc: this.req.body.cvc,
                //         expireMonth: this.req.body.expiry.split('/')[0],
                //         expireYear: this.req.body.expiry.split('/')[1]
                //     }
                // }
                let api = new order_1.default(this.constructorParams);
                let orders = yield api.create(this.shopcard);
                yield shopcard_1.ShopCard.empty(this.req);
                // if (orders.length == 1 && orders[0].paymentType == 'onlinepayment') {
                //     this.res.redirect(`/user/orders/${orders[0].ordernum}?new=1`)
                // }
                // else 
                this.res.render("pages/checkout.complete.ejs", this.viewData({
                    orders: orders,
                }));
            }
            catch (err) {
                yield this.reviewViewRoute({ _usrmsg: { text: err.message || err.errorMessage } });
            }
        });
    }
    static SetRoutes(router) {
        router.get("/alisveris-sepetim", Route.BindRequest(Route.prototype.viewRoute));
        router.get("/alisveris-sepetim/adres", Route.BindRequest(Route.prototype.adresViewRoute));
        router.post("/alisveris-sepetim/savecard", Route.BindRequest(Route.prototype.savecardRoute));
        router.post("/alisveris-sepetim/saveadres", Route.BindRequest(Route.prototype.saveadresRoute));
        router.post("/alisveris-sepetim/saveadrestake", Route.BindRequest(Route.prototype.saveadresTakeRoute));
        router.get("/alisveris-sepetim/ship", Route.BindRequest(Route.prototype.shipViewRoute));
        router.post("/alisveris-sepetim/saveship", Route.BindRequest(Route.prototype.saveshipRoute));
        router.get("/alisveris-sepetim/payment", Route.BindRequest(Route.prototype.paymentViewRoute));
        router.post("/alisveris-sepetim/savepayment", Route.BindRequest(Route.prototype.savepaymentRoute));
        router.get("/alisveris-sepetim/review", Route.BindRequest(Route.prototype.reviewViewRoute));
        router.post("/alisveris-sepetim/savereview", Route.BindRequest(Route.prototype.savereviewRoute));
    }
}
__decorate([
    common_1.Auth.Anonymous(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], Route.prototype, "viewRoute", null);
exports.default = Route;
