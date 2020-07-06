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
exports.ShopcardItem = exports.ShopCard = exports.firstOrderDiscount = exports.ShippingCost = exports.Discount = void 0;
const http_1 = require("../lib/http");
const helper_1 = require("../lib/helper");
const shipment_1 = require("./shipment");
const payment_1 = require("./payment");
const order_1 = require("../db/models/order");
const _ = require("lodash");
class Modifier {
}
class Discount extends Modifier {
    get calculated() {
        if (this.percent > 0)
            return helper_1.default.asCurrency(-1 * this.subTotal * (this.percent / 100));
        else
            return -1 * this.net;
    }
}
exports.Discount = Discount;
class ShippingCost extends Modifier {
    get calculated() {
        return this.net;
    }
}
exports.ShippingCost = ShippingCost;
exports.firstOrderDiscount = Object.assign(new Discount(), {
    type: 'puan',
    code: 'ilksiparis',
    name: 'İlk sipariş indirimi',
    percent: 3,
    net: 0
});
class ShopCard {
    constructor(values) {
        this.address = {
            name: '',
            email: '',
            phone: '',
            level1Id: 0,
            level2Id: 0,
            level3Id: 0,
            saveaddress: true,
            adres: '',
            addresstarif: '',
            bina: '',
            kat: '',
            daire: '',
            level1Text: '',
            level2Text: '',
            level3Text: '',
            location: null,
            geolocation: null,
            geolocationType: "UNKNOWN"
        };
        this.butchers = {};
        this.shipment = {};
        this.payment = {};
        this.shippingCosts = {};
        this.butcherDiscounts = {};
        this.discounts = [];
        this.items = [];
        this.items = [];
        this.note = values.note || "";
        values = values || {};
        values.items = values.items || [];
        values.items.forEach(i => {
            let item = new ShopcardItem(i.product, i.quantity, i.price, i.purchaseoption, i.note, i.productTypeData || {});
            this.items.push(item);
        });
        values.address = values.address || this.address;
        this.address = values.address;
        values.butchers = values.butchers || this.butchers;
        this.butchers = values.butchers;
        values.shipment = values.shipment || {};
        this.shipment = {};
        Object.keys(values.shipment).forEach(k => {
            let o = Object.assign(new shipment_1.Shipment(), values.shipment[k]);
            this.shipment[k] = o;
        });
        values.payment = values.payment || {};
        this.payment = {};
        Object.keys(values.payment).forEach(k => {
            let o = Object.assign(new payment_1.Payment(), values.payment[k]);
            this.payment[k] = o;
        });
        let discounts = values.discounts || [];
        let subTotal = this.subTotal;
        discounts.forEach(d => {
            let o = Object.assign(new Discount(), d);
            o.subTotal = subTotal;
            this.discounts.push(o);
        });
        values.butcherDiscounts = values.butcherDiscounts || {};
        this.butcherDiscounts = {};
        Object.keys(values.butcherDiscounts).forEach(k => {
            let discounts = values.butcherDiscounts[k] || [];
            discounts.forEach((element, i) => {
                let o = Object.assign(new Discount(), element);
                discounts[i] = o;
            });
            this.butcherDiscounts[k] = discounts;
        });
        values.shippingCosts = values.shippingCosts || {};
        this.shippingCosts = {};
        Object.keys(values.shippingCosts).forEach(k => {
            let o = Object.assign(new ShippingCost(), values.shippingCosts[k]);
            this.shippingCosts[k] = o;
        });
    }
    getPaymentTotal(type) {
        let total = 0.00;
        for (var bi in this.payment) {
            if (this.payment[bi].type == type) {
                total += helper_1.default.asCurrency(this.getButcherTotal(bi));
            }
        }
        return helper_1.default.asCurrency(total);
    }
    getButcherDiscountTotal(bi) {
        let totalPrice = 0;
        if (!this.butcherDiscounts[bi])
            return 0.00;
        this.butcherDiscounts[bi].forEach(d => (totalPrice += (d.type == 'discount' ? d.calculated : 0.00)));
        return helper_1.default.asCurrency(totalPrice);
    }
    getButcherTotal(bi) {
        let totalPrice = this.butchers[bi].subTotal;
        let discounts = this.getButcherDiscountTotal(bi);
        let shippings = this.getShippingCost(bi);
        return totalPrice + discounts + shippings;
    }
    // butcherDi(bi) {
    //     let shipment = this.shipment[bi];
    //     if (!shipment.dispatcher) 
    // }
    get butcherDiscountTotal() {
        let totalPrice = 0;
        for (let s in this.butcherDiscounts) {
            totalPrice += this.getButcherDiscountTotal(s);
        }
        return helper_1.default.asCurrency(totalPrice);
    }
    get discountTotal() {
        let totalPrice = 0;
        this.discounts.forEach(p => {
            totalPrice += (p.type == 'discount' ? p.calculated : 0.00);
        });
        return helper_1.default.asCurrency(totalPrice + this.butcherDiscountTotal);
    }
    get shippingTotal() {
        let totalPrice = 0;
        for (let s in this.shippingCosts)
            totalPrice += this.shippingCosts[s].calculated;
        return helper_1.default.asCurrency(totalPrice);
    }
    get total() {
        return this.subTotal + this.discountTotal + this.shippingTotal;
    }
    get subTotal() {
        let totalPrice = 0;
        this.items.forEach(p => {
            totalPrice += p.price;
        });
        return helper_1.default.asCurrency(totalPrice);
    }
    remove(i) {
        this.items.splice(i, 1);
        this.arrangeButchers();
        this.calculateShippingCosts();
    }
    static calculatePrice(product, quantity, purchaseoption) {
        return helper_1.default.asCurrency(purchaseoption.unitPrice * quantity);
    }
    getShippingCost(bi) {
        let shipment = this.shipment[bi];
        let butcher = this.butchers[bi];
        if (shipment.howTo == "take")
            return 0.00;
        if (shipment.dispatcher) {
            if (shipment.dispatcher.totalForFree <= 0) {
                return shipment.dispatcher.fee;
            }
            else
                return (Math.max(0.00, (shipment.dispatcher.totalForFree - butcher.subTotal > 0) ? shipment.dispatcher.fee : 0));
        }
        else
            return 0.00;
    }
    calculateShippingCosts() {
        this.shippingCosts = {};
        for (let k in this.butchers) {
            let butcher = this.butchers[k];
            let shipment = this.shipment[k];
            let cost = this.getShippingCost(k);
            if (cost > 0) {
                this.shippingCosts[k] = new ShippingCost();
                this.shippingCosts[k].name = butcher.name;
                this.shippingCosts[k].net = cost;
                this.shippingCosts[k].subTotal = butcher.subTotal;
            }
        }
    }
    arrangeButchers() {
        let shipment = {};
        let payment = {};
        let butchers = {};
        this.items.forEach((item, i) => {
            let bi = item.product.butcher.id;
            if (!butchers[bi]) {
                butchers[bi] = item.product.butcher;
                butchers[bi].products = [i];
                butchers[bi].subTotal = item.price;
            }
            else {
                butchers[bi].products.push(i);
                butchers[bi].subTotal += item.price;
            }
            if (this.shipment[bi])
                shipment[bi] = this.shipment[bi];
            else
                shipment[bi] = new shipment_1.Shipment();
            if (this.payment[bi])
                payment[bi] = this.payment[bi];
            else {
                let preferred = butchers[bi].enableCreditCard ? 'onlinepayment' : 'cashondoor';
                payment[bi] = Object.assign(new payment_1.Payment(), {
                    type: preferred,
                    desc: payment_1.PaymentTypeDesc[preferred]
                });
            }
        });
        this.butchers = butchers;
        this.shipment = shipment;
        this.payment = payment;
    }
    addProduct(product, quantity, purchaseoption, note, productTypeData = {}) {
        quantity = Number(quantity.toFixed(3));
        let price = ShopCard.calculatePrice(product, quantity, purchaseoption);
        //let found = null; // this.items.find(p => p.note == note && p.product.id == product.id && p.purchaseoption.id == purchaseoption.id && p.product.butcher.id == product.butcher.id);
        // if (found) {
        //     found.quantity = quantity + found.quantity;
        //     found.price = price + found.price;
        // }
        this.items.push(new ShopcardItem(product, quantity, price, purchaseoption, note, productTypeData));
        let removed = [];
        if (product.productType == 'kurban') {
            this.items = this.items.filter(p => p.product.productType == 'kurban');
        }
        else {
            this.items = this.items.filter(p => p.product.productType != 'kurban');
        }
        this.arrangeButchers();
        this.calculateShippingCosts();
    }
    saveToRequest(req) {
        return __awaiter(this, void 0, void 0, function* () {
            if (req.user) {
                req.user.shopcard = this;
                yield req.user.save();
                return this;
            }
            else if (req.session) {
                req.session.shopcard = this;
                return new Promise((resolve, reject) => {
                    req.session.save((err) => err ? reject(err) : resolve());
                });
                return this;
            }
        });
    }
    static empty(req) {
        return __awaiter(this, void 0, void 0, function* () {
            if (req.user) {
                req.user.shopcard = null;
                yield req.user.save();
            }
            req.session.shopcard = null;
            return new Promise((resolve, reject) => {
                req.session.save((err) => err ? reject(err) : resolve());
            });
        });
    }
    addButcherDiscount(bi, discount) {
        if (!this.butcherDiscounts[bi])
            this.butcherDiscounts[bi] = [];
        this.butcherDiscounts[bi].push(discount);
    }
    removeButcherDiscount(bi, code) {
        if (this.butcherDiscounts[bi]) {
            _.remove(this.butcherDiscounts[bi], p => p.code == code);
        }
        this.butcherDiscounts[bi].length == 0 && delete this.butcherDiscounts[bi];
    }
    getOrderType() {
        if (this.items.length && this.items[0].product.productType == 'kurban') {
            return 'kurban';
        }
        else
            return 'generic';
    }
    getButcherDiscount(bi, code) {
        if (!this.butcherDiscounts[bi])
            return null;
        return this.butcherDiscounts[bi].find(p => p.code == code);
    }
    manageDiscounts() {
        return __awaiter(this, void 0, void 0, function* () {
            // for(let b in this.butchers) {                
            //     let discountTotal = this.getButcherDiscountTotal(b);
            //     let discounts = this.butcherDiscounts[b];
            //     let butcherProducts = this.butchers[b].products;
            //     butcherProducts.forEach((pi) => {
            //         let product = this.items[pi];
            //     })
            // }        
            // for(let b in this.butchers) {                
            //     let applied = this.getButcherDiscount(b, sub14OrderDiscount.code);
            //     if (applied) {
            //         this.removeButcherDiscount(b, sub14OrderDiscount.code)  
            //         applied = null;
            //      }
            //     if (!applied) {
            //         this.addButcherDiscount(b, Object.assign(new Discount(), {
            //             code: sub14OrderDiscount.code,
            //             percent: sub14OrderDiscount.percent,
            //             name: sub14OrderDiscount.name,
            //             subTotal: this.butchers[b].subTotal
            //         }))    
            //     }
            // }        
        });
    }
    manageFirstOrderDiscount(hasFirstOrder) {
        return __awaiter(this, void 0, void 0, function* () {
            exports.firstOrderDiscount.subTotal = this.subTotal;
            for (let b in this.butchers) {
                let applied = this.getButcherDiscount(b, exports.firstOrderDiscount.code);
                if (applied) {
                    this.removeButcherDiscount(b, exports.firstOrderDiscount.code);
                    applied = null;
                }
                if (!applied) {
                    if (!hasFirstOrder) {
                        this.addButcherDiscount(b, Object.assign(new Discount(), {
                            type: exports.firstOrderDiscount.type,
                            code: exports.firstOrderDiscount.code,
                            percent: exports.firstOrderDiscount.percent,
                            name: exports.firstOrderDiscount.name,
                            subTotal: this.butchers[b].subTotal
                        }));
                    }
                }
                else {
                    if (hasFirstOrder) {
                        this.removeButcherDiscount(b, exports.firstOrderDiscount.code);
                    }
                }
            }
            // let firstOrderApplied = this.discounts.find(p => p.code == firstOrderDiscount.code);
            // if (!firstOrderApplied) {
            //     if (!firstOrder)
            //         this.discounts.push(firstOrderDiscount)
            // } else {
            //     if (firstOrder)
            //         _.remove(result.discounts, p => p.code == firstOrderDiscount.code)
            // }
        });
    }
    static createFromRequest(req) {
        return __awaiter(this, void 0, void 0, function* () {
            let result;
            if (req.user && req.user.shopcard != null) {
                result = new ShopCard(req.user.shopcard);
            }
            else if (req.session.shopcard != null) {
                result = new ShopCard(req.session.shopcard);
            }
            else
                result = new ShopCard({});
            if (req.prefAddr) {
                result.address.level1Id = req.prefAddr.level1Id;
                result.address.level1Text = req.prefAddr.level1Text;
                result.address.level2Id = req.prefAddr.level2Id;
                result.address.level2Text = req.prefAddr.level2Text;
                result.address.level3Id = req.prefAddr.level3Id;
                result.address.level3Text = req.prefAddr.level3Text;
            }
            let butcherids = Object.keys(result.butchers || {});
            let firstOrder = !req.user ? null : yield order_1.Order.findOne({
                where: {
                    userid: req.user.id,
                    butcherid: butcherids
                }
            });
            result.butcherDiscounts = {};
            yield result.manageFirstOrderDiscount(firstOrder);
            yield result.manageDiscounts();
            return result;
        });
    }
}
exports.ShopCard = ShopCard;
class ShopcardItem {
    // public discount: number = 0.00;
    constructor(product, quantity, price, purchaseoption, note, productTypeData) {
        this.product = product;
        this.quantity = quantity;
        this.price = price;
        this.purchaseoption = purchaseoption;
        this.note = note;
        this.productTypeData = productTypeData;
        if (!product)
            throw new http_1.ValidationError('geçersiz ürün');
        if (!quantity)
            throw new http_1.ValidationError('geçersiz miktar:' + product.name);
        if (!price)
            throw new http_1.ValidationError('geçersiz bedel: ' + product.name);
    }
}
exports.ShopcardItem = ShopcardItem;
