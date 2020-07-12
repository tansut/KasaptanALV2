"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderSource = exports.OrderPaymentStatus = exports.OrderType = exports.OrderItemStatus = void 0;
var OrderItemStatus;
(function (OrderItemStatus) {
    OrderItemStatus["supplying"] = "tedarik s\u00FCrecinde";
    OrderItemStatus["shipping"] = "teslim edilecek";
    OrderItemStatus["success"] = "teslim edildi";
    OrderItemStatus["successPartial"] = "k\u0131smen teslim edildi";
    OrderItemStatus["customerCanceled"] = "iptal: m\u00FC\u015Fteri";
    OrderItemStatus["butcherCannotShip"] = "iptal: teslimat yap\u0131lamad\u0131";
    OrderItemStatus["butcherCannotProvide"] = "iptal: tedarik edilemedi";
})(OrderItemStatus = exports.OrderItemStatus || (exports.OrderItemStatus = {}));
var OrderType;
(function (OrderType) {
    OrderType["generic"] = "generic";
    OrderType["kurban"] = "kurban";
})(OrderType = exports.OrderType || (exports.OrderType = {}));
var OrderPaymentStatus;
(function (OrderPaymentStatus) {
    OrderPaymentStatus["waitingOnlinePayment"] = "Online \u00D6deme Bekliyor";
    OrderPaymentStatus["manualPayment"] = "Manuel \u00D6deme Yap\u0131lacak";
})(OrderPaymentStatus = exports.OrderPaymentStatus || (exports.OrderPaymentStatus = {}));
var OrderSource;
(function (OrderSource) {
    OrderSource["kasaptanal"] = "kasaptanal.com";
    OrderSource["butcher"] = "butcher";
})(OrderSource = exports.OrderSource || (exports.OrderSource = {}));

//# sourceMappingURL=order.js.map
