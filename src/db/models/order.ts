import { Table, Column, DataType, Model, HasMany, CreatedAt, UpdatedAt, DeletedAt, Unique, Default, AllowNull, ForeignKey, BelongsTo } from 'sequelize-typescript';
import BaseModel from "./basemodel"
import Helper from '../../lib/helper';
import { ShopCard, ShopcardItem, firstOrderDiscount } from '../../models/shopcard';
import Product from './product';
import Butcher from './butcher';
import { DeliveryStatus, OrderItemStatus, OrderSource, OrderType } from '../../models/order';
import Dispatcher, { DispatcherType } from './dispatcher';
import { GeoLocation, LocationSource, LocationType } from '../../models/geo';
import AccountModel from './accountmodel';
import { PuanResult } from '../../models/puan';
import { ProductTypeManager, ProductTypeFactory } from '../../lib/common';
import { ComissionHelper } from '../../lib/commissionHelper';
import { method } from 'lodash';
import { ShipmentType, HowToShipType } from '../../models/shipment';
const orderid = require('order-id')('dkfjsdklfjsdlkg450435034.,')



export type OrderButcherSelection = "default" | "user"

@Table({
    tableName: "Orders",
    indexes: [{
        fields: ['userId'],
        name: 'userid_idx'
    }, {
        fields: ['ordernum'],
        name: 'ordernum_idx',
        unique: true
    }]
})
class Order extends BaseModel<Order> {

    isFirstButcherOrder: boolean = false;
    isFirstOrder: boolean = false;
    
    allAccounts: AccountModel[] = [];


    workedAccounts: AccountModel[] = [];
    butcherPuanAccounts: AccountModel[] = [];
    kalittePuanAccounts: AccountModel[] = [];

    kalitteOnlyPuanAccounts: AccountModel[] = [];
    kalitteByButcherPuanAccounts: AccountModel[] = [];
    
    butcherDeptAccounts: AccountModel[] = [];
    butcherComissiomAccounts: AccountModel[] = [];

    puanSummary: PuanResult [] = [];

    cancelable() {
        return (this.status == OrderItemStatus.supplying) || (this.status == OrderItemStatus.reqirePayment);
    }




    @Column({
        allowNull: false,
    })
    userId: number;

    @Column({
        allowNull: false,
        defaultValue: false
    })
    noInteraction: boolean;

    @Column({
        allowNull: false,
    })
    ordernum: string;

    @Column({
        allowNull: false,
        defaultValue: 'web'
    })
    platform: string;

    @Column({
        allowNull: true,
        defaultValue: ''
    })
    appPlatform: string;    

    @Column({
        allowNull: true        
    })
    paymentId: string;    

    @Column({
        allowNull: false,
        defaultValue: OrderSource.kasaptanal
    })
    orderSource: string;    

    @Column({
        allowNull: false,
        defaultValue: "default"
    })
    butcherSelection: OrderButcherSelection;    


    @Column({
        allowNull: false,
        defaultValue: OrderType.generic
    })
    orderType: string;      

    @Column({
        allowNull: true        
    })
    paymentTransactionId: string;        

    @Column({
        allowNull: true
    })  
    subMerchantStatus: string;        

    @Column({
        allowNull: true
    })
    ordergroupnum: string;    

    @Column({
        allowNull: true,
        type: DataType.TEXT
    })
    note: string;

    @ForeignKey(() => Butcher)
    butcherid: number;

    @BelongsTo(() => Butcher, "butcherid")
    butcher: Butcher;  
    
    @Column({
        allowNull: false,
        defaultValue: 'belli değil'        
    })
    butcherName: string;


    @Column({
        allowNull: false,
    })
    name: string;

    @Column({
        allowNull: false,
    })
    email: string;

    @Column({
        allowNull: false,
    })
    phone: string;

    @Column({
        allowNull: true
    })
    areaLevel1Id: number;

    @Column({
        allowNull: true
    })
    areaLevel2Id: number;

    @Column({
        allowNull: true
    })
    areaLevel3Id: number;

    @Column({
        allowNull: true
    })
    areaLevel4Id: number;

    @Column({
        allowNull: false,
        defaultValue: true
    })
    saveAddress: boolean;

    @Column({
        allowNull: true
    })
    address: string;

    get displayAddress() {
        //return `${this.address} Bina: ${this.bina}, Kat: ${this.kat}, Daire: ${this.daire}. + ${this.areaLevel3Text}, ${this.areaLevel2Text}/${this.areaLevel1Text}`
        return `${this.address} Bina: ${this.bina}, Kat: ${this.kat}, Daire: ${this.daire}. ${this.areaLevel4Text ? this.areaLevel4Text + ',':''} ${this.areaLevel3Text}, ${this.areaLevel2Text}/${this.areaLevel1Text}`
    }

    @Column({
        allowNull: true
    })
    bina: string;

    @Column({
        allowNull: true
    })
    adresTarif: string;    

    @Column({
        allowNull: true
    })
    kat: string;

    @Column({
        allowNull: true
    })
    daire: string;

    @Column({
        allowNull: true
    })
    areaLevel1Text: string;

    @Column({
        allowNull: true
    })
    areaLevel2Text: string;

    @Column({
        allowNull: true
    })
    areaLevel3Text: string;

    @Column({
        allowNull: true
    })
    areaLevel4Text: string;


    @Column({
        allowNull: true
    })
    locationType: LocationType;   

    @Column({
        allowNull: true,
        type: DataType.GEOMETRY('POINT')
    })
    shipLocation: GeoLocation;

    @Column
    shipLocationAccuracy: number

    // @Column({
    //     allowNull: true,
    //     type: DataType.GEOMETRY('POINT')
    // })
    // dispatcherLocation: GeoLocation;    

    @Column({
        allowNull: true,
        type: DataType.DECIMAL(5, 1)
    })
    dispatcherDistance: number;    

    @HasMany(() => OrderItem, {
        sourceKey: "id",
        foreignKey: "orderid",
        //as: "ButcherProduct"
    })
    items: OrderItem[];      

    @Column({
        allowNull: false,
        type: DataType.DECIMAL(13, 2)
    })
    subTotal: number;

    @Column({
        allowNull: false,
        type: DataType.DECIMAL(13, 2),
        defaultValue: 0.00
        
    })
    requestedPuan: number;         

    @Column({
        allowNull: false,
        type: DataType.DECIMAL(13, 2)
    })
    discountTotal: number;

    @Column({
        allowNull: false,
        type: DataType.DECIMAL(13, 2)
    })
    shippingTotal: number;

    @Column({
        allowNull: false,
        type: DataType.DECIMAL(13, 2)
    })
    total: number;

    @Column({
        allowNull: false,
        type: DataType.DECIMAL(13, 2),
        defaultValue: 0.00
    })
    paidTotal: number;    

    @Column({
        allowNull: true    
    })    
    status: OrderItemStatus;    

    @Column({
        allowNull: true    
    })    
    deliveryStatus: DeliveryStatus;      

    @Column({
        allowNull: true    
    })    
    deliveryOrderId: string;     

    @Column({
        allowNull: true    ,
        type: DataType.TEXT
    })    
    statusDesc: string;      

    @Column
    shopcardjson: Buffer

    @Column({
        allowNull: true,
        type: DataType.DECIMAL(5, 2)
    })    
    userRating: number;    

    @Column
    dispatcherid: number;


    @Column({
        allowNull: true
    })
    dispatcherType: DispatcherType;  

    @Column({
        allowNull: true
    })
    dispatcherName: string;      

    @Column({
        allowNull: true,
        type: DataType.DECIMAL(13, 2)
    })
    dispatcherFee: number;     

    @Column({
        allowNull: true,
        type: DataType.DECIMAL(13, 2)
    })
    dispatcherFeeOffer: number;      

    @Column({
        allowNull: true,
        type: DataType.DECIMAL(13, 2)
    })
    dispatchertotalForFree: number;   
    
    @Column({
        allowNull: true
    })
    shipmentType: ShipmentType;

    @Column({
        allowNull: true
    })
    shipmentTypeText: string;

    @Column({
        allowNull: true
    })  
    logisticProvider: string;  

    @Column({
        allowNull: true
    })
    shipmentHowTo: HowToShipType;

    @Column({
        allowNull: true
    })
    shipmentHowToText: string;

    @Column({
        allowNull: true
    })
    securityCode: string;   

    @Column({
        allowNull: true
    })
    shipmentdate: Date;

    @Column({
        allowNull: true
    })
    shipmenthour: number;

    @Column({
        allowNull: true
    })
    shipmenthourText: string;

    @Column({
        allowNull: true
    })
    shipmentstart: Date;    

    @Column({
        allowNull: true
    })
    shipmentStartText: string;    

    @Column({
        allowNull: false,
        defaultValue: 0
    })
    sentCustomerReminders: number;

    @Column({
        allowNull: true
    })
    customerLastReminder: Date;

    @Column({
        allowNull: true
    })
    customerLastReminderType: string;    



    @Column({
        allowNull: false,
        defaultValue: 0
    })
    sentButcherReminders: number;

    @Column({
        allowNull: true
    })
    butcherLastReminder: Date;

    @Column({
        allowNull: true
    })
    butcherLastReminderType: string;    

   

    @Column({
        allowNull: true
    })
    paymentType: string;

    @Column({
        allowNull: true
    })
    paymentStatus: string;    

    @Column({
        allowNull: true
    })
    paymentTypeText: string;

    @Column({
        allowNull: true
    })
    shipmentInformMe: boolean;    

    @Column
    dispatcherjson: Buffer

    get dispatcherData(): Object {
        return JSON.parse((<Buffer>this.getDataValue('dispatcherjson')).toString())
    }

    set dispatcherData(value: Object) {
        this.setDataValue('dispatcherjson', Buffer.from(JSON.stringify(value), "utf-8"));
    }

    get displayName() {
        let names = (this.name || '').split(' ').filter(p=>p.trim());
        if (names.length == 0) return '';
        return `${names[0]} ${names.length > 1 ? names[names.length-1][0] + '.':''}`
    }


    get shopcard(): Object {
        return JSON.parse((<Buffer>this.getDataValue('shopcardjson')).toString())
    }

    set shopcard(value: Object) {
        this.setDataValue('shopcardjson', Buffer.from(JSON.stringify(value), "utf-8"));
    }


    getButcherRate(dispatcherType: DispatcherType = null) {
        dispatcherType = dispatcherType || this.dispatcherType;
        if (this.orderSource == OrderSource.kasaptanal) {
            if (this.orderType == OrderType.kurban) {
                return this.butcher.kurbanCommissionRate;    
            } else {
                if (dispatcherType == "butcher" || dispatcherType == "butcher/auto") {
                    return this.butcher.commissionRate                               
                } else {
                    return this.butcher.noshipCommissionRate;
                }                
            } 
        } else return this.butcher.payCommissionRate;   
    }

    getButcherFee(dispatcherType: DispatcherType = null) {
        dispatcherType = dispatcherType || this.dispatcherType;
        if (this.orderSource == OrderSource.kasaptanal) {
            if (this.orderType == OrderType.kurban) {
                return this.butcher.kurbanCommissionFee;    
            } else {
                if (dispatcherType == "butcher" || dispatcherType == "butcher/auto") {
                    return this.butcher.commissionFee                               
                } else {
                    return this.butcher.noshipCommissionFee;
                }
            } 
                 
        } else return this.butcher.payCommissionFee;   

        
    }

    getPuanTotal() {
        let result = 0.00;
        if (this.orderSource == OrderSource.kasaptanal) {
            let butcherPuanEarned = this.butcherPuanAccounts.find(p => p.code == 'total');
            let kalitteOnlyPuanEarned = this.kalitteOnlyPuanAccounts.find(p => p.code == 'total');
            let kalitteByButcherEarned = this.kalitteByButcherPuanAccounts.find(p => p.code == 'total');
            let butcherPuan = Helper.asCurrency(butcherPuanEarned.alacak - butcherPuanEarned.borc);
            let kalitteByButcherPuan = Helper.asCurrency(kalitteByButcherEarned.alacak - kalitteByButcherEarned.borc);
            let totalPuanByButcher = Helper.asCurrency(butcherPuan + kalitteByButcherPuan);
            let totalPuanByButcherVat = Helper.asCurrency(totalPuanByButcher * this.butcher.vatRate);
            result = Helper.asCurrency(totalPuanByButcher + totalPuanByButcherVat);
        }  

        return result;
    }

  

    getButcherComission(shouldBePaid: number, usablePuan: number) {
        let rate = this.getButcherRate(); 
        let fee = this.getButcherFee();
        let calc = new ComissionHelper(rate, fee, this.butcher.vatRate);
        let totalFee = calc.calculateButcherComission(shouldBePaid);
        
        if (usablePuan) {
            let newFee = Math.max(0.00, Helper.asCurrency(totalFee.kalitteFee + totalFee.kalitteVat  - usablePuan));
            return newFee;
        } else return Helper.asCurrency(totalFee.kalitteFee + totalFee.kalitteVat);     
    }

    static async fromShopcard(c: ShopCard, bi: number): Promise<Order> {
        let o = new Order();
        o.ordernum = orderid.generate();
        o.note = c.note;        
        let firstDiscount = c.getButcherDiscount(bi, firstOrderDiscount.code)
        o.isFirstButcherOrder = firstDiscount != null;
        o.discountTotal = c.getButcherDiscountTotal(bi);
        o.subTotal = c.butchers[bi].subTotal;        
        o.shippingTotal = c.getShippingCostOfCustomer(bi);
        o.total = c.getButcherTotal(bi);        
        o.areaLevel1Id = c.address.level1Id;
        o.areaLevel3Id = c.address.level3Id;
        o.areaLevel4Id = c.address.level4Id;
        o.areaLevel1Text = c.address.level1Text;
        o.areaLevel3Text = c.address.level3Text;
        o.areaLevel4Text = c.address.level4Text;
        o.email = c.address.email;
        o.address = c.address.adres;
        o.bina = c.address.bina;
        o.kat = c.address.kat;
        o.daire = c.address.daire;
        o.adresTarif = c.address.addresstarif;
        if (c.address.geolocation) {
            o.shipLocation = c.address.geolocation;
            o.locationType = c.address.geolocationType
        } else if (c.address.location) {
            o.shipLocation = c.address.location;
            o.shipLocationAccuracy = c.address.accuracy;
        }
        
        o.phone = c.address.phone;
        o.name = c.address.name;
        o.saveAddress = c.address.saveaddress;
        o.noInteraction = c.shipment[bi].nointeraction;
        o.orderType = c.getOrderType();
        
        if (c.shipment[bi].dispatcher) {
            o.dispatcherid = c.shipment[bi].dispatcher.id;
            o.dispatcherFee = c.shipment[bi].dispatcher.feeOffer;
            o.dispatcherFeeOffer = c.shipment[bi].dispatcher.feeOffer;
            o.dispatcherName = c.shipment[bi].dispatcher.name;
            o.dispatcherType = c.shipment[bi].dispatcher.type;
            o.dispatchertotalForFree = c.shipment[bi].dispatcher.totalForFree;     
            o.dispatcherDistance =  c.shipment[bi].dispatcher.km;    
            // if (o.shipLocation && c.shipment[bi].dispatcher.location) {
            //     o.dispatcherDistance = Helper.distance(o.shipLocation, c.shipment[bi].dispatcher.location)
            // }        
        }

        o.shipmentHowTo = c.shipment[bi].howTo;
        o.shipmentHowToText = c.shipment[bi].howToDesc;
        o.paymentType = c.payment[bi].type;
        o.paymentTypeText = c.payment[bi].desc;
        o.status = o.paymentType == 'onlinepayment' ? OrderItemStatus.reqirePayment: OrderItemStatus.supplying;
        o.shipmentType = c.shipment[bi].type;
        o.shipmentTypeText = c.shipment[bi].desc;
        o.shipmentdate = c.shipment[bi].days[0] ? Helper.newDate(c.shipment[bi].days[0]): Helper.Now();
        o.shipmenthour = c.shipment[bi].hours[0];
        o.shipmenthourText = c.shipment[bi].hoursText[0];
        o.shipmentInformMe = c.shipment[bi].informMe;

        return o;
    }

}

@Table({
    tableName: "OrderItems",
    indexes: [{
        fields: ['orderId'],
        name: 'orderid_idx'
    }]
})
class OrderItem extends BaseModel<Order> {

    @ForeignKey(() => Order)
    orderid: number;

    @BelongsTo(() => Order, "orderid")
    order: Order;

    @ForeignKey(() => Product)
    productid: number;

    @BelongsTo(() => Product, "productid")
    product: Product;

    @Column({
        allowNull: false,
        defaultValue: 'generic'        
    })
    productType: string;    

    @Column({
        allowNull: true
    })
    custom1: string;   

    @Column({
        allowNull: true
    })
    custom2: string;   
    
    @Column({
        allowNull: true
    })
    custom3: string;   
    
    
    @Column({
        allowNull: true
    })
    custom4: string;   

    @Column({
        allowNull: true
    })
    custom5: string;    

    @Column({
        allowNull: true
    })
    custom6: string;       

    @Column({
        allowNull: true
    })
    custom7: string;   

    @Column({
        allowNull: true
    })
    custom8: string;   

    @Column({
        allowNull: true
    })
    custom9: string;       

    @Column({
        allowNull: false,
        type: DataType.DECIMAL(13, 2)
    })
    quantity: number;

    @ForeignKey(() => Butcher)
    butcherid: number;

    @BelongsTo(() => Butcher, "butcherid")
    butcher: Butcher;    

    @Column({
        allowNull: true,
        type: DataType.DECIMAL(5, 2)
    })    
    userRating: number;

    @Column({
        allowNull: true    
    })  
    paymentTransactionId: string;

    @Column({
        allowNull: true
    })  
    subMerchantStatus: string;    

 

    @Column({
        allowNull: true    
    })    
    status: string;    

    @Column({
        allowNull: true    ,
        type: DataType.TEXT
    })    
    statusDesc: string;    

    @Column({
        allowNull: false,
        type: DataType.DECIMAL(13, 2)
    })
    kgPrice: number;

    @Column({
        allowNull: true
    })
    viewUnit: string;

    @Column({
        allowNull: true
    })
    viewUnitDesc: string;

    @Column({
        allowNull: true,
        type: DataType.DECIMAL(13, 2)
    })
    viewUnitAmount: number;

    @Column({
        allowNull: true,
        type: DataType.DECIMAL(13, 2)
    })
    viewUnitPrice: number;


    @Column({
        allowNull: false
    })
    productName: string;


    @Column({
        allowNull: false,
        defaultValue: 0.00,
        type: DataType.DECIMAL(13, 2)
    })
    price: number;

    @Column({
        allowNull: false,
        defaultValue: 0.00,
        type: DataType.DECIMAL(13, 2)
    })
    paidPrice: number;    

    @Column({
        allowNull: false
    })
    pounit: string;

    @Column({
        allowNull: true
    })
    pounitTitle: string;    

    @Column({
        allowNull: true
    })
    pounitWeight: string;       

    @Column({
        allowNull: false,
        type: DataType.TEXT
    })
    pounitdesc: string;

    @Column({
        allowNull: true    
    })
    orderitemnum: string;


    @Column({
        allowNull: false,
        defaultValue: 0,
        type: DataType.DECIMAL(13, 2)
    })
    pounitkgRatio: number;

    @Column({
        allowNull: false,
        defaultValue: 0,
        type: DataType.DECIMAL(13, 2)
    })
    pounitPrice: number;

    @Column({
        allowNull: false
    })
    shipmentType: string;

    @Column({
        allowNull: true
    })
    shipmentTypeText: string;

    @Column({
        allowNull: false
    })
    shipmentHowTo: string;

    @Column({
        allowNull: true
    })
    shipmentHowToText: string;

    @Column({
        allowNull: true
    })
    shipmentdate: Date;

    @Column({
        allowNull: true
    })
    shipmenthour: number;

    @Column({
        allowNull: true
    })
    shipmenthourText: string;

    @Column({
        allowNull: false
    })
    paymentType: string;

    @Column({
        allowNull: true
    })
    paymentTypeText: string;

    @Column({
        allowNull: true
    })
    shipmentInformMe: boolean;    


    @Column({
        allowNull: true
    })
    dispatcherType: string;  

    @Column({
        allowNull: true
    })
    dispatcherName: string;      

    @Column({
        allowNull: true,
        type: DataType.DECIMAL(13, 2)
    })
    dispatcherFee: number;     

 

    @Column({
        allowNull: true,
        type: DataType.DECIMAL(13, 2)
    })
    dispatchertotalForFree: number;       

    @Column({
        allowNull: false,
        type: DataType.DECIMAL(13, 2)
    })
    discountTotal: number;

    @Column({
        allowNull: false,
        type: DataType.DECIMAL(13, 2)
    })
    shippingTotal: number;

    @Column({
        allowNull: false,
        type: DataType.DECIMAL(13, 2)
    })
    butcherSubTotal: number;    

    @Column({
        allowNull: false,
        type: DataType.DECIMAL(13, 2)
    })
    butcherTotal: number;


    @Column({
        allowNull: true
    })
    note: string;

    get productTypeManager() {
        let result = ProductTypeFactory.create(this.productType, {});
        result.loadFromOrderItem(this);
        return result;
    }

    static fromShopcardItem(sc: ShopCard, i: ShopcardItem) {
        let c = new OrderItem();
        c.productid = i.product.id;
        c.price = i.price;
        c.status = OrderItemStatus.supplying;
        c.productName = i.product.name;
        c.kgPrice = i.product.kgPrice;
        c.orderitemnum = orderid.generate();
        c.productType = i.product.productType;
        let prodMan = ProductTypeFactory.create(c.productType, i.productTypeData);
        prodMan.saveToOrderItem(c);
        // c.viewUnit = i.product.viewUnit;
        // c.viewUnitAmount = i.product.viewUnitAmount;
        // c.viewUnitDesc = i.product.viewUnitDesc;
        // c.viewUnitPrice = i.product.viewUnitPrice;
        c.butcherid = i.product.butcher.id;
        c.shipmentHowTo = sc.shipment[c.butcherid].howTo;
        c.shipmentHowToText = sc.shipment[c.butcherid].howToDesc;
        c.paymentType = sc.payment[c.butcherid].type;
        c.paymentTypeText = sc.payment[c.butcherid].desc;
        c.shipmentType = sc.shipment[c.butcherid].type;
        c.shipmentTypeText = sc.shipment[c.butcherid].desc;
        c.shipmentdate = sc.shipment[c.butcherid].days[0] ? Helper.newDate(sc.shipment[c.butcherid].days[0]): null;
        c.shipmenthour = sc.shipment[c.butcherid].hours[0];
        c.shipmenthourText = sc.shipment[c.butcherid].hoursText[0];
        c.shipmentInformMe = sc.shipment[c.butcherid].informMe;

        // if (sc.shipment[c.butcherid].dispatcher) {
        //     c.dispatcherid = sc.shipment[c.butcherid].dispatcher.id;
        //     c.dispatcherFee = sc.shipment[c.butcherid].dispatcher.fee;
        //     c.dispatcherName = sc.shipment[c.butcherid].dispatcher.name;
        //     c.dispatcherType = sc.shipment[c.butcherid].dispatcher.type;
        //     c.dispatchertotalForFree = sc.shipment[c.butcherid].dispatcher.totalForFree;            
        // }

        c.quantity = i.quantity;
        c.pounit = i.purchaseoption.unit;
        c.pounitTitle = i.purchaseoption.unitTitle;
        c.pounitWeight = i.purchaseoption.unitWeight;
        c.pounitdesc = i.purchaseoption.desc;
        c.pounitPrice = i.purchaseoption.unitPrice;
        c.pounitkgRatio = i.purchaseoption.kgRatio;
        
        c.discountTotal = sc.getButcherDiscountTotal(c.butcherid);
        c.shippingTotal = sc.getShippingCostOfCustomer(c.butcherid);
        c.butcherTotal = sc.getButcherTotal(c.butcherid);
        c.butcherSubTotal = sc.butchers[c.butcherid].subTotal;
        c.note = i.note;

        return c;
    }

}

export { Order, OrderItem };