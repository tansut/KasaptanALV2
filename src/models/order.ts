// export enum OrderStatus {
//     preparing = 'tedarik sürecinde',    
//     willbeshipped = 'gönderilecek',
//     shipped = 'gönderildi',    
// }



export enum OrderItemStatus {    
    supplying = 'tedarik sürecinde',
    shipping = 'teslim edilecek',
    success = 'teslim edildi',
    successPartial = 'kısmen teslim edildi',
    customerCanceled= 'iptal: müşteri',
    butcherCannotShip = 'iptal: kasap teslimatı yapamadı',
    butcherCannotProvide = 'iptal: kasap ürünü sağlayamadı'
}