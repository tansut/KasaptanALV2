import { AppRequest, ValidationError } from "../lib/http";
import Product from "../db/models/product";
import { PurchaseOption, ProductView, ProductButcherView } from "./productView";
import Helper from "../lib/helper";
import { Shipment, ShipmentType, ShipmentTypeDesc } from "./shipment";
import { Payment, PaymentType, PaymentTypeDesc } from "./payment";
import { Order } from "../db/models/order";
import * as _ from "lodash"
import { GeoLocation } from "./geo";

export interface ShopcardAdres {
    name: string;
    email: string;
    phone: string;
    level1Id: number;
    level2Id: number;
    level3Id: number;
    saveaddress: boolean;
    adres: string;
    level1Text: string;
    level2Text: string;
    level3Text: string;
    location?:GeoLocation;
    accuracy?: number;
}

class Modifier {
    code: string;
    name: string;
    percent: number;
    net: number;
    subTotal: number;
}

export class Discount extends Modifier {
    get calculated() {
        if (this.percent > 0)
            return Helper.asCurrency(-1 * this.subTotal * (this.percent / 100))
        else return -1 * this.net
    }
}

export class ShippingCost extends Modifier {
    get calculated() {
        return this.net
    }
}

export let firstOrderDiscount = Object.assign(new Discount(), {
    code: 'ilksiparis',
    name: 'İlk sipariş indirimi',
    percent: 5,
    net: 0
})

// export let sub14OrderDiscount = Object.assign(new Discount(), {
//     code: '14subat',
//     name: '14 Şubat indirimi',
//     percent: 5,
//     net: 0
// })

export interface ShopcardButcherView {
    slug: string;
    name: string;
    id: number;
    subTotal: number;
    products: number[]
}

export class ShopCard {
    note: string;
    address: ShopcardAdres = {
        name: '',
        email: '',
        phone: '',
        level1Id: 0,
        level2Id: 0,
        level3Id: 0,
        saveaddress: true,
        adres: '',
        level1Text: '',
        level2Text:'',
        level3Text: '',
        location: null
    };
    butchers: { [key: number]: ShopcardButcherView; } = {};
    shipment: { [key: number]: Shipment; } = {};
    payment: { [key: number]: Payment; } = {};
    shippingCosts: { [key: number]: ShippingCost; } = {};
    butcherDiscounts: { [key: number]: Discount[]; } = {};

    discounts = [];
    

    items: ShopcardItem[] = [];

    getButcherDiscountTotal(bi) {
        let totalPrice = 0;
        if (!this.butcherDiscounts[bi])
            return 0.00;            
        this.butcherDiscounts[bi].forEach(d=>(totalPrice+=d.calculated));
        return Helper.asCurrency(totalPrice);
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
        for(let s in this.butcherDiscounts) {
            totalPrice+=this.getButcherDiscountTotal(s)
        }            
        return Helper.asCurrency(totalPrice)
    }

    get discountTotal() {
        let totalPrice = 0;
        this.discounts.forEach(p => {
            totalPrice += p.calculated;
        })
        return Helper.asCurrency(totalPrice + this.butcherDiscountTotal)
    }

    get shippingTotal() {
        let totalPrice = 0;
        for(let s in this.shippingCosts)
            totalPrice += this.shippingCosts[s].calculated;
            return Helper.asCurrency(totalPrice)
    }

    get total() {
        return this.subTotal + this.discountTotal + this.shippingTotal;
    }


    get subTotal() {
        let totalPrice = 0;
        this.items.forEach(p => {
            totalPrice += p.price;
        })
        return Helper.asCurrency(totalPrice)
    }



    remove(i) {
        this.items.splice(i, 1);
        this.arrangeButchers();
        this.calculateShippingCosts();
    }

    static calculatePrice(product: ProductView, quantity: number, purchaseoption: PurchaseOption) {
        return Helper.asCurrency(purchaseoption.unitPrice * quantity);
    }

    getShippingCost(bi) {
        let shipment = this.shipment[bi];
        let butcher = this.butchers[bi];
        return shipment.dispatcher ? (Math.max(0.00, (shipment.dispatcher.totalForFree - butcher.subTotal > 0) ? shipment.dispatcher.fee: 0)):0.00
    }

    calculateShippingCosts() {
        this.shippingCosts = {};
        for(let k in this.butchers) {
            let butcher = this.butchers[k];
            let shipment = this.shipment[k];
            let cost = this.getShippingCost(k);
            if (cost > 0) {
                this.shippingCosts[k] = new ShippingCost();
                this.shippingCosts[k].name = butcher.name;
                this.shippingCosts[k].net = cost;
                this.shippingCosts[k].subTotal =butcher.subTotal;
            }            
        }        
    }

    arrangeButchers() {
        let shipment = {};
        let payment = {};
        let butchers = {}

        this.items.forEach((item, i) => {
            let bi = item.product.butcher.id
            if (!butchers[bi]) {
                butchers[bi] = item.product.butcher;
                butchers[bi].products = [i];
                butchers[bi].subTotal = item.price;
            } else {
                butchers[bi].products.push(i);
                butchers[bi].subTotal += item.price;
            }
            if (this.shipment[bi])
                shipment[bi] = this.shipment[bi];
            else shipment[bi] = new Shipment();
            if (this.payment[bi])
                payment[bi] = this.payment[bi];
            else payment[bi] = new Payment();            
        })
        this.butchers = butchers;
        this.shipment = shipment;
        this.payment = payment;
    }

    addProduct(product: ProductView, quantity: number, purchaseoption: PurchaseOption, note: string) {
        quantity = Number(quantity.toFixed(3)); 
        let price = ShopCard.calculatePrice(product, quantity, purchaseoption);
        let found = null; // this.items.find(p => p.note == note && p.product.id == product.id && p.purchaseoption.id == purchaseoption.id && p.product.butcher.id == product.butcher.id);
        // if (found) {
        //     found.quantity = quantity + found.quantity;
        //     found.price = price + found.price;
        // }
        found || this.items.push(new ShopcardItem(product, quantity, price, purchaseoption, note));
        this.arrangeButchers();
        this.calculateShippingCosts();
    }

    constructor(values: any) {
        this.items = [];
        this.note = values.note || "";
        values = values || {};
        values.items = values.items || [];
        values.items.forEach(i => {
            let item = new ShopcardItem(i.product, i.quantity, i.price, i.purchaseoption, i.note);
            this.items.push(item)
        })
        values.address = values.address || this.address;
        this.address = values.address;

        values.butchers = values.butchers || this.butchers;
        this.butchers = values.butchers;

        values.shipment = values.shipment || {};
        this.shipment = {}
        Object.keys(values.shipment).forEach(k => {
            let o = Object.assign(new Shipment(), values.shipment[k]);
            this.shipment[k] = o;
        })

        values.payment = values.payment || {};
        this.payment = {}
        Object.keys(values.payment).forEach(k => {
            let o = Object.assign(new Payment(), values.payment[k]);
            this.payment[k] = o;
        })

        let discounts = values.discounts || [];

        let subTotal = this.subTotal;

        discounts.forEach(d => {
            let o = Object.assign(new Discount(), d);
            o.subTotal = subTotal
            this.discounts.push(o)
        })

        values.butcherDiscounts = values.butcherDiscounts || {};
        this.butcherDiscounts = {}
        Object.keys(values.butcherDiscounts).forEach(k => {
            let discounts = values.butcherDiscounts[k] || []
            discounts.forEach((element,i) => {
                let o = Object.assign(new Discount(), element);
                discounts[i] = o;
            });
           
            this.butcherDiscounts[k] = discounts;
        })

        values.shippingCosts = values.shippingCosts || {};
        this.shippingCosts = {}
        Object.keys(values.shippingCosts).forEach(k => {
            let o = Object.assign(new ShippingCost(), values.shippingCosts[k]);
            this.shippingCosts[k] = o;
        })

    }

    async saveToRequest(req: AppRequest) {
        if (req.user) {
            req.user.shopcard = this
            await req.user.save();
            return this;
        } else if (req.session) {
            req.session.shopcard = this;
            return new Promise((resolve, reject)=>{
                req.session.save((err)=>err ? reject(err): resolve())
            })
            return this;
        }
    }

    static async empty(req: AppRequest) {
        if (req.user) {
            req.user.shopcard = null;
            await req.user.save()
        }        
        req.session.shopcard = null;
        return new Promise((resolve, reject)=>{
            req.session.save((err)=>err ? reject(err): resolve())
        })        
    }

    addButcherDiscount(bi, discount: Discount) {
        if (!this.butcherDiscounts[bi])
            this.butcherDiscounts[bi] = [];
        this.butcherDiscounts[bi].push(discount) 
    }

    removeButcherDiscount(bi, code: string) {
        if (this.butcherDiscounts[bi]) {
            _.remove(this.butcherDiscounts[bi], p => p.code == code)                    
        }
        this.butcherDiscounts[bi].length == 0 && delete this.butcherDiscounts[bi];
        
    }    
    

    getButcherDiscount(bi, code: string) {
        if (!this.butcherDiscounts[bi])
            return null;
        return this.butcherDiscounts[bi].find(p=>p.code == code)
    }   
    
    async manageDiscounts() {
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
    }

    async manageFirstOrderDiscount(hasFirstOrder: Order) {
        firstOrderDiscount.subTotal = this.subTotal;
         for(let b in this.butchers) {                
             let applied = this.getButcherDiscount(b, firstOrderDiscount.code);
             if (applied) {
                this.removeButcherDiscount(b, firstOrderDiscount.code)  
                applied = null;
             }
             if (!applied) {
                if (!hasFirstOrder) {
                    this.addButcherDiscount(b, Object.assign(new Discount(), {
                        code: firstOrderDiscount.code,
                        percent: firstOrderDiscount.percent,
                        name: firstOrderDiscount.name,
                        subTotal: this.butchers[b].subTotal
                    }))                    
                }
             } else {
                if (hasFirstOrder) {
                    this.removeButcherDiscount(b, firstOrderDiscount.code)                    
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
    }

    static async createFromRequest(req: AppRequest): Promise<ShopCard> {
        let result: ShopCard;
        if (req.user && req.user.shopcard != null) {
            result = new ShopCard(req.user.shopcard)
        } else if (req.session.shopcard != null) {
            result = new ShopCard(req.session.shopcard);
        } else result = new ShopCard({});

        if (req.prefAddr) {
            result.address.level1Id = req.prefAddr.level1Id;
            result.address.level1Text = req.prefAddr.level1Text;

            result.address.level2Id = req.prefAddr.level2Id;
            result.address.level2Text = req.prefAddr.level2Text;

            result.address.level3Id = req.prefAddr.level3Id;
            result.address.level3Text = req.prefAddr.level3Text;            
        }

        let firstOrder = !req.user ? null : await Order.findOne({
            where: {
                userid: req.user.id
            }
        })        
        result.butcherDiscounts = {}
        await result.manageFirstOrderDiscount(firstOrder);
        await result.manageDiscounts();
        return result;
    }
}

export class ShopcardItem {
    constructor(public product: ProductView,
        public quantity: number, public price: number,
        public purchaseoption: PurchaseOption, public note: string) {
            if (!product) throw new ValidationError('geçersiz ürün');
            if (!quantity) throw new ValidationError('geçersiz miktar:' + product.name);
            if (!price) throw new ValidationError('geçersiz bedel: ' + product.name);
    }
}