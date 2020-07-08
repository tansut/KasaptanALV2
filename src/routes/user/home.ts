import * as express from "express";
import { ViewRouter } from '../../lib/router';
import moment = require('moment');
import User from "../../db/models/user";
import UserRoute from "../api/user";
import { Order, OrderItem } from "../../db/models/order";
import { PermissionError } from "../../lib/http";
import * as _ from "lodash";


import  OrderApi from '../api/order';
import AccountModel from "../../db/models/accountmodel";
import { Account } from "../../models/account";
import Helper from "../../lib/helper";
import { PuanCalculator } from "../../lib/commissionHelper";
import { PuanResult } from "../../models/puan";

export default class Route extends ViewRouter {
    order: Order;
    api: OrderApi;
    user: User;
    balance: AccountModel;
    shouldBePaid = 0.00;
    puanBalanceButcher: AccountModel;
    puanBalanceKalitte: AccountModel;
    earnedPuanButcher = 0.00;
    earnedPuanKalitte = 0.00;
    earnedPuanTotal = 0.00;
    mayEarnPuanTotal = 0.00;
    productTotal = 0.00;
    possiblePuanList: PuanResult[] = [];

    puanAccountsKalitte: AccountModel[] = []
    puanAccountsButcher: AccountModel[] = []

    async getOrderSummary() {        
        this.productTotal = this.api.calculateProduct(this.order);
        this.balance = this.order.workedAccounts.find(p=>p.code == 'total')
        this.shouldBePaid = Helper.asCurrency(this.balance.alacak - this.balance.borc);
        this.puanBalanceKalitte = this.order.kalittePuanAccounts.find(p=>p.code == 'total');  
        this.puanBalanceButcher = this.order.butcherPuanAccounts.find(p=>p.code == 'total');  
        this.earnedPuanKalitte = this.puanBalanceKalitte ? Helper.asCurrency(this.puanBalanceKalitte.alacak -   this.puanBalanceKalitte.borc):0.00
        this.earnedPuanButcher = this.puanBalanceButcher ? Helper.asCurrency(this.puanBalanceButcher.alacak -   this.puanBalanceButcher.borc):0.00
        this.earnedPuanTotal = Helper.asCurrency(this.earnedPuanKalitte + this.earnedPuanButcher)
        this.mayEarnPuanTotal = 0.00;
        if (this.shouldBePaid > 0) {
            this.possiblePuanList = this.api.getPossiblePuanGain(this.order, this.productTotal);
            this.possiblePuanList.forEach(pg=>this.mayEarnPuanTotal+=pg.earned)
            this.mayEarnPuanTotal = Helper.asCurrency(this.mayEarnPuanTotal)
        }
    }

    render(view, data?) {
        data = data || {}
        data['user'] = this.user;
        this.res.render(view, this.viewData(data))
    }

    async viewProfile() {
        this.user = await User.findByPk(this.req.user.id);
        this.render("pages/user.home.ejs");
    }

    async viewOrders() {
        this.user = await User.findByPk(this.req.user.id);
        let orders = await Order.findAll({
            where: {
                userid: this.req.user.id
            },
            order: [["updatedon", "DESC"]],
            include: [{
                all: true
            }]
        })
        this.render("pages/user.orders.ejs", {
            orders: orders
        });
    }

    async emailOrderDetails() {
        let api = new OrderApi(this.constructorParams);
        let order = await api.getOrder(this.req.params.orderid)
        this.render("email/order.started.ejs", api.getView(order));                            
    }



    
    async getUserSummary() {        
        
        this.puanAccountsKalitte = await AccountModel.list([Account.generateCode("musteri-kalitte-kazanilan-puan", [this.user.id, 1]),
        Account.generateCode("musteri-kalitte-kazanilan-puan", [this.user.id, 2])])
        this.puanAccountsButcher = await AccountModel.list([Account.generateCode("musteri-kasap-kazanilan-puan", [this.user.id])])
    }

    async viewOrderDetails() {
        let api = this.api = new OrderApi(this.constructorParams);
        this.user = await User.findByPk(this.req.user.id);
        let order = this.order = await api.getOrder(this.req.params.orderid, true);
        await this.getOrderSummary();
        this.render("pages/user.order.details.ejs", {...api.getView(order), ...{enableImgContextMenu: true} }   );
    }

    async saveProfile() {
        this.user = await User.findByPk(this.req.user.id);
        this.user.name = this.req.body.name;
        await this.user.save();
        this.render("pages/user.home.ejs")
    }

    async viewPassword() {
        this.user = await User.findByPk(this.req.user.id);
        this.render("pages/user.password.ejs");
    }

    async savePassword() {
        this.user = await User.findByPk(this.req.user.id);
        if (this.user.verifyPassword(this.req.body.oldpass)) {
            this.user.setPassword(this.req.body.newpass);
            await this.user.save();
            this.render("pages/user.password.ejs", {
                _usrmsg: {
                    type: 'success',
                    text: 'Şifreniz değiştirildi.'
                }
            })
        } else {
            this.render("pages/user.password.ejs", {
                _usrmsg: {
                    type: 'danger',
                    text: 'Geçersiz şifre'
                }
            })
        }

    }

    async viewPuans() {
        this.user = await User.findByPk(this.req.user.id);
        await this.getUserSummary();
        this.render("pages/user.puans.ejs");
    }


    async signoff() {
        let userRoute = new UserRoute(this.constructorParams);
        userRoute.signOff();
        this.res.redirect("/");
    }

    static SetRoutes(router: express.Router) {
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

