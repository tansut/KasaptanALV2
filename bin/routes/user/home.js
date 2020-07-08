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
const user_1 = require("../../db/models/user");
const user_2 = require("../api/user");
const order_1 = require("../../db/models/order");
const order_2 = require("../api/order");
const accountmodel_1 = require("../../db/models/accountmodel");
const account_1 = require("../../models/account");
const helper_1 = require("../../lib/helper");
class Route extends router_1.ViewRouter {
    constructor() {
        super(...arguments);
        this.shouldBePaid = 0.00;
        this.earnedPuanButcher = 0.00;
        this.earnedPuanKalitte = 0.00;
        this.earnedPuanTotal = 0.00;
        this.mayEarnPuanTotal = 0.00;
        this.productTotal = 0.00;
        this.possiblePuanList = [];
        this.puanAccountsKalitte = [];
        this.puanAccountsButcher = [];
    }
    getOrderSummary() {
        return __awaiter(this, void 0, void 0, function* () {
            this.productTotal = this.api.calculateProduct(this.order);
            this.balance = this.order.workedAccounts.find(p => p.code == 'total');
            this.shouldBePaid = helper_1.default.asCurrency(this.balance.alacak - this.balance.borc);
            this.puanBalanceKalitte = this.order.kalittePuanAccounts.find(p => p.code == 'total');
            this.puanBalanceButcher = this.order.butcherPuanAccounts.find(p => p.code == 'total');
            this.earnedPuanKalitte = this.puanBalanceKalitte ? helper_1.default.asCurrency(this.puanBalanceKalitte.alacak - this.puanBalanceKalitte.borc) : 0.00;
            this.earnedPuanButcher = this.puanBalanceButcher ? helper_1.default.asCurrency(this.puanBalanceButcher.alacak - this.puanBalanceButcher.borc) : 0.00;
            this.earnedPuanTotal = helper_1.default.asCurrency(this.earnedPuanKalitte + this.earnedPuanButcher);
            if (this.shouldBePaid > 0) {
                this.possiblePuanList = this.api.getPossiblePuanGain(this.order, this.productTotal);
                this.possiblePuanList.forEach(pg => this.mayEarnPuanTotal += pg.earned);
                this.mayEarnPuanTotal = helper_1.default.asCurrency(this.mayEarnPuanTotal);
            }
        });
    }
    render(view, data) {
        data = data || {};
        data['user'] = this.user;
        this.res.render(view, this.viewData(data));
    }
    viewProfile() {
        return __awaiter(this, void 0, void 0, function* () {
            this.user = yield user_1.default.findByPk(this.req.user.id);
            this.render("pages/user.home.ejs");
        });
    }
    viewOrders() {
        return __awaiter(this, void 0, void 0, function* () {
            this.user = yield user_1.default.findByPk(this.req.user.id);
            let orders = yield order_1.Order.findAll({
                where: {
                    userid: this.req.user.id
                },
                order: [["updatedon", "DESC"]],
                include: [{
                        all: true
                    }]
            });
            this.render("pages/user.orders.ejs", {
                orders: orders
            });
        });
    }
    emailOrderDetails() {
        return __awaiter(this, void 0, void 0, function* () {
            let api = new order_2.default(this.constructorParams);
            let order = yield api.getOrder(this.req.params.orderid);
            this.render("email/order.started.ejs", api.getView(order));
        });
    }
    getUserSummary() {
        return __awaiter(this, void 0, void 0, function* () {
            this.puanAccountsKalitte = yield accountmodel_1.default.list([account_1.Account.generateCode("musteri-kalitte-kazanilan-puan", [this.user.id, 1]),
                account_1.Account.generateCode("musteri-kalitte-kazanilan-puan", [this.user.id, 2])]);
            this.puanAccountsButcher = yield accountmodel_1.default.list([account_1.Account.generateCode("musteri-kasap-kazanilan-puan", [this.user.id])]);
        });
    }
    viewOrderDetails() {
        return __awaiter(this, void 0, void 0, function* () {
            let api = this.api = new order_2.default(this.constructorParams);
            this.user = yield user_1.default.findByPk(this.req.user.id);
            let order = this.order = yield api.getOrder(this.req.params.orderid, true);
            yield this.getOrderSummary();
            this.render("pages/user.order.details.ejs", Object.assign(Object.assign({}, api.getView(order)), { enableImgContextMenu: true }));
        });
    }
    saveProfile() {
        return __awaiter(this, void 0, void 0, function* () {
            this.user = yield user_1.default.findByPk(this.req.user.id);
            this.user.name = this.req.body.name;
            yield this.user.save();
            this.render("pages/user.home.ejs");
        });
    }
    viewPassword() {
        return __awaiter(this, void 0, void 0, function* () {
            this.user = yield user_1.default.findByPk(this.req.user.id);
            this.render("pages/user.password.ejs");
        });
    }
    savePassword() {
        return __awaiter(this, void 0, void 0, function* () {
            this.user = yield user_1.default.findByPk(this.req.user.id);
            if (this.user.verifyPassword(this.req.body.oldpass)) {
                this.user.setPassword(this.req.body.newpass);
                yield this.user.save();
                this.render("pages/user.password.ejs", {
                    _usrmsg: {
                        type: 'success',
                        text: 'Şifreniz değiştirildi.'
                    }
                });
            }
            else {
                this.render("pages/user.password.ejs", {
                    _usrmsg: {
                        type: 'danger',
                        text: 'Geçersiz şifre'
                    }
                });
            }
        });
    }
    viewPuans() {
        return __awaiter(this, void 0, void 0, function* () {
            this.user = yield user_1.default.findByPk(this.req.user.id);
            yield this.getUserSummary();
            this.render("pages/user.puans.ejs");
        });
    }
    signoff() {
        return __awaiter(this, void 0, void 0, function* () {
            let userRoute = new user_2.default(this.constructorParams);
            userRoute.signOff();
            this.res.redirect("/");
        });
    }
    static SetRoutes(router) {
        router.get("/", Route.BindRequest(Route.prototype.viewProfile));
        router.get("/profile", Route.BindRequest(Route.prototype.viewProfile));
        router.get("/password", Route.BindRequest(Route.prototype.viewPassword));
        router.post("/password", Route.BindRequest(Route.prototype.savePassword));
        router.post("/profile", Route.BindRequest(Route.prototype.saveProfile));
        router.get("/orders", Route.BindRequest(Route.prototype.viewOrders));
        router.get("/puans", Route.BindRequest(Route.prototype.viewPuans));
        router.get("/orders/:orderid", Route.BindRequest(Route.prototype.viewOrderDetails));
        router.get("/orders/:orderid/email", Route.BindRequest(Route.prototype.emailOrderDetails));
        router.get("/signoff", Route.BindRequest(Route.prototype.signoff));
    }
}
exports.default = Route;
