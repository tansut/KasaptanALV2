"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderSource = exports.OrderPaymentStatus = exports.OrderType = exports.DeliveryStatusDesc = exports.OrderItemStatus = void 0;
var OrderItemStatus;
(function (OrderItemStatus) {
    OrderItemStatus["supplying"] = "tedarik s\u00FCrecinde";
    OrderItemStatus["shipping"] = "teslim edilecek";
    // waiting = 'teslim edilecek/kurye bekleniyor',
    OrderItemStatus["success"] = "teslim edildi";
    OrderItemStatus["successPartial"] = "k\u0131smen teslim edildi";
    OrderItemStatus["customerCanceled"] = "iptal: m\u00FC\u015Fteri";
    OrderItemStatus["butcherCannotShip"] = "iptal: teslimat yap\u0131lamad\u0131";
    OrderItemStatus["butcherCannotProvide"] = "iptal: tedarik edilemedi";
})(OrderItemStatus = exports.OrderItemStatus || (exports.OrderItemStatus = {}));
exports.DeliveryStatusDesc = {
    invalid: 'Invalid draft delivery',
    draft: 'Draft delivery',
    planned: 'Planlandı',
    active: 'Yolda',
    finished: 'Tamamlandı',
    canceled: 'İptal edildi',
    delayed: 'Gecikme var',
    failed: 'Müşteri bulunamadı, başarısız',
    courier_assigned: 'Kurye atandı, süreç başlayacak',
    courier_departed: 'Kasaba ulaşıldı',
    parcel_picked_up: 'Paket kasaptan alındı',
    courier_arrived: 'Müşteri bekleniyor',
    deleted: 'Silindi'
};
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
