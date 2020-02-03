import { Auth } from '../../lib/common';
import { ApiRouter } from '../../lib/router';
import * as express from "express";
import * as sq from 'sequelize';
import User from '../../db/models/user';
import Product from '../../db/models/product';

export class SearchResult {
    type: string;
    url: string;
}

export default class Route extends ApiRouter {

    @Auth.Anonymous()
    async searchRoute() {

        if (!this.req.query.q || this.req.query.length < 2)
            return this.res.send([])

        let search = '+' + (<string>this.req.query.q).replace(' ', '+') + "*";

        let prods = await User.sequelize.query("select name, slug as url, 'product' as type, match(name, shortdesc, mddesc) against (:search IN BOOLEAN MODE) as RELEVANCE " +
            "from Products where match(name, shortdesc, mddesc)  against (:search IN BOOLEAN MODE) ORDER BY  RELEVANCE, DISPLAYORDER DESC LIMIT 10",
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
                type: px.type
            }
        })

        let butchers = await User.sequelize.query("select name, slug as url, 'butcher' as type, match(name, description, mddesc) against (:search IN BOOLEAN MODE) as RELEVANCE " +
            "from Butchers where approved=true and match(name, description, mddesc)  against (:search IN BOOLEAN MODE) ORDER BY  RELEVANCE DESC LIMIT 10",
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
                type: px.type
            }
        })

        let foodResources = await User.sequelize.query("select id, title, ref1, slug, match(title, description) against (:search IN BOOLEAN MODE) as RELEVANCE " +
            "from Resources where (tag1 like '%tarif%' or tag1 like '%yemek%') and match(title, description)  against (:search IN BOOLEAN MODE) ORDER BY  RELEVANCE DESC LIMIT 10",
            {
                replacements: { search: search },
                type: sq.QueryTypes.SELECT,
                mapToModel: false,
                raw: true
            }

        );

         let foodProds = await Product.findAll({
             where: {
                 id: foodResources.map(p=> p['ref1'])
             }
         })
        
        // let foods = foodResources.map((p, i) => {
        //     let px = <any>p;
        //     return {
        //         id: 'f' + i,
        //         name: px.title,
        //         url: '/' + foodProds.find(fp=>fp.id == px.ref1).slug + '?r=' + px.id,
        //         type: 'food'
        //     }
        // })

        let foods = foodResources.map((p, i) => {
            let px = <any>p;
            return {
                id: 'f' + i,
                name: px.title,
                url: px.slug ? ('/et-yemekleri/' + px.slug): '/' + foodProds.find(fp=>fp.id == px.ref1).slug + '?r=' + px.id,
                type: 'food'
            }
        })        

        this.res.send(prods.concat(butchers.concat(foods)))
    }

    static SetRoutes(router: express.Router) {
        router.get("/fts", Route.BindRequest(this.prototype.searchRoute));
    }
}


