export type PaymentType = 'onlinepayment' | 'cashondoor' | 'creditcardondoor' ;



export let PaymentTypeDesc = {
    "onlinepayment": "Online ödeme",
    "cashondoor": "Teslim alırken nakit",
    "creditcardondoor": "Teslim alırken kredi kartı"
}

export class Payment {
    type= 'cashondoor';
    desc = PaymentTypeDesc["cashondoor"];
}