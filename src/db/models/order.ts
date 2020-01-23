import { Table, Column, DataType, Model, HasMany, CreatedAt, UpdatedAt, DeletedAt, Unique, Default, AllowNull, ForeignKey, BelongsTo } from 'sequelize-typescript';
import BaseModel from "./basemodel"
import Helper from '../../lib/helper';
import { ShopCard, ShopcardItem } from '../../models/shopcard';
import Product from './product';
import Butcher from './butcher';
import { OrderItemStatus } from '../../models/order';
import Dispatcher from './dispatcher';
const orderid = require('order-id')('dkfjsdklfjsdlkg450435034.,')

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
    @Column({
        allowNull: false,
    })
    userId: number;

    @Column({
        allowNull: false,
    })
    ordernum: string;

    @Column({
        allowNull: true,
        type: DataType.TEXT
    })
    note: string;

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
        allowNull: false
    })
    areaLevel1Id: number;

    @Column({
        allowNull: false
    })
    areaLevel2Id: number;

    @Column({
        allowNull: false
    })
    areaLevel3Id: number;

    @Column({
        allowNull: false,
        defaultValue: true
    })
    saveAddress: boolean;

    @Column({
        allowNull: false
    })
    address: string;

    @Column({
        allowNull: false
    })
    areaLevel1Text: string;

    @Column({
        allowNull: false
    })
    areaLevel2Text: string;

    @Column({
        allowNull: false
    })
    areaLevel3Text: string;


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

    @Column
    shopcardjson: Buffer

    get shopcard(): Object {
        return JSON.parse((<Buffer>this.getDataValue('shopcardjson')).toString())
    }

    set shopcard(value: Object) {
        this.setDataValue('shopcardjson', Buffer.from(JSON.stringify(value), "utf-8"));
    }

    static fromShopcard(c: ShopCard): Order {
        let o = new Order();
        o.ordernum = orderid.generate();
        o.note = c.note;
        //o.status = OrderStatus.preparing;
        o.subTotal = c.subTotal;
        o.discountTotal = c.discountTotal;
        o.shippingTotal = c.shippingTotal;
        o.total = c.total;

        o.areaLevel1Id = c.address.level1Id;
        o.areaLevel3Id = c.address.level3Id;
        o.areaLevel1Text = c.address.level1Text;
        o.areaLevel3Text = c.address.level3Text;
        o.email = c.address.email;
        o.address = c.address.adres;
        o.phone = c.address.phone;
        o.name = c.address.name;
        o.saveAddress = c.address.saveaddress;
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
        type: DataType.DECIMAL(13, 2)
    })
    quantity: number;

    @ForeignKey(() => Butcher)
    butcherid: number;

    @BelongsTo(() => Butcher, "butcherid")
    butcher: Butcher;

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
        allowNull: true
    })
    status: string;

    @Column({
        allowNull: false,
        defaultValue: 0,
        type: DataType.DECIMAL(13, 2)
    })
    price: number;

    @Column({
        allowNull: false
    })
    pounit: string;

    @Column({
        allowNull: false,
        type: DataType.TEXT
    })
    pounitdesc: string;

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
    note: string;

    @Column({
        allowNull: true
    })
    shipmentInformMe: boolean;    

    @ForeignKey(() => Dispatcher)
    dispatcherid: number;

    // @BelongsTo(() => Dispatcher, "dispatcherid")
    // dispatcher: Dispatcher;

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


    static fromShopcardItem(sc: ShopCard, i: ShopcardItem) {
        let c = new OrderItem();
        c.productid = i.product.id;
        c.price = i.price;
        c.status = OrderItemStatus.supplying;
        c.productName = i.product.name;
        c.kgPrice = i.product.kgPrice;
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
        c.shipmentdate = sc.shipment[c.butcherid].days[0] ? new Date(sc.shipment[c.butcherid].days[0]): null;
        c.shipmenthour = sc.shipment[c.butcherid].hours[0];
        c.shipmenthourText = sc.shipment[c.butcherid].hoursText[0];
        c.shipmentInformMe = sc.shipment[c.butcherid].informMe;

        if (sc.shipment[c.butcherid].dispatcher) {
            c.dispatcherid = sc.shipment[c.butcherid].dispatcher.id;
            c.dispatcherFee = sc.shipment[c.butcherid].dispatcher.fee;
            c.dispatcherName = sc.shipment[c.butcherid].dispatcher.name;
            c.dispatcherType = sc.shipment[c.butcherid].dispatcher.type;
            c.dispatchertotalForFree = sc.shipment[c.butcherid].dispatcher.totalForFree;            
        }

        c.quantity = i.quantity;
        c.pounit = i.purchaseoption.unit;
        c.pounitdesc = i.purchaseoption.desc;
        c.pounitPrice = i.purchaseoption.unitPrice;
        c.pounitkgRatio = i.purchaseoption.kgRatio;
        
        c.discountTotal = sc.getButcherDiscountTotal(c.butcherid);
        c.shippingTotal = sc.getShippingCost(c.butcherid);
        c.butcherTotal = sc.getButcherTotal(c.butcherid);
        c.butcherSubTotal = sc.butchers[c.butcherid].subTotal;
        c.note = i.note;

        return c;
    }

}

export { Order, OrderItem };