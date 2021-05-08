import { Auth } from '../../lib/common';
import { ApiRouter } from '../../lib/router';
import * as express from "express";
import * as sq from 'sequelize';
import User from '../../db/models/user';
import Product from '../../db/models/product';
import Resource from '../../db/models/resource';
import * as _ from "lodash"
import { PreferredAddress } from '../../db/models/user';
import Area from '../../db/models/area';
import Helper from '../../lib/helper';


export class SearchResult {
    type: string;
    url: string;
}

export default class Route extends ApiRouter {


    async getProducrs(search: string) {
        let psql = this.req.query.c ?
            "select p.name as name, p.slug as url, 'ürün' as type, match(p.name, p.shortdesc, p.slug, p.keywords) against (:search IN BOOLEAN MODE) as RELEVANCE " +
            "from Products p, ProductCategories pc, Categories c where p.status='onsale' and pc.productid = p.id and c.id = pc.categoryid and c.slug = :category and match(p.name, p.shortdesc, p.slug, p.keywords)  against (:search IN BOOLEAN MODE) ORDER BY RELEVANCE DESC LIMIT 10"

            :

            "select name, slug as url, '' as type, match(name, shortdesc, slug, keywords) against (:search IN BOOLEAN MODE) as RELEVANCE " +
            "from Products where status='onsale' and match(name, shortdesc, slug, keywords)  against (:search IN BOOLEAN MODE) ORDER BY RELEVANCE DESC LIMIT 10"

        let prods = await User.sequelize.query(psql,
            {
                replacements: { search: search, category: this.req.query.c },
                type: sq.QueryTypes.SELECT,
                mapToModel: false,
                raw: true
            },

        ).map((p, i) => {
            let px = <any>p;
            return {
                id: 'p' + i,
                name: px.name,
                url: '/' + px.url,
                type: 'ürün',
                score: px.RELEVANCE,
                thumb: this.req.helper.imgUrl('product-photos', px.url)
            }
        })
        return prods;
    }

    async getCategories(search: string) {
        let cats = await User.sequelize.query("select name, slug as url, 'kategori' as type, match(name, shortdesc, slug, keywords) against (:search IN BOOLEAN MODE) as RELEVANCE " +
            "from Categories where status = 'active' and match(name, shortdesc, slug, keywords)  against (:search IN BOOLEAN MODE) ORDER BY Categories.type, RELEVANCE DESC LIMIT 10",
            {
                replacements: { search: search },
                type: sq.QueryTypes.SELECT,
                mapToModel: false,
                raw: true
            },

        ).map(async (p, i) => {
            let px = <any>p;
            return {
                id: 'c' + i,
                name: px.name,
                url: '/' + px.url,
                type: px.type,
                score: px.RELEVANCE,
                thumb: this.req.helper.imgUrl('category-photos', px.url)
            }
        })
        return cats;
    }

    async getAreaButchers(search: string) {
        let areas = await User.sequelize.query("select name, slug as url, 'bölge' as type, match(name, slug, keywords) against (:search IN BOOLEAN MODE) as RELEVANCE " +
            "from Areas where status='active' and match(name, slug, keywords)  against (:search IN BOOLEAN MODE) ORDER BY RELEVANCE DESC LIMIT 10",
            {
                replacements: { search: search },
                type: sq.QueryTypes.SELECT,
                mapToModel: false,
                raw: true
            },

        ).map((p, i) => {
            let px = <any>p;
            return {
                id: 'loc' + i,
                name: px.name + ' Kasapları',
                url: '/' + px.url + '-kasap',
                type: px.type,
                score: px.RELEVANCE,
                thumb: null // this.req.helper.imgUrl('category-photos', px.url)
            }
        })
        return areas;
    }

    async getAreas(search: string) {
        let areas =  await User.sequelize.query("select id, level, name, slug as url, 'lokasyon' as type, display, match(name, slug, keywords, display) against (:search IN BOOLEAN MODE) as RELEVANCE " +
            "from Areas where level>=3  and (match(name, slug, keywords, display)  against (:search IN BOOLEAN MODE) or match(name, slug, keywords, display)  against (:search2 IN BOOLEAN MODE)) ORDER BY status, level desc, RELEVANCE DESC LIMIT 25",
            {
                replacements: { search2: Helper.slugify(search), search: search },
                type: sq.QueryTypes.SELECT,
                mapToModel: false,
                raw: true
            }).map((p, i) => {
            let px = <any>p;
            return {
                id: px.id,
                name: px.display,
                display: px.display,
                url:  px.url,
                level: px.level,
                type: px.type,
                score: px.RELEVANCE
            }
        })
        let temp = areas;        
        return <any>temp;
    }


    async getButchers(search: string) {


        let butchers =  await User.sequelize.query("select name, slug as url, 'kasap' as type, match(name, slug, keywords) against (:search IN BOOLEAN MODE) as RELEVANCE " +
            "from Butchers where approved=true and match(name, slug, keywords)  against (:search IN BOOLEAN MODE) ORDER BY RELEVANCE DESC LIMIT 10",
            {
                replacements: { search: search },
                type: sq.QueryTypes.SELECT,
                mapToModel: false,
                raw: true
            },

        ).map((p, i) => {
            let px = <any>p;
            return {
                id: 'b' + i,
                name: px.name,
                url: '/' + px.url,
                type: px.type,
                score: px.RELEVANCE,
                thumb: this.req.helper.imgUrl('butcher-google-photos', px.url)
            }
        })
        return butchers;

    }

    async getFoods(search: string) {

        let foodResources = await Resource.sequelize.query("select id, title, ref1, slug, contentType, thumbnailUrl, folder,  match(title, description, slug, keywords) against (:search IN BOOLEAN MODE) as RELEVANCE " +
            "from Resources where (tag1 like '%tarif%' or tag1 like '%yemek%') and match(title, description, slug, keywords)  against (:search IN BOOLEAN MODE) ORDER BY  RELEVANCE DESC LIMIT 10",
            {
                replacements: { search: search },
                model: Resource,
                type: sq.QueryTypes.SELECT,
                mapToModel: true
            }

        );

        let foodProds = await Product.findAll({
            where: {
                id: foodResources.map(p => p['ref1'])
            }
        })


        let foods = foodResources.map((p, i) => {
            let px = <any>p;
            return {
                id: 'f' + i,
                name: px.title,
                score: px.RELEVANCE,
                url: px.slug ? ('/et-yemekleri/' + px.slug) : '/' + foodProds.find(fp => fp.id == px.ref1).slug + '?r=' + px.id,
                type: 'yemek',
                thumb: px.contentType == 'video-youtube' ? (px.thumbnailUrl ? px.getThumbnailFileUrl() : null) : px.getThumbnailFileUrl()

            }
        })
        return foods        
    }


    @Auth.Anonymous()
    async searchRoute2() {
        if (!this.req.query.q || (this.req.query.q as string).length < 2)
            return this.res.send([])

        let text = <string>this.req.query.q;
        let words = text.match(/\S+/g).filter(w => w.length > 2).map(w => `+${w}*`)
        let search = words.join()

        let products = (!this.req.query.t || this.req.query.t == 'product') ? await this.getProducrs(search): [];
        let categories = (!this.req.query.t || this.req.query.t == 'category') ? await this.getCategories(search): [];
        let foods = (!this.req.query.t || this.req.query.t == 'food') ? await this.getFoods(search): [];
        let butchers = (!this.req.query.t || this.req.query.t == 'butcher') ? await this.getButchers(search): [];
        //let areaBtchers = (!this.req.query.t || this.req.query.t == 'area-butcher') ? await this.getAreaButchers(search): [];
        let areas = (!this.req.query.t || this.req.query.t == 'area') ? await this.getAreas(search): [];

         let combined = categories.concat(products.concat(foods.concat(butchers.concat(areas))));
         //let combined = categories.concat(products.concat(foods.concat(butchers.concat(areaBtchers.concat(areas)))));
        
        let sorted = _.sortBy(combined, 'RELEVANCE');
        let max = _.max([products.length, categories.length, foods.length, butchers.length, areas.length]);

        let result = []
        for (let i = 0; i < max; i++) {
            let item = {};
            if (products.length -1 > i) {
               item['urun'] = products[i].name;
            }
            if (categories.length -1 > i) {
                item['kategori'] = categories[i].name;
             }
             if (foods.length -1 > i) {
                item['yemek'] = foods[i].name;
             }
             if (butchers.length -1 > i) {
                item['kasap'] = butchers[i].name;
             }
             if (areas.length -1 > i) {
                item['bolge'] = areas[i].name;
             }
             item['urun'] = item['urun'] || '';
             item['kategori'] = item['kategori'] || '';
             item['yemek'] = item['yemek'] || '';
             item['kasap'] = item['kasap'] || '';
             item['bolge'] = item['bolge'] || '';
             Object.keys(item).length > 0 && result.push(item);
        }

        
        this.res.send(result)
    }


    @Auth.Anonymous()
    async searchRoute() {
        if (!this.req.query.q || (this.req.query.q as string).length < 2)
            return this.res.send([])

        let text = <string>this.req.query.q;
        let words = text.match(/\S+/g).filter(w => w.length > 2).map(w => `+${w}*`)
        let search = words.join()

        let products = (!this.req.query.t || this.req.query.t == 'product') ? await this.getProducrs(search): [];
        let categories = (!this.req.query.t || this.req.query.t == 'category') ? await this.getCategories(search): [];
        let foods = (!this.req.query.t || this.req.query.t == 'food') ? await this.getFoods(search): [];
        let butchers = (!this.req.query.t || this.req.query.t == 'butcher') ? await this.getButchers(search): [];
        //let areaBtchers = (!this.req.query.t || this.req.query.t == 'area-butcher') ? await this.getAreaButchers(search): [];
        let areas = (!this.req.query.t || this.req.query.t == 'area') ? await this.getAreas(search): [];

         let combined = categories.concat(products.concat(foods.concat(butchers.concat(areas))));
         //let combined = categories.concat(products.concat(foods.concat(butchers.concat(areaBtchers.concat(areas)))));
        
        let sorted = _.sortBy(combined, 'RELEVANCE')
        this.res.send(sorted)
    }

    static SetRoutes(router: express.Router) {
        router.get("/fts", Route.BindRequest(this.prototype.searchRoute));
        router.get("/fts2", Route.BindRequest(this.prototype.searchRoute2));
    }
}


