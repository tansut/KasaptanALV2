"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ButcherLd = void 0;
class ButcherLd {
    constructor(butcher) {
        this['@context'] = 'https://schema.org/';
        this['@type'] = "LocalBusiness";
        this.name = butcher.name;
        this.image = [];
        butcher.resources.forEach(r => {
            if (!r.tag1 && r.list) {
                this.image.push(r.getFileUrl());
            }
        });
        this.address = {
            "@type": "PostalAddress",
            "streetAddress": butcher.address,
            "addressLocality": butcher.areaLevel1.name,
            "postalCode": butcher.postal,
            "addressCountry": "TR"
        },
            this["@id"] = `${'https://www.kasaptanal.com'}/${butcher.slug}`;
        this.menu = `${'https://www.kasaptanal.com'}/${butcher.slug}`;
        this.url = `${'https://www.kasaptanal.com'}/${butcher.slug}`;
        if (butcher.lat && butcher.lng) {
            this.geo = {
                "@type": "GeoCoordinates",
                "latitude": butcher.lat,
                "longitude": butcher.lng
            };
        }
        this.aggregateRating = {
            "@type": "AggregateRating",
            ratingCount: butcher.userRatingCount,
            ratingValue: butcher.userRating
        };
    }
}
exports.ButcherLd = ButcherLd;
