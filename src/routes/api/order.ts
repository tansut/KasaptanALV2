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

    async create(card: ShopCard) {
        let order = Order.fromShopcard(card);
        let l3 = await Area.findByPk(order.areaLevel3Id);
        let l2 = await Area.findByPk(l3.parentid);
        order.userId = this.req.user.id;
        order.areaLevel2Id = l2.id;
        order.areaLevel2Text = l2.name;

        return db.getContext().transaction((t:Transaction)=> {
            return order.save({
                transaction: t
            }).then((order) => {
                let promises = []
                for(let i=0; i < card.items.length;i++) {
                    let oi = OrderItem.fromShopcardItem(card, card.items[i]);            
                    oi.orderid = order.id;
                    promises.push(oi.save({
                        transaction: t
                    }))
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
            });
        }).then(tc=>{
            let api = new OrderApi(this.constructorParams);
            let dbOrder = api.getOrder(order.ordernum);
            return dbOrder
        }).then(dbOrder=> {
            let view = this.getView(dbOrder);
            return email.send(order.email, "siparişinizi aldık", "order.started.ejs", view).then((em)=>dbOrder)                    
        })
        


        
        // for(let s in card.shipment) {
        //     let shipment = card.shipment[s];
        //     let dispatcher = shipment.dispatcher ? shipment.dispatcher: null;
        //     if (dispatcher) {
        //         Dispatcher.update({
        //             lasto
        //         })
        //     }
        // }

    }


    static SetRoutes(router: express.Router) {
        //router.get("/search", Route.BindRequest(this.prototype.searchRoute));
    }
}


