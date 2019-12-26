export type PaymentType = 'cashondoor' | 'creditcardondoor';



export let PaymentTypeDesc = {
    "cashondoor": "Teslim alırken nakit",
    "creditcardondoor": "Teslim alırken kredi kartı"
}

export class Payment {
    type= 'cashondoor';
    desc = PaymentTypeDesc["cashondoor"];
}