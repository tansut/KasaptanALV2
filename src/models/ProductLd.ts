import Product from "../db/models/product";

export interface IOffer {
    '@type': string;
    highPrice: number;
    lowPrice: number;
    offerCount: number;
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
    offers?: IOffer
    aggregateRating: IAggregateRating;

}

export interface IAggregateRating {
    '@type': string;
    ratingValue: number;
    ratingCount: number;
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
    offers?: IOffer
    aggregateRating: IAggregateRating;
 
    constructor(product: Product) {
        this.name = product.name;
        this.description = product.generatedDesc;
        this.image = [];
        this.sku = product.slug;
        product.resources.forEach(r=> {
            if (!r.tag1 && r.list) {
                this.image.push('https://www.kasaptanal.com' + r.getFileUrl())
            }
        })
        this.aggregateRating = {
            "@type": "AggregateRating",
            ratingCount: product.reviewCount,
            ratingValue: product.ratingValue
        }
        this.brand = {
            '@type': 'Thing',
            name: 'kasaptanAl.com'
        }
    }
}