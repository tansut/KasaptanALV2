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

export interface ProductButcherView {
    slug: string;
    name: string;
    id: number;
}

export interface DispatcherView {
    id: number;
    name: string;
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
}