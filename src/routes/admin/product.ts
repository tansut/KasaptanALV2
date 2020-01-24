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

        let data = await ProductModel.findAll({
            order: ["tag1", "name"],
            include: [{
                model: ProductCategory,
                include: [Category]
            }]
        })

        this.res.render('pages/admin/product.list.ejs', this.viewData({ products: data }))
    }

    async getResources(product: ProductModel) {
        return await Resource.findAll({
            where: {
                type: "product-photos",
                ref1: product.id
            },
            order: [["displayOrder", "DESC"], ["updatedOn", "DESC"]]
        })
    }

    async getCategories() {
        return await Category.findAll({
            where: {
                type: ['reyon', 'list', 'home']
            }
        })
    }

    async getProduct(slug: string) {
        return await ProductModel.findOne({
            include: [{
                all: true
            }
            ], where: { slug: slug }
        });
    }

    getProductCategory(categoryid: number) {
        let productCategory = this.product.categories.find(c => c.categoryid == categoryid)
        return productCategory ? {
            displayOrder: productCategory.displayOrder,
            enabled: true,
            productCategory: productCategory
        } : {
                displayOrder: "",
                enabled: false
            }
    }

    @Auth.Anonymous()
    async editViewRoute() {
        if (!this.req.params.product) {
            return this.next();
        }
        let product = this.product = await this.getProduct(this.req.params.product);
        let resources = await this.getResources(product)
        let categories = await this.getCategories();
        this.res.render('pages/admin/product.edit.ejs', this.viewData({ getProductCategory: this.getProductCategory, categories: categories, images: resources, product: product }))
    }

    async saveSeoRoute() {

    }

    @Auth.Anonymous()
    async saveRoute() {

        if (!this.req.params.product) {
            return this.next();
        }

        this.product = await this.getProduct(this.req.params.product);
        let resources = await this.getResources(this.product)
        let categories = await this.getCategories();


        if (this.req.body.save == "true") {
            if (this.req.user.hasRole('admin')) {
                this.product.slug = this.req.body.slug;
                this.product.name = this.req.body.name;
                this.product.tag1 = this.req.body.tag1;
                this.product.tag2 = this.req.body.tag2;
                this.product.shortdesc = this.req.body.description;
                this.product.notePlaceholder = this.req.body.notePlaceholder;
                this.product.featuresText = this.req.body.featuresText;
            }
            this.product.mddesc = this.req.body.mddesc;
            await this.product.save();
        } else if (this.req.body.saveseo == "true") {
            this.product.pageTitle = this.req.body.pagetitle;
            this.product.pageDescription = this.req.body.pagedesc;
            await this.product.save();
        } else if (this.req.body.saveunits == "true" && this.req.user.hasRole('admin')) {
            this.product.unit1 = this.req.body.unit1;
            this.product.unit1desc = this.req.body.unit1desc;
            this.product.unit1note = this.req.body.unit1note;
            this.product.unit1title = this.req.body.unit1title;
            this.product.unit2title = this.req.body.unit2title;
            this.product.unit3title = this.req.body.unit3title;
            this.product.unit2note = this.req.body.unit2note;
            this.product.unit3note = this.req.body.unit3note;
            this.product.unit2 = this.req.body.unit2;
            this.product.unit2desc = this.req.body.unit2desc;
            this.product.unit3 = this.req.body.unit3;
            this.product.unit3desc = this.req.body.unit3desc;


            this.product.unit1kgRatio = parseFloat(this.req.body.unit1kgRatio);
            this.product.unit2kgRatio = parseFloat(this.req.body.unit2kgRatio);
            this.product.unit3kgRatio = parseFloat(this.req.body.unit3kgRatio);

            this.product.unit1def = parseFloat(this.req.body.unit1def);
            this.product.unit2def = parseFloat(this.req.body.unit2def);
            this.product.unit3def = parseFloat(this.req.body.unit3def);

            this.product.unit1min = parseFloat(this.req.body.unit1min);
            this.product.unit2min = parseFloat(this.req.body.unit2min);
            this.product.unit3min = parseFloat(this.req.body.unit3min);

            this.product.unit1max = parseFloat(this.req.body.unit1max);
            this.product.unit2max = parseFloat(this.req.body.unit2max);
            this.product.unit3max = parseFloat(this.req.body.unit3max);

            this.product.unit1step = parseFloat(this.req.body.unit1step);
            this.product.unit2step = parseFloat(this.req.body.unit2step);
            this.product.unit3step = parseFloat(this.req.body.unit3step);


            this.product.unit1perPerson = parseFloat(this.req.body.unit1perPerson);
            this.product.unit2perPerson = parseFloat(this.req.body.unit2perPerson);
            this.product.unit3perPerson = parseFloat(this.req.body.unit3perPerson);



            this.product.unit1Order = parseInt(this.req.body.unit1Order);
            this.product.unit2Order = parseInt(this.req.body.unit2Order);
            this.product.unit3Order = parseInt(this.req.body.unit3Order);

            this.product.unit1WeigthNote = this.req.body.unit1WeigthNote;
            this.product.unit2WeigthNote = this.req.body.unit2WeigthNote;
            this.product.unit3WeigthNote = this.req.body.unit3WeigthNote;
        

            // this.product.defaultUnit = parseInt(this.req.body.defaultUnit);
            // this.product.defaultAmount = parseFloat(this.req.body.defaultAmount);

            //this.product.perPersonKg = parseFloat(this.req.body.perPersonKg);


            await this.product.save();
        } else if (this.req.body.CopyUnit &&  this.req.user.hasRole('admin')) {
            let productToCopyId = parseInt(this.req.body['copy' + this.req.body.CopyUnit]);
            let productToCopy = await ProductModel.findByPk(productToCopyId);
            Object.getOwnPropertyNames(productToCopy["rawAttributes"]).forEach(pn => {
                if (pn && pn.includes(this.req.body.CopyUnit)) {
                    this.product[pn] = productToCopy[pn];
                }
            })
            await this.product.save();

        } else if (this.req.body.updatecategory == "true" && this.req.user.hasRole('admin')) {
            let categoryid = parseInt(this.req.body.categoryid);
            //let productCategory = this.getProductCategory(parseInt(this.req.body.categoryid));
            await ProductCategory.destroy({
                where: {
                    productid: this.product.id,
                    categoryid: categoryid
                }
            })
            if (this.req.body.categoryenabled == "on") {
                let newItem = new ProductCategory();
                newItem.productid = this.product.id;
                newItem.categoryid = categoryid;

                newItem.displayOrder = (this.req.body.categorydisplayorder ? parseInt(this.req.body.categorydisplayorder) : 0)
                await newItem.save();
            }
            this.product = await this.getProduct(this.req.params.product);
        }

        this.res.render('pages/admin/product.edit.ejs', this.viewData({ categories: categories, images: resources, product: this.product }))
    }



    static SetRoutes(router: express.Router) {
        router.get("/product/list", Route.BindRequest(Route.prototype.listViewRoute));
        router.get("/product/:product", Route.BindRequest(Route.prototype.editViewRoute));
        router.post("/product/:product", Route.BindRequest(Route.prototype.saveRoute));
        router.post("/product/:product/saveseo", Route.BindRequest(Route.prototype.saveSeoRoute));
    }
}

