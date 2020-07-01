"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var Order_1, OrderItem_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderItem = exports.Order = void 0;
const sequelize_typescript_1 = require("sequelize-typescript");
const basemodel_1 = require("./basemodel");
const helper_1 = require("../../lib/helper");
const shopcard_1 = require("../../models/shopcard");
const product_1 = require("./product");
const butcher_1 = require("./butcher");
const order_1 = require("../../models/order");
const dispatcher_1 = require("./dispatcher");
const common_1 = require("../../lib/common");
const orderid = require('order-id')('dkfjsdklfjsdlkg450435034.,');
let Order = Order_1 = class Order extends basemodel_1.default {
    constructor() {
        super(...arguments);
        this.isFirstButcherOrder = false;
        this.isFirstOrder = false;
        this.workedAccounts = [];
        this.butcherPuanAccounts = [];
        this.kalittePuanAccounts = [];
        this.kalitteOnlyPuanAccounts = [];
        this.kalitteByButcherPuanAccounts = [];
        this.butcherDeptAccounts = [];
        this.puanSummary = [];
    }
    get shopcard() {
        return JSON.parse(this.getDataValue('shopcardjson').toString());
    }
    set shopcard(value) {
        this.setDataValue('shopcardjson', Buffer.from(JSON.stringify(value), "utf-8"));
    }
    static fromShopcard(c, bi) {
        return __awaiter(this, void 0, void 0, function* () {
            let o = new Order_1();
            o.ordernum = orderid.generate();
            o.note = c.note;
            o.status = order_1.OrderItemStatus.supplying;
            let firstDiscount = c.getButcherDiscount(bi, shopcard_1.firstOrderDiscount.code);
            o.isFirstButcherOrder = firstDiscount != null;
            o.discountTotal = c.getButcherDiscountTotal(bi);
            o.subTotal = c.butchers[bi].subTotal;
            o.shippingTotal = c.getShippingCost(bi);
            o.total = c.getButcherTotal(bi);
            o.areaLevel1Id = c.address.level1Id;
            o.areaLevel3Id = c.address.level3Id;
            o.areaLevel1Text = c.address.level1Text;
            o.areaLevel3Text = c.address.level3Text;
            o.email = c.address.email;
            o.address = c.address.adres;
            o.shipLocation = c.address.location;
            o.shipLocationAccuracy = c.address.accuracy;
            o.phone = c.address.phone;
            o.name = c.address.name;
            o.saveAddress = c.address.saveaddress;
            o.noInteraction = c.shipment[bi].nointeraction;
            if (c.shipment[bi].dispatcher) {
                o.dispatcherid = c.shipment[bi].dispatcher.id;
                o.dispatcherFee = c.shipment[bi].dispatcher.fee;
                o.dispatcherName = c.shipment[bi].dispatcher.name;
                o.dispatcherType = c.shipment[bi].dispatcher.type;
                o.dispatchertotalForFree = c.shipment[bi].dispatcher.totalForFree;
                o.dispatcherLocation = c.shipment[bi].dispatcher.location;
                if (o.shipLocation && o.dispatcherLocation) {
                    o.dispatcherDistance = helper_1.default.distance(o.shipLocation, o.dispatcherLocation);
                }
            }
            o.shipmentHowTo = c.shipment[bi].howTo;
            o.shipmentHowToText = c.shipment[bi].howToDesc;
            o.paymentType = c.payment[bi].type;
            o.paymentTypeText = c.payment[bi].desc;
            o.shipmentType = c.shipment[bi].type;
            o.shipmentTypeText = c.shipment[bi].desc;
            o.shipmentdate = c.shipment[bi].days[0] ? new Date(c.shipment[bi].days[0]) : null;
            o.shipmenthour = c.shipment[bi].hours[0];
            o.shipmenthourText = c.shipment[bi].hoursText[0];
            o.shipmentInformMe = c.shipment[bi].informMe;
            return o;
        });
    }
};
__decorate([
    sequelize_typescript_1.Column({
        allowNull: false,
    }),
    __metadata("design:type", Number)
], Order.prototype, "userId", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: false,
        defaultValue: false
    }),
    __metadata("design:type", Boolean)
], Order.prototype, "noInteraction", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: false,
    }),
    __metadata("design:type", String)
], Order.prototype, "ordernum", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: true
    }),
    __metadata("design:type", String)
], Order.prototype, "paymentId", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: false,
        defaultValue: order_1.OrderSource.kasaptanal
    }),
    __metadata("design:type", String)
], Order.prototype, "orderSource", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: true
    }),
    __metadata("design:type", String)
], Order.prototype, "paymentTransactionId", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: true
    }),
    __metadata("design:type", String)
], Order.prototype, "subMerchantStatus", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: true
    }),
    __metadata("design:type", String)
], Order.prototype, "ordergroupnum", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: true,
        type: sequelize_typescript_1.DataType.TEXT
    }),
    __metadata("design:type", String)
], Order.prototype, "note", void 0);
__decorate([
    sequelize_typescript_1.ForeignKey(() => butcher_1.default),
    __metadata("design:type", Number)
], Order.prototype, "butcherid", void 0);
__decorate([
    sequelize_typescript_1.BelongsTo(() => butcher_1.default, "butcherid"),
    __metadata("design:type", butcher_1.default)
], Order.prototype, "butcher", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: false,
        defaultValue: 'belli değil'
    }),
    __metadata("design:type", String)
], Order.prototype, "butcherName", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: false,
    }),
    __metadata("design:type", String)
], Order.prototype, "name", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: false,
    }),
    __metadata("design:type", String)
], Order.prototype, "email", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: false,
    }),
    __metadata("design:type", String)
], Order.prototype, "phone", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: true
    }),
    __metadata("design:type", Number)
], Order.prototype, "areaLevel1Id", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: true
    }),
    __metadata("design:type", Number)
], Order.prototype, "areaLevel2Id", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: true
    }),
    __metadata("design:type", Number)
], Order.prototype, "areaLevel3Id", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: false,
        defaultValue: true
    }),
    __metadata("design:type", Boolean)
], Order.prototype, "saveAddress", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: true
    }),
    __metadata("design:type", String)
], Order.prototype, "address", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: true
    }),
    __metadata("design:type", String)
], Order.prototype, "areaLevel1Text", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: true
    }),
    __metadata("design:type", String)
], Order.prototype, "areaLevel2Text", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: true
    }),
    __metadata("design:type", String)
], Order.prototype, "areaLevel3Text", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: true,
        type: sequelize_typescript_1.DataType.GEOMETRY('POINT')
    }),
    __metadata("design:type", Object)
], Order.prototype, "shipLocation", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", Number)
], Order.prototype, "shipLocationAccuracy", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: true,
        type: sequelize_typescript_1.DataType.GEOMETRY('POINT')
    }),
    __metadata("design:type", Object)
], Order.prototype, "dispatcherLocation", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: true
    }),
    __metadata("design:type", Number)
], Order.prototype, "dispatcherDistance", void 0);
__decorate([
    sequelize_typescript_1.HasMany(() => OrderItem, {
        sourceKey: "id",
        foreignKey: "orderid",
    }),
    __metadata("design:type", Array)
], Order.prototype, "items", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: false,
        type: sequelize_typescript_1.DataType.DECIMAL(13, 2)
    }),
    __metadata("design:type", Number)
], Order.prototype, "subTotal", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: false,
        type: sequelize_typescript_1.DataType.DECIMAL(13, 2)
    }),
    __metadata("design:type", Number)
], Order.prototype, "discountTotal", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: false,
        type: sequelize_typescript_1.DataType.DECIMAL(13, 2)
    }),
    __metadata("design:type", Number)
], Order.prototype, "shippingTotal", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: false,
        type: sequelize_typescript_1.DataType.DECIMAL(13, 2)
    }),
    __metadata("design:type", Number)
], Order.prototype, "total", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: false,
        type: sequelize_typescript_1.DataType.DECIMAL(13, 2),
        defaultValue: 0.00
    }),
    __metadata("design:type", Number)
], Order.prototype, "paidTotal", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: true
    }),
    __metadata("design:type", String)
], Order.prototype, "status", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: true,
        type: sequelize_typescript_1.DataType.TEXT
    }),
    __metadata("design:type", String)
], Order.prototype, "statusDesc", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", Buffer)
], Order.prototype, "shopcardjson", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: true,
        type: sequelize_typescript_1.DataType.DECIMAL(5, 2)
    }),
    __metadata("design:type", Number)
], Order.prototype, "userRating", void 0);
__decorate([
    sequelize_typescript_1.ForeignKey(() => dispatcher_1.default),
    __metadata("design:type", Number)
], Order.prototype, "dispatcherid", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: true
    }),
    __metadata("design:type", String)
], Order.prototype, "dispatcherType", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: true
    }),
    __metadata("design:type", String)
], Order.prototype, "dispatcherName", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: true,
        type: sequelize_typescript_1.DataType.DECIMAL(13, 2)
    }),
    __metadata("design:type", Number)
], Order.prototype, "dispatcherFee", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: true,
        type: sequelize_typescript_1.DataType.DECIMAL(13, 2)
    }),
    __metadata("design:type", Number)
], Order.prototype, "dispatchertotalForFree", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: true
    }),
    __metadata("design:type", String)
], Order.prototype, "shipmentType", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: true
    }),
    __metadata("design:type", String)
], Order.prototype, "shipmentTypeText", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: true
    }),
    __metadata("design:type", String)
], Order.prototype, "shipmentHowTo", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: true
    }),
    __metadata("design:type", String)
], Order.prototype, "shipmentHowToText", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: true
    }),
    __metadata("design:type", String)
], Order.prototype, "securityCode", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: true
    }),
    __metadata("design:type", Date)
], Order.prototype, "shipmentdate", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: true
    }),
    __metadata("design:type", Number)
], Order.prototype, "shipmenthour", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: true
    }),
    __metadata("design:type", String)
], Order.prototype, "shipmenthourText", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: true
    }),
    __metadata("design:type", String)
], Order.prototype, "paymentType", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: true
    }),
    __metadata("design:type", String)
], Order.prototype, "paymentStatus", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: true
    }),
    __metadata("design:type", String)
], Order.prototype, "paymentTypeText", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: true
    }),
    __metadata("design:type", Boolean)
], Order.prototype, "shipmentInformMe", void 0);
Order = Order_1 = __decorate([
    sequelize_typescript_1.Table({
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
], Order);
exports.Order = Order;
let OrderItem = OrderItem_1 = class OrderItem extends basemodel_1.default {
    get productTypeManager() {
        let result = common_1.ProductTypeFactory.create(this.productType, {});
        result.loadFromOrderItem(this);
        return result;
    }
    static fromShopcardItem(sc, i) {
        let c = new OrderItem_1();
        c.productid = i.product.id;
        c.price = i.price;
        c.status = order_1.OrderItemStatus.supplying;
        c.productName = i.product.name;
        c.kgPrice = i.product.kgPrice;
        c.orderitemnum = orderid.generate();
        c.productType = i.product.productType;
        let prodMan = common_1.ProductTypeFactory.create(c.productType, i.productTypeData);
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
        c.shipmentdate = sc.shipment[c.butcherid].days[0] ? new Date(sc.shipment[c.butcherid].days[0]) : null;
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
        c.pounitTitle = i.purchaseoption.unitTitle;
        c.pounitWeight = i.purchaseoption.unitWeight;
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
};
__decorate([
    sequelize_typescript_1.ForeignKey(() => Order),
    __metadata("design:type", Number)
], OrderItem.prototype, "orderid", void 0);
__decorate([
    sequelize_typescript_1.BelongsTo(() => Order, "orderid"),
    __metadata("design:type", Order)
], OrderItem.prototype, "order", void 0);
__decorate([
    sequelize_typescript_1.ForeignKey(() => product_1.default),
    __metadata("design:type", Number)
], OrderItem.prototype, "productid", void 0);
__decorate([
    sequelize_typescript_1.BelongsTo(() => product_1.default, "productid"),
    __metadata("design:type", product_1.default)
], OrderItem.prototype, "product", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: false,
        defaultValue: 'generic'
    }),
    __metadata("design:type", String)
], OrderItem.prototype, "productType", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: true
    }),
    __metadata("design:type", String)
], OrderItem.prototype, "custom1", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: true
    }),
    __metadata("design:type", String)
], OrderItem.prototype, "custom2", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: true
    }),
    __metadata("design:type", String)
], OrderItem.prototype, "custom3", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: true
    }),
    __metadata("design:type", String)
], OrderItem.prototype, "custom4", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: true
    }),
    __metadata("design:type", String)
], OrderItem.prototype, "custom5", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: true
    }),
    __metadata("design:type", String)
], OrderItem.prototype, "custom6", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: true
    }),
    __metadata("design:type", String)
], OrderItem.prototype, "custom7", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: true
    }),
    __metadata("design:type", String)
], OrderItem.prototype, "custom8", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: true
    }),
    __metadata("design:type", String)
], OrderItem.prototype, "custom9", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: false,
        type: sequelize_typescript_1.DataType.DECIMAL(13, 2)
    }),
    __metadata("design:type", Number)
], OrderItem.prototype, "quantity", void 0);
__decorate([
    sequelize_typescript_1.ForeignKey(() => butcher_1.default),
    __metadata("design:type", Number)
], OrderItem.prototype, "butcherid", void 0);
__decorate([
    sequelize_typescript_1.BelongsTo(() => butcher_1.default, "butcherid"),
    __metadata("design:type", butcher_1.default)
], OrderItem.prototype, "butcher", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: true,
        type: sequelize_typescript_1.DataType.DECIMAL(5, 2)
    }),
    __metadata("design:type", Number)
], OrderItem.prototype, "userRating", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: true
    }),
    __metadata("design:type", String)
], OrderItem.prototype, "paymentTransactionId", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: true
    }),
    __metadata("design:type", String)
], OrderItem.prototype, "subMerchantStatus", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: true
    }),
    __metadata("design:type", String)
], OrderItem.prototype, "status", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: true,
        type: sequelize_typescript_1.DataType.TEXT
    }),
    __metadata("design:type", String)
], OrderItem.prototype, "statusDesc", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: false,
        type: sequelize_typescript_1.DataType.DECIMAL(13, 2)
    }),
    __metadata("design:type", Number)
], OrderItem.prototype, "kgPrice", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: true
    }),
    __metadata("design:type", String)
], OrderItem.prototype, "viewUnit", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: true
    }),
    __metadata("design:type", String)
], OrderItem.prototype, "viewUnitDesc", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: true,
        type: sequelize_typescript_1.DataType.DECIMAL(13, 2)
    }),
    __metadata("design:type", Number)
], OrderItem.prototype, "viewUnitAmount", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: true,
        type: sequelize_typescript_1.DataType.DECIMAL(13, 2)
    }),
    __metadata("design:type", Number)
], OrderItem.prototype, "viewUnitPrice", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: false
    }),
    __metadata("design:type", String)
], OrderItem.prototype, "productName", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: false,
        defaultValue: 0.00,
        type: sequelize_typescript_1.DataType.DECIMAL(13, 2)
    }),
    __metadata("design:type", Number)
], OrderItem.prototype, "price", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: false,
        defaultValue: 0.00,
        type: sequelize_typescript_1.DataType.DECIMAL(13, 2)
    }),
    __metadata("design:type", Number)
], OrderItem.prototype, "paidPrice", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: false
    }),
    __metadata("design:type", String)
], OrderItem.prototype, "pounit", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: true
    }),
    __metadata("design:type", String)
], OrderItem.prototype, "pounitTitle", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: true
    }),
    __metadata("design:type", String)
], OrderItem.prototype, "pounitWeight", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: false,
        type: sequelize_typescript_1.DataType.TEXT
    }),
    __metadata("design:type", String)
], OrderItem.prototype, "pounitdesc", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: true
    }),
    __metadata("design:type", String)
], OrderItem.prototype, "orderitemnum", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: false,
        defaultValue: 0,
        type: sequelize_typescript_1.DataType.DECIMAL(13, 2)
    }),
    __metadata("design:type", Number)
], OrderItem.prototype, "pounitkgRatio", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: false,
        defaultValue: 0,
        type: sequelize_typescript_1.DataType.DECIMAL(13, 2)
    }),
    __metadata("design:type", Number)
], OrderItem.prototype, "pounitPrice", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: false
    }),
    __metadata("design:type", String)
], OrderItem.prototype, "shipmentType", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: true
    }),
    __metadata("design:type", String)
], OrderItem.prototype, "shipmentTypeText", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: false
    }),
    __metadata("design:type", String)
], OrderItem.prototype, "shipmentHowTo", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: true
    }),
    __metadata("design:type", String)
], OrderItem.prototype, "shipmentHowToText", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: true
    }),
    __metadata("design:type", Date)
], OrderItem.prototype, "shipmentdate", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: true
    }),
    __metadata("design:type", Number)
], OrderItem.prototype, "shipmenthour", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: true
    }),
    __metadata("design:type", String)
], OrderItem.prototype, "shipmenthourText", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: false
    }),
    __metadata("design:type", String)
], OrderItem.prototype, "paymentType", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: true
    }),
    __metadata("design:type", String)
], OrderItem.prototype, "paymentTypeText", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: true
    }),
    __metadata("design:type", Boolean)
], OrderItem.prototype, "shipmentInformMe", void 0);
__decorate([
    sequelize_typescript_1.ForeignKey(() => dispatcher_1.default),
    __metadata("design:type", Number)
], OrderItem.prototype, "dispatcherid", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: true
    }),
    __metadata("design:type", String)
], OrderItem.prototype, "dispatcherType", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: true
    }),
    __metadata("design:type", String)
], OrderItem.prototype, "dispatcherName", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: true,
        type: sequelize_typescript_1.DataType.DECIMAL(13, 2)
    }),
    __metadata("design:type", Number)
], OrderItem.prototype, "dispatcherFee", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: true,
        type: sequelize_typescript_1.DataType.DECIMAL(13, 2)
    }),
    __metadata("design:type", Number)
], OrderItem.prototype, "dispatchertotalForFree", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: false,
        type: sequelize_typescript_1.DataType.DECIMAL(13, 2)
    }),
    __metadata("design:type", Number)
], OrderItem.prototype, "discountTotal", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: false,
        type: sequelize_typescript_1.DataType.DECIMAL(13, 2)
    }),
    __metadata("design:type", Number)
], OrderItem.prototype, "shippingTotal", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: false,
        type: sequelize_typescript_1.DataType.DECIMAL(13, 2)
    }),
    __metadata("design:type", Number)
], OrderItem.prototype, "butcherSubTotal", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: false,
        type: sequelize_typescript_1.DataType.DECIMAL(13, 2)
    }),
    __metadata("design:type", Number)
], OrderItem.prototype, "butcherTotal", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: true
    }),
    __metadata("design:type", String)
], OrderItem.prototype, "note", void 0);
OrderItem = OrderItem_1 = __decorate([
    sequelize_typescript_1.Table({
        tableName: "OrderItems",
        indexes: [{
                fields: ['orderId'],
                name: 'orderid_idx'
            }]
    })
], OrderItem);
exports.OrderItem = OrderItem;
