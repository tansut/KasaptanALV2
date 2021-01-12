import Butcher from "../db/models/butcher";
import { IAggregateRating } from "./ProductLd";


export interface IButcherLd {
    '@context': string;
    '@type': string;
    '@id': string;
    name: string;
    image: string[];
    geo?: Object;
    url: string;
    menu: string;
    aggregateRating: IAggregateRating;
    address: Object;

}



export class ButcherLd implements IButcherLd {
    '@context': string = 'https://schema.org/';
    '@type': string = "LocalBusiness";
    '@id': string;
    name: string;
    address: Object;
    image: string[];
    geo: Object;
    url: string;
    menu: string;
    aggregateRating: IAggregateRating;

    constructor(butcher: Butcher) {
        this.name = butcher.name;
        this.image = [];
        butcher.resources.forEach(r => {
            if (!r.tag1 && r.list) {
                this.image.push(r.getFileUrl())
            }
        })
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
            }
        }
        this.aggregateRating = {
            "@type": "AggregateRating",
            ratingCount: butcher.userRatingCount,
            ratingValue: butcher.userRating,
            bestRating: 5
        }

    }
}