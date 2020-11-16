"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sm = void 0;
const base_1 = require("./base");
const product_1 = require("../routes/api/product");
const config_1 = require("../config");
class ProductFeedMiddleware extends base_1.default {
    constructor(app) {
        super(app);
        app.get('/productfeed.xml', this.ProductFeedXML.bind(this));
    }
    // <g:id>PFM654321</g:id>
    // <g:title>Dior Capture XP Ultimate Wrinkle Correction Creme 1.7 oz</g:title>
    // <g:description>Dior Capture XP Ultimate Wrinkle Correction Creme 1.7 oz reinvents anti-wrinkle care by protecting and relaunching skin cell activity to encourage faster, healthier regeneration.</g:description>
    // <g:link>http://www.example.com/perfumes/product?Dior%20Capture%20R6080%20XP</g:link>
    // <g:image_link>http://images.example.com/PFM654321_1.jpg</g:image_link>
    // <g:condition>new</g:condition>
    // <g:availability>in stock</g:availability>
    // <g:price>99 USD</g:price>
    // <g:shipping>
    //     <g:country>US</g:country>
    //     <g:service>Standard Rate</g:service>
    //     <g:price>4.95 USD</g:price>
    // </g:shipping>
    // <g:shipping>
    //     <g:country>US</g:country>
    //     <g:service>Next Day</g:service>
    //     <g:price>8.50 USD</g:price>
    // </g:shipping>
    // <!-- 2 out of the 3 unique product identifer attributes are required for this item  -->
    // <g:gtin>3348901056069</g:gtin>
    // <g:brand>Dior</g:brand>
    // <!-- The following attributes are not required for this item, but supplying them is recommended if applicable -->
    // <g:product_type>Health &amp; Beauty &gt; Personal Care &gt; Cosmetics &gt; Skin Care &gt; Lotion</g:product_type>
    // <g:google_product_category>Health &amp; Beauty &gt; Personal Care &gt; Cosmetics &gt; Skin Care &gt; Anti-Aging Skin Care Kits</g:google_product_category>
    // <g:additional_image_link>http://images.example.com/PFM654321_2.jpg</g:additional_image_link>
    // <g:additional_image_link>http://images.example.com/PFM654321_3.jpg</g:additional_image_link>
    ProductFeedXML(req, res) {
        res.header('Content-Type', 'application/xml');
        //res.header('Content-Encoding', 'gzip');       
        this.sitemap = null;
        let api = new product_1.default({
            req: req,
            res: res,
            next: null
        });
        api.getProductsFeed().then(products => {
            try {
                let feed = api.getProductsFeedXML(products);
                res.send(feed.end({ pretty: config_1.default.nodeenv == "development" }));
            }
            catch (e) {
                console.error(e);
                res.status(500).end();
            }
        }).catch(e => {
            console.error(e);
            res.status(500).end();
        });
    }
}
ProductFeedMiddleware.baseUrl = 'https://www.kasaptanal.com';
exports.default = (app) => exports.sm = new ProductFeedMiddleware(app);
