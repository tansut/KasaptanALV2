import { Auth } from '../../lib/common';
import { ApiRouter } from '../../lib/router';
import * as express from "express";
import * as sq from 'sequelize';
import User from '../../db/models/user';
import Product from '../../db/models/product';
import Resource from '../../db/models/resource';
import * as _ from "lodash"

export class SearchResult {
    type: string;
    url: string;
}

export default class Route extends ApiRouter {

    @Auth.Anonymous()
    async searchRoute() {


        if (!this.req.query.q || this.req.query.length < 2)
            return this.res.send([])

        let text =  <string>this.req.query.q;
        let words = text.match(/\S+/g).filter(w=>w.length>2).map(w=> `+${w}*`)
        let search = words.join()

        let prods = await User.sequelize.query("select name, slug as url, '' as type, match(name, shortdesc, slug, keywords) against (:search IN BOOLEAN MODE) as RELEVANCE " +
            "from Products where match(name, shortdesc, slug, keywords)  against (:search IN BOOLEAN MODE) ORDER BY RELEVANCE DESC LIMIT 10",
            {
                replacements: { search: search },
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
                type: px.type,
                score: px.RELEVANCE,
                thumb: this.req.helper.imgUrl('product-photos', px.url)
            }
        })

        let cats = await User.sequelize.query("select name, slug as url, 'Kategoriler' as type, match(name, shortdesc, slug, keywords) against (:search IN BOOLEAN MODE) as RELEVANCE " +
            "from Categories where match(name, shortdesc, slug, keywords)  against (:search IN BOOLEAN MODE) ORDER BY RELEVANCE DESC LIMIT 10",
            {
                replacements: { search: search },
                type: sq.QueryTypes.SELECT,
                mapToModel: false,
                raw: true
            },

        ).map((p, i) => {
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

        let areas = await User.sequelize.query("select name, slug as url, 'Bölgeler' as type, match(name, slug, keywords) against (:search IN BOOLEAN MODE) as RELEVANCE " +
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

        let butchers = await User.sequelize.query("select name, slug as url, 'Kasaplar' as type, match(name, slug, keywords) against (:search IN BOOLEAN MODE) as RELEVANCE " +
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
                 id: foodResources.map(p=> p['ref1'])
             }
         })
        

        let foods = foodResources.map((p, i) => {
            let px = <any>p;
            return {
                id: 'f' + i,
                name: px.title,
                score: px.RELEVANCE,
                url: px.slug ? ('/et-yemekleri/' + px.slug): '/' + foodProds.find(fp=>fp.id == px.ref1).slug + '?r=' + px.id,
                type: 'Eti Bizden',
                thumb : px.contentType == 'video-youtube' ? (px.thumbnailUrl ? px.getThumbnailFileUrl(): null): px.getThumbnailFileUrl()

            }
        })        

        let combined = cats.concat(prods.concat(foods.concat(butchers.concat(areas))));
        let sorted = _.sortBy(combined, 'RELEVANCE')

        this.res.send(sorted)
    }

    static SetRoutes(router: express.Router) {
        router.get("/fts", Route.BindRequest(this.prototype.searchRoute));
    }
}


