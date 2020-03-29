import { Auth } from '../../lib/common';
import { ApiRouter } from '../../lib/router';
import * as express from "express";
import { ShopCard } from '../../models/shopcard';
import { Order, OrderItem } from '../../db/models/order';
import Area from '../../db/models/area';
import email from '../../lib/email';
import { Shipment } from '../../models/shipment';
import Dispatcher from '../../db/models/dispatcher';
import { Payment } from '../../models/payment';
import Butcher from '../../db/models/butcher';
import AccountModel from '../../db/models/accountmodel';
import Product from '../../db/models/product';
import OrderApi from '../api/order';
import SiteLogRoute from '../api/sitelog';
import { Transaction, or } from "sequelize";
import db from "../../db/context";
import { Sms } from '../../lib/sms';
import { AccountingOperation, Account } from '../../models/account';
import Helper from '../../lib/helper';
import { Creditcard, CreditcardPaymentFactory, PaymentTotal } from '../../lib/payment/creditcard';
import { OrderPaymentStatus } from '../../models/order';
const orderid = require('order-id')('dkfjsdklfjsdlkg450435034.,')

export default class Route extends ApiRouter {

    async getWorkingAccounts(o: Order) {
        let list = [
            Account.generateCode("odeme-bekleyen-satislar", [o.userId, o.ordernum])
        ]
        // let summary = await AccountModel.summary(
        //     [Account.generateCode("odeme-bekleyen-satislar", [this.order.userId, this.order.ordernum])]);
        let accounts = await AccountModel.list(list);
        return accounts;
    }


    async getOrder(num) {
        let order = await Order.findOne({
            where: {
                ordernum: num
            },
            include: [{
                model: OrderItem,
                include: [{
                    model: Butcher,
                    all: true
                }, {
                    model: Product,
                    all: true
                }]
            }]
        })
        return order;
    }


    getView(order: Order, accounting: AccountModel [] = null) {

        let shipment = {};
        let payment = {};
        let butchers = {}

        order.items.forEach((item, i) => {
            let bi = item.butcher.id
            if (!butchers[bi]) {
                butchers[bi] = item.butcher;
                butchers[bi].products = [i];
                butchers[bi].subTotal = item.butcherSubTotal;
                butchers[bi].total = item.butcherTotal;
                butchers[bi].discountTotal = item.discountTotal;
                butchers[bi].shippingTotal = item.shippingTotal;
            } else {
                butchers[bi].products.push(i);
            }
            if (!shipment[bi])
                shipment[bi] = Object.assign(new Shipment(), {
                    howTo: item.shipmentHowTo,
                    type: item.shipmentType,
                    days: [item.shipmentdate ? item.shipmentdate.toDateString() : ''],
                    hours: [item.shipmenthour],
                    informMe: item.shipmentInformMe,
                    daysText: [[item.shipmentdate ? item.shipmentdate.toDateString() : '']],
                    hoursText: [item.shipmenthourText],
                });
            if (item.dispatcherid) {
                shipment[bi].dispatcher = Object.assign(new Dispatcher(), {
                    id: item.dispatcherid,
                    type: item.dispatcherType,
                    name: item.dispatcherName,
                    fee: item.dispatcherFee,
                    location: order.dispatcherLocation,
                    totalForFree: item.dispatchertotalForFree
                })
            }

            if (!payment[bi])
                payment[bi] = Object.assign(new Payment(), {
                    type: item.paymentType,
                    desc: item.paymentTypeText
                });
        })


        return {
            order: order,
            butchers: butchers,
            shipment: shipment,
            payment: payment,
            items: order.items,
            accounting: accounting || null
        }
    }



    createOrder(t: Transaction, order: Order, card: ShopCard): Promise<any> {

        return order.save({
            transaction: t
        }).then((order) => {
            let promises = [];
            let butcher = card.butchers[order.butcherid];

            butcher.products.forEach((pi, i) => {
                let item = card.items[pi];
                let oi = OrderItem.fromShopcardItem(card, item);
                oi.orderid = order.id;
                promises.push(oi.save({
                    transaction: t
                }))
            })

            if (card.address.saveaddress) {
                this.req.user.lastAddress = card.address.adres;
                promises.push(this.req.user.save())
            }
            return Promise.all(promises);
        }).then((orderItems) => {
            let promises = []
            orderItems.forEach(oi => {
                if (oi.dispatcherid) {
                    promises.push(Dispatcher.update({
                        lastorderitemid: oi.id
                    }, {
                        transaction: t,
                        where: {
                            id: oi.dispatcherid
                        }
                    }))
                }
            })

            return Promise.all(promises)
        })
    }

    async getPreAccountingOperations(ol: Order[], paymentInfo: PaymentTotal): Promise<AccountingOperation[]> {
        let result: AccountingOperation[] = [];

        if (paymentInfo) {
            let remaining = paymentInfo.paid;
            for (let i = 0; i < ol.length; i++) {
                let o = ol[i];
                let total = Helper.asCurrency(o.total);
                remaining = Helper.asCurrency(remaining - total);
                if (remaining >= 0.00) {
                    let op = new AccountingOperation(`${o.name} ${o.ordernum} siparişi ön provizyon ödeme işlemi`, o.ordernum);
                    op.accounts.push(new Account("kredi-karti-provizyon", [o.userId, o.ordernum, paymentInfo.paymentId]).inc(total))
                    op.accounts.push(new Account("havuz-hesabi", [o.userId, o.ordernum, paymentInfo.paymentId]).inc(total))
                    op.validate()
                    result.push(op);
                }
            }
        }
        return result;
    }

    async saveAccountingOperations(ops: AccountingOperation[], t?: Transaction) {
        let result: Promise<any>[] = [];
        if (t) {
            for (var i = 0; i < ops.length; i++) {
                ops[i].validate()
                result.push(AccountModel.saveOperation(ops[i], {
                    transaction: t
                }))
            }
            return Promise.all(result)            
        } else {
            let res = db.getContext().transaction((t: Transaction) => {
                for (var i = 0; i < ops.length; i++) {
                    ops[i].validate()
                    result.push(AccountModel.saveOperation(ops[i], {
                        transaction: t
                    }))
                }
                return Promise.all(result)
            })
            await res;
        }
    }

    async makeCreditcardPayment(ol: Order[], paymentInfo: PaymentTotal, t?: Transaction) {

        let result: AccountingOperation[] = [];
        
        for (let i = 0; i < ol.length; i++) {
            let o = ol[i];
            let total = Helper.asCurrency(o.total);
            let op = new AccountingOperation(`${o.ordernum} kredi kartı ödemesi`, o.ordernum);
            op.accounts.push(new Account("odeme-bekleyen-satislar", [o.userId, o.ordernum]).dec(paymentInfo.paid))
            op.accounts.push(new Account("satis-alacaklari", [o.userId, o.ordernum]).dec(paymentInfo.paid))            
            result.push(op)            
        }

        await this.saveAccountingOperations(result, t);
        for (let i = 0; i < ol.length; i++) {
        await email.send(ol[i].email, "siparişinizin ödemesi yapıldı", "order.paid.ejs", this.getView(ol[i]));
        }


    }

    generateInitialAccounting(o: Order): AccountingOperation {

        let total = Helper.asCurrency(o.total);

        let op = new AccountingOperation(`${o.ordernum} numaralı sipariş`, o.ordernum);

        op.accounts.push(new Account("odeme-bekleyen-satislar", [o.userId, o.ordernum]).inc(total))
        op.accounts.push(new Account("satis-alacaklari", [o.userId, o.ordernum]).inc(total))

        op.validate()

        return op;

        return;

        op.accounts.push(new Account("kredi-karti-provizyon", [o.userId, o.ordernum]).inc(total))
        op.accounts.push(new Account("havuz-hesabi", [o.userId, o.ordernum]).inc(total))


        let kasapKarOran = 0.10;
        let kasapPuanOran = 0.2;
        let odemeSirketiKomisyonOran = 0.032;
        let kalittePuanOran = 0.00;


        let musteriIadeToplam = Helper.asCurrency(total * 0.05);
        let gerceklesenSatisToplam = Helper.asCurrency(total - musteriIadeToplam);

        let kasapSatisToplam = Helper.asCurrency(gerceklesenSatisToplam * (1.00 - kasapKarOran));
        let kasapPuanToplam = Helper.asCurrency(gerceklesenSatisToplam * kasapPuanOran);
        let kasapUrunToplam = Helper.asCurrency(kasapSatisToplam - kasapPuanToplam);

        let kalittePuanToplam = Helper.asCurrency(gerceklesenSatisToplam * kalittePuanOran);
        let odemeSirketiKomisyonToplam = Helper.asCurrency(gerceklesenSatisToplam * odemeSirketiKomisyonOran);

        let netKar = Helper.asCurrency(gerceklesenSatisToplam - kalittePuanToplam - kasapPuanToplam - kasapUrunToplam - odemeSirketiKomisyonToplam);


        op.accounts.push(new Account("kredi-karti-provizyon", [o.userId, o.ordernum]).dec(gerceklesenSatisToplam))
        op.accounts.push(new Account("havuz-hesabi", [o.userId, o.ordernum]).dec(total))
        op.accounts.push(new Account("kredi-karti-provizyon-iade", [o.userId, o.ordernum]).inc(musteriIadeToplam))

        op.accounts.push(new Account("kredi-karti-odemeleri", [o.userId, o.ordernum]).inc(gerceklesenSatisToplam))
        op.accounts.push(new Account("banka", [o.userId, o.ordernum]).inc(netKar))

        op.accounts.push(new Account("kasap-puan-giderleri", [o.userId, o.ordernum]).inc(kasapPuanToplam))
        op.accounts.push(new Account("kasap-urun-giderleri", [o.userId, o.ordernum]).inc(kasapUrunToplam))
        kalittePuanToplam > 0 ? op.accounts.push(new Account("kalitte-puan-giderleri", [o.userId, o.ordernum]).inc(kalittePuanToplam)) : null;
        op.accounts.push(new Account("odeme-sirketi-giderleri", [o.userId, o.ordernum]).inc(odemeSirketiKomisyonToplam))



        op.validate()

        return op;
    }


    async create(card: ShopCard, paymentInfo: PaymentTotal): Promise<Order[]> {

        let butchers = card.butchers;
        let groupid = orderid.generate();
        let l3 = await Area.findByPk(card.address.level3Id);
        let l2 = await Area.findByPk(l3.parentid);
        let result: Promise<any>[] = [];
        let orders = []

        let payment = CreditcardPaymentFactory.getInstance();
        let log = new SiteLogRoute(this.constructorParams);
        payment.logger = log;

        for (var bi in butchers) {
            let order = Order.fromShopcard(card, <any>bi);
            order.ordergroupnum = groupid;
            order.butcherid = parseInt(bi);
            order.butcherName = butchers[bi].name;
            order.userId = this.req.user.id;
            order.areaLevel2Id = l2.id;
            order.areaLevel2Text = l2.name;
            if (order.paymentType == 'onlinepayment') {
                order.paymentStatus = OrderPaymentStatus.waitingOnlinePayment
            } else order.paymentStatus = OrderPaymentStatus.manualPayment;
            orders.push(order);
        }

        let res = db.getContext().transaction((t: Transaction) => {
            for (var i = 0; i < orders.length; i++) {
                let dbOrder = this.createOrder(t, orders[i], card);
                let accOperation = this.generateInitialAccounting(orders[i]);
                result.push(dbOrder);
                result.push(AccountModel.saveOperation(accOperation, {
                    transaction: t
                }))
            }
            return Promise.all(result)
        })

        await res;
        let fres = []
        for (var oi = 0; oi < orders.length; oi++) {
            let order = orders[oi];
            let api = new OrderApi(this.constructorParams);
            let dbOrder = await api.getOrder(order.ordernum);
            let view = this.getView(dbOrder);
            await email.send(dbOrder.email, "siparişinizi aldık", "order.started.ejs", view);
            await Sms.send(dbOrder.phone, 'kasaptanAl.com siparisinizi aldik, destek tel/whatsapp: 08503054216. Urunleriniz hazir oldugunda sizi bilgilendirecegiz.', false, new SiteLogRoute(this.constructorParams))             
            fres.push(dbOrder)
        }

        return fres;
    }


    static SetRoutes(router: express.Router) {
        //router.get("/search", Route.BindRequest(this.prototype.searchRoute));
    }
}


