import * as express from "express";
import { ViewRouter } from '../../lib/router';
import moment = require('moment');
import User from "../../db/models/user";
import UserRoute from "../api/user";
import { Order, OrderItem } from "../../db/models/order";
import { PermissionError } from "../../lib/http";
import * as _ from "lodash";


import  OrderApi from '../api/order';

export default class Route extends ViewRouter {

    user: User;

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


    async viewOrderDetails() {
        let api = new OrderApi(this.constructorParams);
        this.user = await User.findByPk(this.req.user.id);
        let order = await api.getOrder(this.req.params.orderid);
        let accounting = await api.getWorkingAccounts(order);

        this.render("pages/user.order.details.ejs", {...api.getView(order, accounting), ...{enableImgContextMenu: true} }   );
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
        router.get("/orders/:orderid", Route.BindRequest(Route.prototype.viewOrderDetails));
        router.get("/orders/:orderid/email", Route.BindRequest(Route.prototype.emailOrderDetails));
        router.get("/signoff", Route.BindRequest(Route.prototype.signoff));

    }
}

