import Product from "../db/models/product";

export interface IOffer {
    '@type': string;
    unit_pricing_measure?: string;
    unit_pricing_base_measure?: string;
    highPrice: number;
    lowPrice: number;
    offerCount: number;
    unit?: string; 
    priceCurrency: string;
    availability: string;
}

export interface IBrand {
    '@type': string;
    name: string;
}

export interface IProductLd {
    '@context': string;
    '@type': string;
    name: string;
    image: string[];
    description: string;
    sku: string;
    brand: IBrand;
    identifier_exists: string;
    offers?: IOffer
    aggregateRating: IAggregateRating;

}

export interface IAggregateRating {
    '@type': string;
    ratingValue: number;
    ratingCount: number;
    bestRating: number;
    // reviewCount: number;
}

export class ProductLd implements IProductLd {
    '@context': string = 'https://schema.org/';
    '@type': string = "Product";
    name: string;
    image: string [];
    description: string;    
    sku: string;
    brand: IBrand;
    offers?: IOffer;
    identifier_exists = 'no'
    aggregateRating: IAggregateRating;
 
    constructor(product: Product) {
        this.name = product.name;
        this.description = product.generatedDesc;
        this.image = [];
        this.sku = product.slug;
        product.resources.forEach(r=> {
            if (!r.tag1 && r.list) {
                this.image.push(r.getFileUrl())
            }
        })
        this.aggregateRating = {
            "@type": "AggregateRating",
            ratingCount: product.reviewCount,
            ratingValue: product.ratingValue,
            bestRating: 5
        }
        this.brand = {
            '@type': 'Thing',
            name: 'KasaptanAl.com'
        }
    }
}