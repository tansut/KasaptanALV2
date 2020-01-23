export interface PurchaseOption {
    id: number;
    unit: string,
    unitTitle: string,
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
    weigthNote: string
}

export interface ProductButcherView {
    slug: string;
    name: string;
    id: number;
    
}

export interface DispatcherView {
    id: number;
    name: string;
}

export interface ProductView {
    id: number;
    butcher?: ProductButcherView;
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
}