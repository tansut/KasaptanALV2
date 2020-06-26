"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductLd = void 0;
class ProductLd {
    constructor(product) {
        this['@context'] = 'https://schema.org/';
        this['@type'] = "Product";
        this.identifier_exists = 'no';
        this.name = product.name;
        this.description = product.generatedDesc;
        this.image = [];
        this.sku = product.slug;
        product.resources.forEach(r => {
            if (!r.tag1 && r.list) {
                this.image.push(r.getFileUrl());
            }
        });
        this.aggregateRating = {
            "@type": "AggregateRating",
            ratingCount: product.reviewCount,
            ratingValue: product.ratingValue
        };
        this.brand = {
            '@type': 'Thing',
            name: 'kasaptanAl.com'
        };
    }
}
exports.ProductLd = ProductLd;
