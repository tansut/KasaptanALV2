import Butcher from "../db/models/butcher";


export interface IReview {
    '@context': string;
    '@type': string;
    "reviewRating": {
        "@type": string,
        "ratingValue": string,
        "bestRating": string
      },
      "author": {
        "@type": string,
        "name": string
      }
}
