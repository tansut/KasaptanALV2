import { Badge } from "./badge";
import { Puan } from "./puan";
import { PriceSlice } from "../lib/logistic/core";
import { NutritionView, PriceView } from "./common";
import { ShipmentDayHours } from "./shipment";

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
    shipday0: boolean;
    shipday1: boolean;
    shipday2: boolean;
    shipday3: boolean;
    shipday4: boolean;
    shipday5: boolean;
    shipday6: boolean;
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
    shipSuccessText: string;
    puanData: Puan;    
    locationText: string;
    earnedPuan: number;
    description: string;
}

export interface ProductDispatcherView {
    type: string;
    id: number;
    minCalculated: number;
    fee: number;
    totalForFree: number;
    priceInfo: string;
    userNote: string;
    takeOnly: boolean;
    distance: number;
    priceSlice: PriceSlice [];
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
    butcherLongNote?: string;
    dispatcher?: ProductDispatcherView
    slug: string;
    kgPrice: number;
    name: string;
    productType: string;
    priceView: PriceView;
    // viewUnitPrice: number;
    // viewUnit: string;
    // viewUnitDesc: string;
    // viewUnitAmount: number;
    shortDesc: string;
    notePlaceholder: string;
    purchaseOptions: PurchaseOption[];
    //defaultUnit: number
    resources?: ResourceView[];
    nutritionView: NutritionView;
    shipmentDayHours: ShipmentDayHours [];
    alternateButchers: AlternateButchersView[]
}