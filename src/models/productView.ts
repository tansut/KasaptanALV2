import { Badge } from "./badge";
import { Puan } from "./puan";

export interface PurchaseOption {
    id: number;
    unit: string,
    unitTitle: string,
    unitWeight: string;
    desc: string,
    notePlaceholder: string;
    kgRatio: number,
    unitPrice: number,
    displayOrder: number;
    min: number;
    max: number;
    default: number;
    perPerson: number;
    step: number;
    weigthNote: string;
    
}

export interface ButcherPurchaseOption {
    unit: string;
    unitPrice: number;
}



export interface AlternateButchersView {
    butcher: ProductButcherView;
    dispatcher: ProductDispatcherView;    
    purchaseOptions: ButcherPurchaseOption[];
}

export interface ProductButcherView {
    slug: string;
    name: string;
    productNote: string;
    enableCreditCard: boolean;
    badges: Badge[];
    id: number;
    kgPrice: number;
    thumbnail?: string;
    userRatingAsPerc: number;
    shipRatingAsPerc: number;
    puanData: Puan;    
    earnedPuan: number;
}

export interface ProductDispatcherView {
    type: string;
    id: number;
    min: number;
    fee: number;
    totalForFree: number;
    priceInfo: string;
    userNote: string;
    takeOnly: boolean;
}



export interface ResourceView {
    id: number,
    title: string,
    thumbnailUrl: string,
    tag1: string,
    settings: any
}

export interface ProductView {
    id: number;
    butcher?: ProductButcherView;
    butcherNote?: string;
    dispatcher?: ProductDispatcherView
    slug: string;
    kgPrice: number;
    name: string;
    // viewUnitPrice: number;
    // viewUnit: string;
    // viewUnitDesc: string;
    // viewUnitAmount: number;
    shortDesc: string;
    notePlaceholder: string;
    purchaseOptions: PurchaseOption[];
    //defaultUnit: number
    resources?: ResourceView[];
    alternateButchers: AlternateButchersView[]
}