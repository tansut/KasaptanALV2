import { Auth } from '../../lib/common';
import { ApiRouter } from '../../lib/router';
import * as express from "express";
import { ShopCard, firstOrderDiscount } from '../../models/shopcard';
import { Order, OrderItem } from '../../db/models/order';
import Area from '../../db/models/area';
import email from '../../lib/email';
import { Shipment } from '../../models/shipment';
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
import { OrderPaymentStatus, OrderItemStatus } from '../../models/order';
import config from '../../config';
import { PuanCalculator } from '../../lib/commissionHelper';
import { PuanResult, Puan } from '../../models/puan';
import { Op } from 'sequelize';


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
        let total = 0.00;
        o.workedAccounts.forEach(a=> {
            if (a.code == codeCredit || a.code == codeManual) total+=a.borc;
        })
        return Helper.asCurrency(total);       
    }    






    calculateTeslimat(o: Order) {
        let code = Account.generateCode("odeme-bekleyen-satislar", [o.userId, o.ordernum, 200]);
        let total = 0.00;
        o.workedAccounts.forEach(a=> {
            if (a.code == code) total+=a.alacak;
        })
        return Helper.asCurrency(total);       
    }

    calculateProduct(o: Order) {
        let code = Account.generateCode("odeme-bekleyen-satislar", [o.userId, o.ordernum, 100]);
        let total = 0.00;
        o.workedAccounts.forEach(a=> {
            if (a.code == code) total+=a.alacak;
        })
        return Helper.asCurrency(total);       
    }    

    async getOrders(where?: any) {
        let res = await Order.findAll({
            where: where,
            order: [['ID', 'DESC']],
            limit: 100,
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
        o.paymentTypeText = PaymentTypeDesc.onlinepayment;
        promises.push(o.save({
            transaction: t
        }));
        paymentInfo.itemTransactions.forEach(it => {
            // let oi = o.items.find(p => p.orderitemnum == it.itemId);
            // if (oi) {
            //     oi.paymentTransactionId = it.paymentTransactionId
            //     oi.paidPrice = it.paidPrice;
            //     promises.push(oi.save({ transaction: t }))
            // }
            if (it.itemId == o.ordernum) {
                o.paymentTransactionId = it.paymentTransactionId
                o.paidTotal = it.paidPrice;
                promises.push(o.save({ transaction: t }))
            }
        })
        return o.isNewRecord ? null : Promise.all(promises);
    }

    async completeManualPaymentDept(o: Order, customerPuan: number, butcherDebt: number) {
        let res = db.getContext().transaction((t: Transaction) => {
            return this.createManualPaymentDept(o, customerPuan, butcherDebt)
        })     
        await res;   
    }    

    async createManualPaymentDept(o: Order, customerPuan: number, butcherDebt: number, t?: Transaction) {
        // let puan = this.getPossiblePuanGain(o, total);
        // let calc = new ComissionHelper(this.order.butcher.commissionRate, this.order.butcher.commissionFee);
        // this.butcherFee = calc.calculateButcherComission(this.paid);   
        
        let result: AccountingOperation = new AccountingOperation(`${o.ordernum} nolu ${o.butcherName} siparişi kasaptan alacak`);
        result.accounts.push(new Account("kasaplardan-alacaklar", [o.butcherid, 1, o.ordernum], `${o.ordernum} nolu sipariş komisyonu`).inc(butcherDebt))
        result.accounts.push(new Account("kasaplardan-alacaklar", [o.butcherid, 2, o.ordernum], `${o.ordernum} nolu sipariş müşteriye iletilen`).inc(customerPuan))
        result.accounts.push(new Account("kasap-borc-tahakkuk", [1, o.butcherid, o.ordernum], `${o.ordernum} nolu sipariş ödemesi`).inc(Helper.asCurrency(butcherDebt + customerPuan)))
        return this.saveAccountingOperations([result], t)
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


    getPossiblePuanGain(o: Order, total: number, includeAvailable: boolean = false): PuanResult[] {
        let calculator = new PuanCalculator();
        let result: PuanResult[] = [];

        let firstOrder: Puan = {

            minPuanForUsage: 0.00,
            minSales: 0.00,
            name: 'ilk sipariş indirimi',
            rate: 0.03

        }

        if (o.butcher.enableCreditCard) {
            if (o.isFirstButcherOrder) {
                let firstOrderPuan = calculator.calculateCustomerPuan(firstOrder, total);
                if (firstOrderPuan > 0.00 || includeAvailable) {
                    result.push({
                        type: "kalitte-by-butcher",
                        earned: firstOrderPuan,
                        id: o.butcherid.toString(),
                        title: `Kasap Kart™ programı ilk sipariş puanı`,
                        desc: `${o.ordernum} nolu ${o.butcherName} siparişi kasaptanAl.com Puan`,
                        based: firstOrder
                    })
                }
            }

            if (o.butcher.enablePuan) {
                let butcherPuan = o.butcher.getPuanData()
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
                        let toKalitte = Helper.asCurrency(earnedPuanb * 0.2);
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


    getPuanAccounts(o: Order, total: number): AccountingOperation {

        let gains = this.getPossiblePuanGain(o, total);
        let result: AccountingOperation = new AccountingOperation(`${o.ordernum} nolu ${o.butcherName} siparişi puan kazancı`);

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

    fillPuanAccounts(o: Order, paidPrice: number) {
        o.butcherPuanAccounts = [];
        o.kalittePuanAccounts = [];
        o.kalitteOnlyPuanAccounts = [];
        o.kalitteByButcherPuanAccounts = [];

        let accounts = this.getPuanAccounts(o, paidPrice).accounts;

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

    async loadPuan(o: Order, total: number, t?: Transaction): Promise<any> {
        let ops: AccountingOperation[] = [];
        let promises: Promise<any>[] = [];
        let puanAccounts = this.getPuanAccounts(o, total);
        ops.push(puanAccounts);
        promises = promises.concat(this.saveAccountingOperations(ops, t));
        return Promise.all(promises)
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


    async completeLoadPuan(o: Order, total: number) {
        let res = db.getContext().transaction((t: Transaction) => {
            return this.loadPuan(o, total, t)
        })
        await new Promise((resolve, reject) => {
            res.then((result) => {
                resolve(result)
            }).catch((err) => {
                reject(err);
            })
        })
    }


    async makeManuelPayment(o: Order, total: number, t?: Transaction): Promise<any> {

        let ops: AccountingOperation[] = [];
        let promises: Promise<any>[] = []

        let paymentId = "manuel";

        let op = new AccountingOperation(`${o.ordernum} ödemesi - ${paymentId}`);
        op.accounts.push(new Account("odeme-bekleyen-satislar", [o.userId, o.ordernum, 600]).dec(total))
        op.accounts.push(new Account("satis-alacaklari", [o.userId, o.ordernum]).dec(total))
        ops.push(op);
        o.paidTotal = total;
        promises.push(o.save({
            transaction: t
        }))

        promises = promises.concat(this.saveAccountingOperations(ops, t));
        return Promise.all(promises)
    }


    async updateButcherDebtAfterPayment(o: Order, paymentRequest: PaymentRequest, paymentInfo: PaymentResult, t?: Transaction) {
        let promises = [];

        for(let i = 0; i < paymentInfo.itemTransactions.length;i++) {
            let it = paymentInfo.itemTransactions[i];
            if (it.itemId == o.ordernum) {
                let req = paymentRequest.basketItems.find(pr=>pr.id == o.ordernum);
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


    async makeCreditcardPayment(ol: Order[], paymentRequest: PaymentRequest, paymentInfo: PaymentResult, t?: Transaction): Promise<any> {

        let ops: AccountingOperation[] = [];
        let promises: Promise<any>[] = []

        for (let i = 0; i < ol.length; i++) {
            let o = ol[i];
            let op = new AccountingOperation(`${o.ordernum} kredi kartı ödemesi - ${paymentInfo.paymentId}`);
            op.accounts.push(new Account("odeme-bekleyen-satislar", [o.userId, o.ordernum, 500]).dec(paymentInfo.paidPrice))
            op.accounts.push(new Account("satis-alacaklari", [o.userId, o.ordernum]).dec(paymentInfo.paidPrice))
            ops.push(op);
            let puanAccounts = this.getPuanAccounts(o, paymentInfo.paidPrice)
            ops.push(puanAccounts);
            promises = promises.concat(this.updateOrderByCreditcardPayment(o, paymentInfo, t));
            promises = promises.concat(this.updateButcherDebtAfterPayment(o, paymentRequest, paymentInfo, t));

        }

        promises = promises.concat(this.saveAccountingOperations(ops, t));

        for (let i = 0; i < ol.length; i++) {
            if (config.nodeenv == 'production') {
                email.send(ol[i].email, "siparişinizin ödemesi yapıldı", "order.paid.ejs", this.getView(ol[i]));
            }
        }
        return Promise.all(promises)
    }

    generateInitialAccounting(o: Order): AccountingOperation {

        let op = new AccountingOperation(`${o.ordernum} numaralı sipariş`);

        op.accounts.push(new Account("odeme-bekleyen-satislar", [o.userId, o.ordernum, 100], "Ürün Bedeli").inc(o.subTotal));
        if (o.shippingTotal > 0.00) {
            op.accounts.push(new Account("odeme-bekleyen-satislar", [o.userId, o.ordernum, 200], "Teslimat Bedeli").inc(o.shippingTotal));
        }
        if (Math.abs(o.discountTotal) > 0.00) {
            op.accounts.push(new Account("satis-indirimleri", [o.userId, o.ordernum, 100], "Uygulanan İndirimler").inc(Math.abs(o.discountTotal)));

        }
        op.accounts.push(new Account("satis-alacaklari", [o.userId, o.ordernum]).inc(o.total))

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

        let payment = CreditcardPaymentFactory.getInstance();
        let log = new SiteLogRoute(this.constructorParams);
        payment.logger = log;

        for (var bi in butchers) {
            let order = await Order.fromShopcard(card, <any>bi);
            order.ordergroupnum = groupid;
            order.butcherid = parseInt(bi);
            order.butcher = await Butcher.findByPk(order.butcherid)
            order.butcherName = butchers[bi].name;
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

    async create(card: ShopCard, paymentInfo: PaymentTotal): Promise<Order[]> {

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
            await email.send(dbOrder.email, "siparişinizi aldık", "order.started.ejs", view);
            await Sms.send(dbOrder.phone, 'kasaptanAl.com siparisinizi aldik, destek tel/whatsapp: 08503054216. Urunleriniz hazir oldugunda sizi bilgilendirecegiz.', false, new SiteLogRoute(this.constructorParams))
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

    static SetRoutes(router: express.Router) {
        //router.get("/admin/order/:ordernum", Route.BindRequest(this.prototype.getOrderRoute));
    }
}


