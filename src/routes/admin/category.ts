import { ApiRouter, ViewRouter } from '../../lib/router';
import * as express from "express";
import * as maps from "@google/maps"
import ProductModel from '../../db/models/product';
import moment = require('moment');
import { Auth } from '../../lib/common';
import Area from '../../db/models/area';
import Resource from '../../db/models/resource';
import { parse } from 'querystring';
import { threadId } from 'worker_threads';
import Helper from '../../lib/helper';
import Category from '../../db/models/category';
import ProductCategory from '../../db/models/productcategory';

export default class Route extends ViewRouter {

    product: ProductModel;

    @Auth.Anonymous()
    async listViewRoute() {

        let data = await Category.findAll({
            order: ["name", "type"]
        })

        this.res.render('pages/admin/category.list.ejs', this.viewData({ categories: data }))
    }



    static SetRoutes(router: express.Router) {
        router.get("/category/list", Route.BindRequest(Route.prototype.listViewRoute));
    }
}

