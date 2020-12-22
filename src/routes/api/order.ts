import { Auth, ProductTypeFactory } from '../../lib/common';
import { ApiRouter } from '../../lib/router';
import * as express from "express";
import { ShopCard, firstOrderDiscount } from '../../models/shopcard';
import { Order, OrderItem } from '../../db/models/order';
import Area from '../../db/models/area';
import email from '../../lib/email';
import { Shipment, ShipmentHours } from '../../models/shipment';
import Dispatcher from '../../db/models/dispatcher';
import { Payment, PaymentTypeDesc } from '../../models/payment';
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
import { Creditcard, CreditcardPaymentFactory, PaymentTotal, PaymentRequest, PaymentResult } from '../../lib/payment/creditcard';
import { OrderPaymentStatus, OrderItemStatus, OrderSource, OrderType, DeliveryStatusDesc } from '../../models/order';
import config from '../../config';
import { ComissionHelper, PuanCalculator } from '../../lib/commissionHelper';
import { PuanResult, Puan } from '../../models/puan';
import { Op } from 'sequelize';
import { LogisticFactory } from '../../lib/logistic/core';
import { throws } from 'assert';
import User from '../../db/models/user';


const orderid = require('order-id')('dkfjsdklfjsdlkg450435034.,')

export default class Route extends ApiRouter {

    async getButcherPuanAccounts(o: Order) {
        let list = [
            Account.generateCode("musteri-kasap-kazanilan-puan", [o.userId, o.butcherid, o.ordernum])
        ]
        let accounts = await AccountModel.list(list);
        return accounts;
    }

    async getButcherPuanAccountsSummary(o: Order) {
        let list = [
            Account.generateCode("musteri-kasap-kazanilan-puan", [o.userId, o.butcherid, o.ordernum])
        ]
        let accounts = await AccountModel.summary(list);
        return accounts;
    }

    async fillButcherDebtAccounts(o: Order) {
        let list = [
            Account.generateCode("kasaplardan-alacaklar", [o.butcherid, 1, o.ordernum]),
            Account.generateCode("kasaplardan-alacaklar", [o.butcherid, 2, o.ordernum]),
            Account.generateCode("kasap-borc-tahakkuk", [1, o.butcherid, o.ordernum])
        ]
        let accounts = await AccountModel.list(list);
        o.butcherDeptAccounts = accounts;
        return accounts;

    }

    async fillButcherComissionAccounts(o: Order) {

        let list = [
            Account.generateCode("kasaplardan-kesilen-komisyonlar", [100, o.butcherid, o.ordernum]),
            Account.generateCode("kasaplardan-kesilen-komisyonlar", [200, o.butcherid, o.ordernum])
        ]

        let accounts = await AccountModel.list(list);
        o.butcherComissiomAccounts = accounts;
        return accounts;

    }

    async getKalittePuanAccounts(o: Order) {
        let list = [
            Account.generateCode("musteri-kalitte-kazanilan-puan", [o.userId, 1, o.ordernum]),
            Account.generateCode("musteri-kalitte-kazanilan-puan", [o.userId, 2, o.ordernum])
        ]
        let accounts = await AccountModel.list(list);
        return accounts;
    }

    async getKalittePuanAccountsSummary(o: Order) {
        let list = [
            Account.generateCode("musteri-kalitte-kazanilan-puan", [o.userId, 1, o.ordernum]),
            Account.generateCode("musteri-kalitte-kazanilan-puan", [o.userId, 2, o.ordernum])
        ]
        let accounts = await AccountModel.summary(list);
        return accounts;
    }


    async getWorkingAccounts(o: Order) {
        let list = [
            Account.generateCode("odeme-bekleyen-satislar", [o.userId, o.ordernum]),
            Account.generateCode("satis-indirimleri", [o.userId, o.ordernum])
        ]
        let accounts = await AccountModel.list(list);
        return accounts;
    }

    async getAccountsSummary(o: Order) {
        let list = [
            Account.generateCode("odeme-bekleyen-satislar", [o.userId, o.ordernum]),
            Account.generateCode("satis-indirimleri", [o.userId, o.ordernum])
        ]
        let accounts = await AccountModel.summary(list);
        return accounts;
    }

    calculatePaid(o: Order) {
        let codeCredit = Account.generateCode("odeme-bekleyen-satislar", [o.userId, o.ordernum, 500]);
        let codeManual = Account.generateCode("odeme-bekleyen-satislar", [o.userId, o.ordernum, 600]);
        let codePuan = Account.generateCode("odeme-bekleyen-satislar", [o.userId, o.ordernum, 1100]);
        let total = 0.00;
        o.workedAccounts.forEach(a => {
            if (a.code == codeCredit || a.code == codeManual || a.code == codePuan) total += a.borc;
        })
        return Helper.asCurrency(total);
    }

    calculateTeslimatOfButcher(o: Order) {
        let codeButcher = Account.generateCode("odeme-bekleyen-satislar", [o.userId, o.ordernum, 200]);
        let total = 0.00;
        o.workedAccounts.forEach(a => {
            if (a.code == codeButcher) total += a.alacak;
        })
        return Helper.asCurrency(total);
    }

    calculateTeslimatOfKasaptanAl(o: Order) {
        let codeKasaptanAl = Account.generateCode("odeme-bekleyen-satislar", [o.userId, o.ordernum, 201]);
        let total = 0.00;
        o.workedAccounts.forEach(a => {
            if (a.code == codeKasaptanAl) total += a.alacak;
        })
        return Helper.asCurrency(total);
    }


    calculateTeslimatTotal(o: Order) {
        let codeButcher = Account.generateCode("odeme-bekleyen-satislar", [o.userId, o.ordernum, 200]);
        let codeKasaptanAl = Account.generateCode("odeme-bekleyen-satislar", [o.userId, o.ordernum, 201]);
        let total = 0.00;
        o.workedAccounts.forEach(a => {
            if (a.code == codeButcher || a.code == codeKasaptanAl) total += a.alacak;
        })
        return Helper.asCurrency(total);
    }

    calculateProduct(o: Order) {
        let code = Account.generateCode("odeme-bekleyen-satislar", [o.userId, o.ordernum, 100]);
        let total = 0.00;
        o.workedAccounts.forEach(a => {
            if (a.code == code) total += a.alacak;
        })
        return Helper.asCurrency(total);
    }

    calculateUsedPuan(o: Order) {
        let code = Account.generateCode("odeme-bekleyen-satislar", [o.userId, o.ordernum, 1100]);
        let total = 0.00;
        o.workedAccounts.forEach(a => {
            if (a.code == code) total += a.borc;
        })
        return Helper.asCurrency(total);
    }

    async getOrders(where?: any) {
        let res = await Order.findAll({
            where: where,
            order: [['ID', 'DESC']],
            limit: 300,
            include: [{
                model: Butcher
            }, {
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
        return res;
    }

    arrangeKalittePuans(o: Order) {
        o.kalitteOnlyPuanAccounts = [];
        o.kalitteByButcherPuanAccounts = [];

        let kalitteCode = Account.generateCode("musteri-kalitte-kazanilan-puan", [o.userId, 1, o.ordernum]);
        let kalitteByButcherCode = Account.generateCode("musteri-kalitte-kazanilan-puan", [o.userId, 2, o.ordernum]);


        o.kalittePuanAccounts.forEach(a => {
            if (a.code == kalitteCode) {
                o.kalitteOnlyPuanAccounts.push(a);
            } else if (a.code == kalitteByButcherCode) {
                o.kalitteByButcherPuanAccounts.push(a)
            }
        })

        AccountModel.addTotals(o.kalitteOnlyPuanAccounts)
        AccountModel.addTotals(o.kalitteByButcherPuanAccounts)
    }

    async getOrder(num, checkFirst: boolean = false) {
        let order = await Order.findOne({
            where: {
                ordernum: num
            },
            include: [{
                model: Butcher
            }, {
                model: OrderItem,
                include: [{
                    model: Butcher,
                    all: true
                }, {
                    model: Product,
                    all: true
                }]
            }, {
                model: Dispatcher,
                all: true
            }]
        })
        order.workedAccounts = await this.getWorkingAccounts(order);
        order.butcherPuanAccounts = await this.getButcherPuanAccounts(order);
        order.kalittePuanAccounts = await this.getKalittePuanAccounts(order);
        this.arrangeKalittePuans(order);
        if (checkFirst) {
            order.isFirstButcherOrder = await Order.findOne({ where: { userid: order.userId, butcherid: order.butcherid, status: OrderItemStatus.success, ordernum: { [Op.ne]: order.ordernum } } }) == null;
            order.isFirstOrder = await Order.findOne({ where: { userid: order.userId } }) == null;
        }
        return order;
    }

    async completeOrderStatus(o: Order, newStatus: OrderItemStatus) {
        let res = db.getContext().transaction((t: Transaction) => {
            return this.changeOrderStatus(o, newStatus, t)
        })
        await res;
    }

    async changeOrderStatus(o: Order, newStatus: OrderItemStatus, t?: Transaction) {
        let promises = [], ops = [];
        if (o.status != newStatus) {
            if (newStatus.startsWith('iptal') && o.status.startsWith('iptal')) {

            } else {
                if (newStatus.startsWith('iptal')) {
                    let summary = await this.getAccountsSummary(o);
                    let balance = Helper.asCurrency(summary.alacak - summary.borc);
                    if (balance > 0.00) {
                        let op = new AccountingOperation(`${o.ordernum} iptali`);
                        op.accounts.push(new Account("odeme-bekleyen-satislar", [o.userId, o.ordernum]).dec(balance))
                        op.accounts.push(new Account("satis-alacaklari", [o.userId, o.ordernum]).dec(balance))
                        ops.push(op);
                    }
                    o.items.forEach(oi => {
                        if (!oi.status.startsWith('iptal')) {
                            oi.status = newStatus;
                            promises.push(oi.save({ transaction: t }))
                        }
                    })
                } else if (o.status.startsWith('iptal')) {

                } else {
                    o.items.forEach(oi => {
                        if (!oi.status.startsWith('iptal')) {
                            oi.status = newStatus;
                            promises.push(oi.save({ transaction: t }))
                        }
                    })
                }
            }
            await this.saveAccountingOperations(ops, t)
            o.status = newStatus;
            await o.save({ transaction: t })
        }
    }


    async completeOrderItemStatus(oi: OrderItem, newStatus: OrderItemStatus) {
        let res = db.getContext().transaction((t: Transaction) => {
            return this.changeOrderItemStatus(oi, newStatus, t)
        })
        await res;
    }


    changeOrderItemStatus(oi: OrderItem, newStatus: OrderItemStatus, t?: Transaction) {
        let promises = [], ops = [];
        if (oi.status != newStatus) {
            if (newStatus.startsWith('iptal') && oi.status.startsWith('iptal')) {

            } else {
                if (newStatus.startsWith('iptal')) {
                    let op = new AccountingOperation(`${oi.productName} ${newStatus}`);
                    op.accounts.push(new Account("odeme-bekleyen-satislar", [oi.order.userId, oi.order.ordernum]).dec(oi.price))
                    op.accounts.push(new Account("satis-alacaklari", [oi.order.userId, oi.order.ordernum]).dec(oi.price))
                    ops.push(op);
                } else if (oi.status.startsWith('iptal')) {
                    let op = new AccountingOperation(`${oi.productName} iptalin iptali`);
                    op.accounts.push(new Account("odeme-bekleyen-satislar", [oi.order.userId, oi.order.ordernum]).inc(oi.price))
                    op.accounts.push(new Account("satis-alacaklari", [oi.order.userId, oi.order.ordernum]).inc(oi.price))
                    ops.push(op);
                }
            }
            promises.push(this.saveAccountingOperations(ops, t))
            oi.status = newStatus;
            promises.push(oi.save({ transaction: t }))
        }
        return Promise.all(promises);
    }


    getView(order: Order) {

        let shipment = {};
        let payment = {};
        let butchers = {}

        order.items.forEach((item, i) => {
            let bi = item.butcher.id;

            let prodMan = ProductTypeFactory.create(item.productType, {});
            prodMan.loadFromOrderItem(item);


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
            items: order.items
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
                this.req.user.lastKat = card.address.kat;
                this.req.user.lastBina = card.address.bina;
                this.req.user.lastDaire = card.address.daire;
                this.req.user.lastLocation = card.address.geolocation;
                this.req.user.lastLocationType = card.address.geolocationType;
                this.req.user.lastTarif = card.address.addresstarif;
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
                    let op = new AccountingOperation(`${o.name} ${o.ordernum} siparişi ön provizyon ödeme işlemi`);
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

    async updateOrderByCreditcardPayment(o: Order, paymentInfo: PaymentResult, t?: Transaction) {
        let promises = [];
        o.paymentId = paymentInfo.paymentId;
        o.paymentType = "onlinepayment";
        o.status = OrderItemStatus.supplying;
        o.paymentTypeText = PaymentTypeDesc.onlinepayment;
        promises.push(o.save({
            transaction: t
        }));
        paymentInfo.itemTransactions.forEach(it => {
            if (it.itemId == o.ordernum) {
                o.paymentTransactionId = it.paymentTransactionId
                o.paidTotal = it.paidPrice;
                promises.push(o.save({ transaction: t }))
            }
        })
        return o.isNewRecord ? null : Promise.all(promises);
    }


    async completeCreditcardPayment(ol: Order[], paymentRequest: PaymentRequest, paymentInfo: PaymentResult) {
        let res = db.getContext().transaction((t: Transaction) => {
            return this.makeCreditcardPayment(ol, paymentRequest, paymentInfo, t)
        })
        await new Promise((resolve, reject) => {
            res.then((result) => {
                resolve(result)
            }).catch((err) => {
                reject(err);
            })
        })
    }

    async fillFirstOrderDetails(o: Order) {
        o.isFirstButcherOrder = await Order.findOne({ where: { userid: o.userId, butcherid: o.butcherid, status: OrderItemStatus.success, ordernum: { [Op.ne]: o.ordernum } } }) == null;
        o.isFirstOrder = await Order.findOne({ where: { userid: o.userId } }) == null;

    }

    async getUsablePuans(o: Order) {
        o.workedAccounts = o.workedAccounts.length == 0 ? this.generateInitialAccounting(o).accounts.map(a => AccountModel.fromAccount(a)) : o.workedAccounts;
        let user = (this.req.user && this.req.user.id == o.userId) ? this.req.user : null;
        if (!user) {
            user = await User.findByPk(o.userId);
            if (user) await user.loadPuanView();
        }
        if (user && user.usablePuans > 0) {
            let butcherShip = this.calculateTeslimatOfButcher(o)
            let kasaptanAlShip = this.calculateTeslimatOfKasaptanAl(o);
            let productPrice = this.calculateProduct(o);
            let puanAccounts = this.getEarnedPuanAccounts(o, productPrice);
            this.fillEarnedPuanAccounts(o, productPrice);

            let rate = o.getButcherRate("butcher");
            let fee = o.getButcherFee("butcher");
            let calc = new ComissionHelper(rate, fee);
            let totalFee = calc.calculateButcherComission(productPrice + butcherShip);
            let max = Helper.asCurrency(totalFee.kalitteFee * 0.80);

            return Math.min(user.usablePuans, max)
        } return 0.00;
    }


    getPossiblePuanGain(o: Order, total: number, includeAvailable: boolean = false): PuanResult[] {


        let calculator = new PuanCalculator();
        let result: PuanResult[] = [];

        // let firstOrder: Puan = {

        //     minPuanForUsage: 0.00,
        //     minSales: 0.00,
        //     name: 'ilk sipariş indirimi',
        //     rate: 0.00

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
                let earnedPuanb = calculator.calculateCustomerPuan(butcherPuan, total);
                if (earnedPuanb > 0.00 || includeAvailable) {
                    if (earnedPuanb == 0) {
                        result.push(
                            {
                                type: "butcher",
                                earned: earnedPuanb,
                                id: o.butcherid.toString(),
                                title: o.butcher.name + ' Kasap Kart™ programı',
                                desc: `${o.ordernum} nolu ${o.butcherName} sipariş Kasap Puan`,
                                based: butcherPuan
                            }
                        )
                    } else {
                        let toKalitteRatio = o.orderType == OrderType.kurban ? 1 : 0.0;
                        let toKalitte = Helper.asCurrency(earnedPuanb * toKalitteRatio);
                        let toButcher = Helper.asCurrency(earnedPuanb - toKalitte);
                        if (toButcher > 0.00) {
                            result.push(
                                {
                                    type: "butcher",
                                    earned: toButcher,
                                    id: o.butcherid.toString(),
                                    title: o.butcher.name + ' Kasap Kart™ programı',
                                    desc: `${o.ordernum} nolu ${o.butcherName} sipariş Kasap Puan`,
                                    based: butcherPuan
                                }
                            )
                        }
                        if (toKalitte > 0.00) {
                            result.push(
                                {
                                    type: "kalitte-by-butcher",
                                    earned: toKalitte,
                                    id: o.butcherid.toString(),
                                    title: `kasaptanAl.com Kasap Kart™ programı`,
                                    desc: `${o.ordernum} nolu ${o.butcherName} sipariş kasaptanAl.com Puan`,
                                    based: butcherPuan
                                }
                            )
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

        return result
    }


    getComissionAccounts(o: Order, total: number, kasaptanAlShip: number, usablePuan: number): AccountingOperation {
        let result: AccountingOperation = new AccountingOperation(`${o.ordernum} nolu ${o.butcherName} kasap komisyon hesabı`, o.ordernum);

        let butcherFee = o.getButcherComission(total, usablePuan);
        let earnedPuan = o.getPuanTotal(total);

        if (butcherFee)
            result.accounts.push(new Account("kasaplardan-kesilen-komisyonlar", [100, o.butcherid, o.ordernum], `${o.ordernum} nolu satış kasaptanal.com komisyonu`).inc(butcherFee))
        if (earnedPuan > 0.00) {
            result.accounts.push(new Account("kasaplardan-kesilen-komisyonlar", [200, o.butcherid, o.ordernum], `${o.ordernum} nolu müşteriye iletilen puan`).inc(earnedPuan))
        }
        if (kasaptanAlShip > 0.00) {
            result.accounts.push(new Account("banka", [300, o.ordernum], `${o.ordernum} nolu satış kasaptanal.com müşteriden alınan teslimat bedeli`).inc(kasaptanAlShip))
        }

        let income = butcherFee + earnedPuan + kasaptanAlShip;
        if (income)
            result.accounts.push(new Account("gelirler", [100, o.butcherid], `${o.ordernum} nolu ${o.butcherName} satış geliri`).inc(income))

        return result;
    }

    // getKasaptanAlShipAccounts(o: Order, total: number): AccountingOperation {
    //     let result: AccountingOperation = new AccountingOperation(`${o.ordernum} nolu tahsil edilen teslimat bedeli`);        

    //     result.accounts.push(new Account("banka", [300, o.ordernum], `${o.ordernum} nolu satış kasaptanal.com müşteriden alınan teslimat bedeli`).inc(butcherFee))
    //     result.accounts.push(new Account("gelirler", [100, o.ordernum], `${o.ordernum} nolu ${o.butcherName} satış geliri`).inc(butcherFee + puanTotal))

    //     return result;
    // }    

    getEarnedPuanAccounts(o: Order, total: number): AccountingOperation {

        let gains = this.getPossiblePuanGain(o, total);
        let result: AccountingOperation = new AccountingOperation(`${o.ordernum} nolu ${o.butcherName} siparişi puan kazancı`, o.ordernum);

        gains.forEach(pg => {
            if (pg.earned > 0.00) {
                if (pg.type == "butcher") {
                    result.accounts.push(new Account("kasap-puan-giderleri", [o.butcherid, o.userId, o.ordernum], pg.title).inc(pg.earned))
                    result.accounts.push(new Account("musteri-kasap-kazanilan-puan", [o.userId, o.butcherid, o.ordernum], pg.title).inc(pg.earned))
                }
                if (pg.type == "kalitte") {
                    result.accounts.push(new Account("kalitte-puan-giderleri", [o.userId, 1, o.ordernum], pg.title).inc(pg.earned))
                    result.accounts.push(new Account("musteri-kalitte-kazanilan-puan", [o.userId, 1, o.ordernum], pg.title).inc(pg.earned))
                }
                if (pg.type == "kalitte-by-butcher") {
                    result.accounts.push(new Account("kalitte-puan-giderleri", [o.userId, 2, o.ordernum], pg.title).inc(pg.earned))
                    result.accounts.push(new Account("musteri-kalitte-kazanilan-puan", [o.userId, 2, o.ordernum], pg.title).inc(pg.earned))
                }
            }
        })

        return result;


    }



    fillEarnedPuanAccounts(o: Order, paidPrice: number) {
        o.butcherPuanAccounts = [];
        o.kalittePuanAccounts = [];
        o.kalitteOnlyPuanAccounts = [];
        o.kalitteByButcherPuanAccounts = [];

        let accounts = this.getEarnedPuanAccounts(o, paidPrice).accounts;

        let butcherCode = Account.generateCode("musteri-kasap-kazanilan-puan", [o.userId, o.butcherid, o.ordernum]);
        let kalitteCode = Account.generateCode("musteri-kalitte-kazanilan-puan", [o.userId, 1, o.ordernum]);
        let kalitteByButcherCode = Account.generateCode("musteri-kalitte-kazanilan-puan", [o.userId, 2, o.ordernum]);

        accounts.forEach(a => {
            let acc = AccountModel.fromAccount(a);
            if (a.code == butcherCode) {
                o.butcherPuanAccounts.push(acc)
            } else if (a.code == kalitteCode) {
                o.kalittePuanAccounts.push(acc);
            } else if (a.code == kalitteByButcherCode) {
                o.kalittePuanAccounts.push(acc);
            }
        })

        this.arrangeKalittePuans(o);

        AccountModel.addTotals(o.butcherPuanAccounts)
        AccountModel.addTotals(o.kalittePuanAccounts)

    }

    getUsedPuanAccounts(o: Order, puan: number) {

        let result: AccountingOperation = new AccountingOperation(`${o.ordernum} nolu ${o.butcherName} siparişi puan kullanımı`, o.ordernum);
        if (puan > 0) {
            let acc1 = new Account("musteri-harcanan-puan", [o.userId, o.ordernum]).inc(puan);
            let acc2 = new Account("kullanilan-puanlar", [o.userId], `${o.ordernum} nolu sipariş puan kullanımı`).inc(puan);


            result.accounts.push(acc1);
            result.accounts.push(acc2);
        }

        result.validate();

        return result;

    }

    async getEarnedPuans(o: Order) {
        let puans = await AccountModel.summary([
            Account.generateCode("musteri-kalitte-kazanilan-puan", [o.userId, 1, o.ordernum]),
            Account.generateCode("musteri-kalitte-kazanilan-puan", [o.userId, 2, o.ordernum]),
            Account.generateCode("musteri-kasap-kazanilan-puan", [o.userId, o.butcherid, o.ordernum])
        ])
        return puans;
    }


    async completeManuelPayment(o: Order, total: number) {
        let res = db.getContext().transaction((t: Transaction) => {
            return this.makeManuelPayment(o, total, t)
        })
        await new Promise((resolve, reject) => {
            res.then((result) => {
                resolve(result)
            }).catch((err) => {
                reject(err);
            })
        })
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





    async updateButcherDebtAfterPayment(o: Order, paymentRequest: PaymentRequest, paymentInfo: PaymentResult, t?: Transaction) {
        let promises = [];

        for (let i = 0; i < paymentInfo.itemTransactions.length; i++) {
            let it = paymentInfo.itemTransactions[i];
            if (it.itemId == o.ordernum) {
                let req = paymentRequest.basketItems.find(pr => pr.id == o.ordernum);
                if (req.merchantDebtApplied) {
                    let result: AccountingOperation = new AccountingOperation(`${o.ordernum} nolu ${o.butcherName} siparişi düşülen borç`);
                    result.accounts.push(new Account("kasaplardan-alacaklar", [o.butcherid, 5], `${o.ordernum} nolu sipariş düşülen tutar`).dec(req.merchantDebtApplied))
                    result.accounts.push(new Account("kasap-borc-tahakkuk", [1, o.butcherid, o.ordernum], `${o.ordernum} nolu siparişten düşülen ödemesi`).dec(req.merchantDebtApplied))
                    promises = promises.concat(this.saveAccountingOperations([result], t))
                }
            }
        }
        return promises;
    }


    async completeManualPaymentDept(o: Order) {

        let res = db.getContext().transaction((t: Transaction) => {
            return this.createManualPaymentDept(o, t)
        })
        await res;
    }

    async createManualPaymentDept(o: Order, t?: Transaction) {
        await this.fillButcherComissionAccounts(o);
        let butcherDebtAcc = o.butcherComissiomAccounts.find(p => p.code == 'total');
        let butcherDebt = Helper.asCurrency(butcherDebtAcc.borc - butcherDebtAcc.alacak);

        let result: AccountingOperation = new AccountingOperation(`${o.ordernum} nolu ${o.butcherName} siparişi kasaptan alacak`);
        result.accounts.push(new Account("kasaplardan-alacaklar", [o.butcherid, 1, o.ordernum], `${o.ordernum} nolu siparişten doğan komisyon ve puan borcu`).inc(butcherDebt))
        result.accounts.push(new Account("kasap-borc-tahakkuk", [1, o.butcherid, o.ordernum], `${o.ordernum} nolu manuel ödemesi`).inc(Helper.asCurrency(butcherDebt)))
        return this.saveAccountingOperations([result], t)
    }



    async makeManuelPayment(o: Order, total: number, t?: Transaction): Promise<any> {
        let ops: AccountingOperation[] = [];
        let promises: Promise<any>[] = []

        let paymentId = "manuel";

        let usablePuan = Math.min(0.00, await this.getUsablePuans(o));

        let op = new AccountingOperation(`${o.ordernum} ödemesi - ${paymentId}`, o.ordernum);
        op.accounts.push(new Account("odeme-bekleyen-satislar", [o.userId, o.ordernum, 600], "kapıda ödeme").dec(total - usablePuan));
        if (usablePuan) {
            op.accounts.push(new Account("odeme-bekleyen-satislar", [o.userId, o.ordernum, 1100], "puan kullanımı").dec(usablePuan));

        }
        op.accounts.push(new Account("satis-alacaklari", [o.userId, o.ordernum]).dec(total));

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

        o.paidTotal = total;
        promises.push(o.save({
            transaction: t
        }))

        promises = promises.concat(this.saveAccountingOperations(ops, t));
        let res = await Promise.all(promises);

        this.sendPuanNotification(o);

        return res;
    }

    async sendPuanNotification(o: Order) {
        let puans = await this.getEarnedPuans(o);
        let total = puans.alacak - puans.borc;
        if (total > 0.00) {
            let text = `Tebrikler! KasaptanAl.com tercihiniz size ${Helper.formattedCurrency(total)} puan kazandirdi. Bir sonraki siparisinizde kullanmayi unutmayin`;
            Sms.send(o.phone, text, false, new SiteLogRoute(this.constructorParams));
        }
    }


    async makeCreditcardPayment(ol: Order[], paymentRequest: PaymentRequest, paymentInfo: PaymentResult, t?: Transaction): Promise<any> {

        let ops: AccountingOperation[] = [];
        let promises: Promise<any>[] = []

        for (let i = 0; i < ol.length; i++) {
            let o = ol[i];

            //let usablePuan = Math.min(o.requestedPuan, await this.getUsablePuans(o));
            let usablePuan = o.requestedPuan;

            let op = new AccountingOperation(`${o.ordernum} kredi kartı ödemesi - ${paymentInfo.paymentId}`, o.ordernum);
            if (o.orderSource == OrderSource.butcher) {
                op.accounts.push(new Account("odeme-bekleyen-satislar", [o.userId, o.ordernum, 1000]).dec(paymentInfo.paidPrice))
                op.accounts.push(new Account("satis-alacaklari", [o.userId, o.ordernum]).dec(paymentInfo.paidPrice))
                ops.push(op);
                promises = promises.concat(this.updateOrderByCreditcardPayment(o, paymentInfo, t));
            } else {

                op.accounts.push(new Account("odeme-bekleyen-satislar", [o.userId, o.ordernum, 500], "kart ödemesi").dec(paymentInfo.paidPrice));

                if (usablePuan) {
                    op.accounts.push(new Account("odeme-bekleyen-satislar", [o.userId, o.ordernum, 1100], "puan kullanımı").dec(usablePuan))
                }

                op.accounts.push(new Account("satis-alacaklari", [o.userId, o.ordernum]).dec(paymentInfo.paidPrice + usablePuan))
                ops.push(op);

                let butcherShip = this.calculateTeslimatOfButcher(o)
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

        let result = await Promise.all(promises);


        for (let i = 0; i < ol.length; i++) {
            let notifyMobilePhones = (ol[i].butcher.notifyMobilePhones || "").split(',');
            notifyMobilePhones.push('5531431988');
            notifyMobilePhones.push('5326274151');

            email.send(ol[i].email, "siparişinizin ödemesi yapıldı", "order.paid.ejs", this.getView(ol[i]));
            for (var p = 0; p < notifyMobilePhones.length; p++) {
                if (notifyMobilePhones[p].trim()) {
                    let payUrl = `${this.url}/manageorder/${ol[i].ordernum}`;
                    Sms.send(notifyMobilePhones[p].trim(), `${ol[i].butcherName} yeni siparis[${ol[i].name}]: ${Helper.formattedCurrency(paymentInfo.paidPrice)} online odeme yapildi. LUTFEN SIPARISI YANITLAYIN: ${payUrl} `, false, new SiteLogRoute(this.constructorParams))
                }
            }

            this.sendPuanNotification(ol[i]);
        }
        return result;
    }

    generateInitialAccounting(o: Order): AccountingOperation {
        let op = new AccountingOperation(`${o.ordernum} numaralı sipariş`, o.ordernum);
        if (o.orderSource == OrderSource.butcher) {
            op.accounts.push(new Account("odeme-bekleyen-satislar", [o.userId, o.ordernum, 500], "Sipariş Bedeli").inc(o.subTotal));
            op.accounts.push(new Account("satis-alacaklari", [o.userId, o.ordernum]).inc(o.total))
        } else {
            op.accounts.push(new Account("odeme-bekleyen-satislar", [o.userId, o.ordernum, 100], "Ürün Bedeli").inc(o.subTotal));
            if (o.shippingTotal > 0.00) {
                if (o.dispatcherType == "butcher" || o.dispatcherType == "butcher/auto") {
                    op.accounts.push(new Account("odeme-bekleyen-satislar", [o.userId, o.ordernum, 200], "Kasap Teslimat Bedeli").inc(o.shippingTotal));
                } else op.accounts.push(new Account("odeme-bekleyen-satislar", [o.userId, o.ordernum, 201], "KasaptanAl.com Teslimat Bedeli").inc(o.shippingTotal));
            }
            if (Math.abs(o.discountTotal) > 0.00) {
                op.accounts.push(new Account("satis-indirimleri", [o.userId, o.ordernum, 100], "Uygulanan İndirimler").inc(Math.abs(o.discountTotal)));

            }
            op.accounts.push(new Account("satis-alacaklari", [o.userId, o.ordernum]).inc(o.total))
        }


        op.validate()

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

    async getFromShopcard(card: ShopCard): Promise<Order[]> {
        let butchers = card.butchers;
        let groupid = orderid.generate();
        let l3 = await Area.findByPk(card.address.level3Id);
        let l2 = l3 ? await Area.findByPk(l3.parentid) : null;
        let orders = []

        // let payment = CreditcardPaymentFactory.getInstance();
        // let log = new SiteLogRoute(this.constructorParams);
        // payment.logger = log;

        for (var bi in butchers) {
            let order = await Order.fromShopcard(card, <any>bi);
            order.ordergroupnum = groupid;
            order.butcherid = parseInt(bi);
            order.butcher = await Butcher.findByPk(order.butcherid);
            order.butcherSelection = butchers[bi].userSelected ? "user" : "default";
            order.butcherName = butchers[bi].name;
            order.securityCode = `${butchers[bi].name[0]}-${Helper.getRandomInt(999) + 1000}`;
            order.userId = this.req.user ? this.req.user.id : 0;

            if (!order.userId) {
                order.isFirstButcherOrder = true;
                order.isFirstOrder = true;
            }
            order.areaLevel2Id = l2 && l2.id;
            order.areaLevel2Text = l2 && l2.name;
            orders.push(order);
        }

        return orders;
    }

    async createAsButcherOrder(o: Order): Promise<Order> {
        o.orderSource = "butcher";
        o.ordernum = orderid.generate();

        let result: Promise<any>[] = [];
        let res = db.getContext().transaction((t: Transaction) => {
            result.push(o.save({
                transaction: t
            }))
            let accOperation = this.generateInitialAccounting(o);
            result.push(this.saveAccountingOperations([accOperation], t))
            return Promise.all(result)
        })

        await res;

        return o;
    }

    async create(card: ShopCard): Promise<Order[]> {

        let result: Promise<any>[] = [];

        let orders = await this.getFromShopcard(card);

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

            let viewUrl = `${this.url}/user/orders/${order.ordernum}`;
            await email.send(dbOrder.email, "siparişinizi aldık", "order.started.ejs", view);
            await Sms.send(dbOrder.phone, `KasaptanAl.com ${dbOrder.butcherName} siparisinizi aldik, Teslimat kodu: ${order.securityCode}. ${order.paymentType == 'onlinepayment' ? 'Simdi odeme yapabilirsiniz' : 'Bilgi'}: ${viewUrl}`, false, new SiteLogRoute(this.constructorParams))
            if (order.paymentType != "onlinepayment") {
                let notifyMobilePhones = (order.butcher.notifyMobilePhones || "").split(',');
                notifyMobilePhones.push('5531431988');
                notifyMobilePhones.push('5326274151');
                for (var p = 0; p < notifyMobilePhones.length; p++) {
                    if (notifyMobilePhones[p].trim()) {
                        let manageUrl = `${this.url}/manageorder/${order.ordernum}`;
                        Sms.send(notifyMobilePhones[p].trim(), `${order.butcherName} yeni siparis [${order.name}]. LUTFEN SIPARISI YANITLAYIN: ${manageUrl} `, false, new SiteLogRoute(this.constructorParams))
                    }
                }
            }

            fres.push(dbOrder)
        }

        return fres;
    }


    async getOrderRoute() {
        let order = await this.getOrder(this.req.params.ordernum);

        if (!order) return this.next();
        let view = this.getView(order);
        this.res.send(view);
    }

    async requestDispatcher(o: Order) {

    }

    @Auth.Anonymous()
    async approveRoute() {
        let ordernum = this.req.params.ordernum;
        let order = await this.getOrder(ordernum, true);
        if (!order)
            return this.res.send(404);

        let newStatus = OrderItemStatus.shipping;
        order.status = OrderItemStatus.shipping;
        order.statusDesc ? null : (order.statusDesc = '')
        order.statusDesc += `\n- ${Helper.formatDate(Helper.Now(), true)}: ${order.status} -> ${newStatus}`
        await order.save()
        // if (config.nodeenv == 'production') {
        //     let notifyMobilePhones = [];
        //     notifyMobilePhones.push('5531431988');
        //     notifyMobilePhones.push('5326274151');
        //     let payUrl = `${this.url}/manageorder/${order.ordernum}`;
        //     let text =`${order.butcherName} teslim edeceğini iletti[${order.name}]. ${payUrl}`;
        //     await Sms.sendMultiple(notifyMobilePhones, text, false, new SiteLogRoute(this.constructorParams))    
        // }
        this.res.send(200);
    }

    async sendButcherNotifications(order: Order, text: string) {
        let notifyMobilePhones = (order.butcher.notifyMobilePhones || "").split(',');
        notifyMobilePhones.push('5531431988');
        notifyMobilePhones.push('5326274151');

        for (var p = 0; p < notifyMobilePhones.length; p++) {
            if (notifyMobilePhones[p].trim()) {
                await Sms.send(notifyMobilePhones[p].trim(), text, false, new SiteLogRoute(this.constructorParams))
            }
        }
    }

    async sendPlanNotifications(order: Order) {
        let notifyMobilePhones = (order.butcher.notifyMobilePhones || "").split(',');
        notifyMobilePhones.push('5531431988');
        notifyMobilePhones.push('5326274151');

        let manageUrl = `${this.url}/manageorder/${order.ordernum}`;
        let text = `${order.butcherName} musteriniz ${order.name} teslimat icin bilgilendirildi: ${order.shipmentStartText}. Siparis: ${manageUrl}`;


        await this.sendButcherNotifications(order, text)

        let customerText = `KasaptanAl.com siparisiniz icin ${order.butcherName} teslimat planlamasi yapti: ${order.shipmentStartText}. Kasap tel: ${order.butcher.phone}`
        await Sms.send(order.phone, customerText, false, new SiteLogRoute(this.constructorParams))
        email.send(order.email, `KasaptanAl.com ${order.butcherName} siparişiniz teslimat bilgisi`, "order.planed.ejs", this.getView(order));
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


    @Auth.Anonymous()
    async cancelDeliveryRoute() {
        let ordernum = this.req.params.ordernum;
        let order = await this.getOrder(ordernum, true);
        if (!order)
            return this.res.send(404);
        if (order.dispatcherType == 'banabikurye' && order.deliveryOrderId) {
            let provider = LogisticFactory.getInstance(order.dispatcherType, {
                dispatcher: await Dispatcher.findByPk(order.dispatcherid, {
                    include: [{
                        model: Butcher,
                        as: 'butcher',
                    }]
                })
            });
            provider.safeRequests = false;
            await provider.cancelOrder(order.deliveryOrderId);
            order.deliveryOrderId = null;
            await order.save();
        }
        this.res.send(200);
    }
    @Auth.Anonymous()
    async setDeliveryRoute() {
        let ordernum = this.req.params.ordernum;
        let order = await this.getOrder(ordernum, true);
        if (!order)
            return this.res.send(404);

        let hour = Number.parseInt(this.req.body.hour);
        let day = Helper.newDate(this.req.body.day);
        let shour = Math.round(hour / 100);
        let fHour = hour % 100;
        order.shipmentstart = Helper.newDate2(day.getFullYear(), day.getMonth(), day.getDate(), shour, fHour, 0);


        let max = new Date(order.shipmentstart); 
        max.setTime(max.getTime() + (4*60*60*1000));
        if (max < Helper.Now())
            throw new Error("Lütfen teslimat gün ve saatini kontrol edin, hatalı gözüküyor.")
        if (order.dispatcherType == 'banabikurye') {
            let provider = LogisticFactory.getInstance(order.dispatcherType, {
                dispatcher: await Dispatcher.findByPk(order.dispatcherid, {
                    include: [{
                        model: Butcher,
                        as: 'butcher',
                    }]
                })
            });
            provider.safeRequests = false;
            order.shipmentStartText = Helper.formatDate(order.shipmentstart, true) + ' kasap çıkış olarak kurye planlandı';
            let request = provider.orderFromOrder(order);
            try {
                let offer = await provider.createOrder(request);
                order.deliveryOrderId = offer.orderId;
                order.dispatcherFee = offer.totalFee;
            } catch (err) {
                throw err;
            }
        } else {
            order.shipmentStartText = `${Helper.formatDate(order.shipmentstart)} ${ShipmentHours[hour]}`
            order.statusDesc ? null : (order.statusDesc = '')
            order.statusDesc += `\n- ${Helper.formatDate(Helper.Now(), true)}: Teslimat ${order.shipmentStartText} olarak planlandı`
        }

        order.status = OrderItemStatus.shipping;
        order.deliveryStatus = 'planned';
        await order.save();
        await this.sendPlanNotifications(order);
        this.res.send(200);
    }



    @Auth.Anonymous()
    async bnbCallbackRoute() {
        let order: Order = null;

        if (this.req.body.event_type == "order_created" || this.req.body.event_type == "order_changed") {
            order = await this.getOrder(this.req.body.order.points[0].client_order_id, false);
            order.statusDesc ? null : (order.statusDesc = '')
            order.deliveryOrderId = this.req.body.order.order_id;

            if (this.req.body.order.status == 'available') {
                order.status = OrderItemStatus.shipping;
                order.deliveryStatus = order.deliveryStatus || 'planned';
                order.statusDesc += `\n- ${Helper.formatDate(Helper.Now(), true)}: kurye atama bekleniyor.`
            }

            if (this.req.body.order.status == 'new') {
                order.statusDesc += `\n- ${Helper.formatDate(Helper.Now(), true)}: teslimat talebi oluşturuldu.`;
                order.deliveryStatus = order.deliveryStatus || 'planned';
            }

            if (this.req.body.order.status == 'active') {
                order.status = OrderItemStatus.onway;
                order.statusDesc += `\n- ${Helper.formatDate(Helper.Now(), true)}: teslimat süreci başladı, yolda.`
                let notifyMobilePhones = (order.butcher.notifyMobilePhones || "").split(',');
                notifyMobilePhones.push('5531431988');
                notifyMobilePhones.push('5326274151');
                for (var p = 0; p < notifyMobilePhones.length; p++) {
                    if (notifyMobilePhones[p].trim()) {
                        let manageUrl = `${this.url}/manageorder/${order.ordernum}`;
                        Sms.send(notifyMobilePhones[p].trim(), `${order.butcherName} kurye yola cikti. Siparis[${order.name}]: ${manageUrl} `, false, new SiteLogRoute(this.constructorParams))
                    }
                }
                let userUrl = `${this.url}/orders/order/${order.ordernum}`;
                await Sms.send(order.phone, `Siparişiniz yola cikti. Bilgi: ${userUrl} `, false, new SiteLogRoute(this.constructorParams))
            }

            if (this.req.body.order.status == 'canceled') {
                order.statusDesc += `\n- ${Helper.formatDate(Helper.Now(), true)}: teslimat iptal edildi.`;
                order.deliveryStatus = "canceled";
                order.deliveryOrderId = null;
            }

            if (this.req.body.order.status == 'completed') {
                order.status = OrderItemStatus.success;
                order.statusDesc += `\n- ${Helper.formatDate(Helper.Now(), true)}: başarıyla teslim edildi`;

            }
            await order.save();
        } else if (this.req.body.event_type == "delivery_created" || this.req.body.event_type == "delivery_changed") {
            order = await this.getOrder(this.req.body.delivery.client_order_id, false);
            order.statusDesc ? null : (order.statusDesc = '');
            order.deliveryStatus = this.req.body.delivery.status;
            order.statusDesc += `\n- ${Helper.formatDate(Helper.Now(), true)}: teslimat şu aşamada: ${DeliveryStatusDesc[order.deliveryStatus] || ''}`;
            await order.save();
        }


        let log = new SiteLogRoute(this.constructorParams);
        let data = {
            logData: JSON.stringify(this.req.body),
            f1: order ? order.ordernum : undefined,
            status: this.req.body.event_type + '/' + (order ? order.deliveryStatus : ""),
            logtype: "BNB"
        }
        await log.log(data);
        this.res.send(200);
    }


    static SetRoutes(router: express.Router) {
        router.post('/order/:ordernum/approve', Route.BindRequest(Route.prototype.approveRoute))
        // router.post('/order/:ordernum/kuryeCagir', Route.BindRequest(Route.prototype.kuryeCagirRoute))
        router.post('/order/bnbCallback', Route.BindRequest(Route.prototype.bnbCallbackRoute))
        router.post('/order/:ordernum/setDelivery', Route.BindRequest(Route.prototype.setDeliveryRoute))
        router.post('/order/:ordernum/cancelDelivery', Route.BindRequest(Route.prototype.cancelDeliveryRoute))

        //router.get("/admin/order/:ordernum", Route.BindRequest(this.prototype.getOrderRoute));
    }
}


