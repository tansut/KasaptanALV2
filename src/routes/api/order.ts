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
import Product from '../../db/models/product';
import  OrderApi from '../api/order';
import { Transaction } from "sequelize";
import db from "../../db/context";
import { Sms } from '../../lib/sms';
const orderid = require('order-id')('dkfjsdklfjsdlkg450435034.,')

export default class Route extends ApiRouter {


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
                    days: [item.shipmentdate ? item.shipmentdate.toDateString(): ''] ,
                    hours: [item.shipmenthour],
                    informMe: item.shipmentInformMe,
                    daysText: [[item.shipmentdate ? item.shipmentdate.toDateString(): '']],
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
                orderItems.forEach(oi=> {
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

    async create(card: ShopCard): Promise<Order[]> {

        let butchers = card.butchers;
        let groupid = orderid.generate();
        let l3 = await Area.findByPk(card.address.level3Id);
        let l2 = await Area.findByPk(l3.parentid);    
        let result: Promise<Order>[] = [];
        let orders = []

        for(var bi in butchers) {
            let order = Order.fromShopcard(card, <any>bi);   
            order.ordergroupnum = groupid; 
            order.butcherid = parseInt(bi);     
            order.butcherName = butchers[bi].name;   
            order.userId = this.req.user.id;
            order.areaLevel2Id = l2.id;
            order.areaLevel2Text = l2.name;
            orders.push(order);
        }    

        let res = db.getContext().transaction((t:Transaction)=> {
            for(var i = 0; i < orders.length; i++) {
                let dbOrder = this.createOrder(t, orders[i], card);
                result.push(dbOrder);
            }
            return Promise.all(result)            
        })

        await res;
        let fres = []
        for(var oi = 0; oi < orders.length; oi++) {
            let order = orders[oi];
             let api = new OrderApi(this.constructorParams);
             let dbOrder = await api.getOrder(order.ordernum);
             let view = this.getView(dbOrder);
             await email.send(dbOrder.email, "siparişinizi aldık", "order.started.ejs", view);
             await Sms.send(dbOrder.phone, 'kasaptanAl.com siparisinizi aldik, destek tel/whatsup: 08503054216. Urunleriniz hazir oldugunda sizi bilgilendirecegiz.', false)             
             fres.push(dbOrder)
         }
        
         return fres;
    }


    static SetRoutes(router: express.Router) {
        //router.get("/search", Route.BindRequest(this.prototype.searchRoute));
    }
}


