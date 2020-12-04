import { PuanResult } from "./puan";

export enum OrderItemStatus {    
    supplying = 'tedarik sürecinde',
    shipping = 'teslim edilecek',
    // waiting = 'teslim edilecek/kurye bekleniyor',
    success = 'teslim edildi',
    successPartial = 'kısmen teslim edildi',
    customerCanceled= 'iptal: müşteri',
    butcherCannotShip = 'iptal: teslimat yapılamadı',
    butcherCannotProvide = 'iptal: tedarik edilemedi'
}

export type DeliveryStatus = 'invalid' |  'draft' | 'planned' | 'active' | 'finished' | 'canceled' | 
    'delayed' | 
    'failed' |
    'courier_assigned' |
    'courier_departed' |
    'parcel_picked_up'|
    'courier_arrived' |
    'deleted';
    
export let DeliveryStatusDesc = {    
    invalid:'Invalid draft delivery',    
    draft:'Draft delivery',    
    planned:'Planlandı',
    active: 'Yolda',    
    finished:'Tamamlandı',
    canceled: 'İptal edildi',
    delayed: 'Gecikme var',
    failed: 'Müşteri bulunamadı, başarısız',   
    courier_assigned: 'Kurye atandı, süreç başlayacak',    
    courier_departed: 'Kasaba ulaşıldı',
    parcel_picked_up: 'Paket kasaptan alındı',
    courier_arrived: 'Müşteri bekleniyor',
    deleted: 'Silindi'
}


export enum OrderType {
    generic = 'generic',
    kurban = 'kurban'
}

export enum OrderPaymentStatus {
    waitingOnlinePayment = 'Online Ödeme Bekliyor',
    manualPayment = 'Manuel Ödeme Yapılacak'
}

export enum OrderSource {
    kasaptanal = 'kasaptanal.com',
    butcher = 'butcher'
}