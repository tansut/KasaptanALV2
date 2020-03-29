export enum OrderItemStatus {    
    supplying = 'tedarik sürecinde',
    shipping = 'tedarik edildi, teslim edilecek',
    success = 'teslim edildi',
    successPartial = 'kısmen teslim edildi',
    customerCanceled= 'iptal: müşteri',
    butcherCannotShip = 'iptal: teslimat yapılamadı',
    butcherCannotProvide = 'iptal: tedarik edilemedi'
}


export enum OrderPaymentStatus {
    waitingOnlinePayment = 'Online Ödeme Bekliyor',
    manualPayment = 'Manuel Ödeme Yapılacak'

}