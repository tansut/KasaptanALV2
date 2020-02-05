import { SitemapStream, streamToPromise} from "sitemap";
var fs = require('fs')
import config from '../config';
import * as path from "path";
import Product from "../db/models/product";
import Category from "../db/models/category";
import Resource from "../db/models/resource";
import {Op} from "sequelize";
import Content from "../db/models/content";
import Butcher from "../db/models/butcher";
import Area from "../db/models/area";

export default class SiteMapManager {
    static baseUrl = 'https://www.kasaptanal.com';

    static  getStream(): SitemapStream {
        const smStream = new SitemapStream({ hostname: 'https://www.kasaptanal.com' });
        return smStream;
    }

    static async fillArea(stream: SitemapStream) {
        let items = await Area.findAll({
            attributes: ['slug'],
            raw: true,
            where: {
                status: 'active'
            }
        });
        items.forEach(item=>{
            stream.write({
                url: `${this.baseUrl}/${item.slug}-kasap`
            })
        })
    }

    static async fillButchers(stream: SitemapStream) {
        let items = await Butcher.findAll({
            attributes: ['slug'],
            raw: true,
            where: {
                approved: true
            }
        });
        items.forEach(item=>{
            stream.write({
                url: `${this.baseUrl}/${item.slug}`
            })
        })
    }

    static async fillBlog(stream: SitemapStream) {
        let items = await Content.findAll({
            attributes: ['slug', 'categorySlug'],
            raw: true
        });
        items.forEach(item=>{
            stream.write({
                url: `${this.baseUrl}/et-kulturu/${item.categorySlug}/${item.slug}`
            })
        })

    }


    static async fillFoods(stream: SitemapStream) {
        let items = await Resource.findAll({
            attributes: ["id", "slug"],
            raw: true,
            where: {
                type: ['product-videos', 'product-photos'],
                tag1: {
                    [Op.or]: [{
                        [Op.like]: '%yemek%'
    
                    }, { [Op.like]: '%tarif%' }]
                }
            }})
            items.forEach(item=>{
                stream.write({
                    url:  `${this.baseUrl}/et-yemekleri/${item.slug || item.id}`
                })
            })
    }

    static async fillCategories(stream: SitemapStream) {
        let items = await Category.findAll({
            attributes: ['slug', 'type', 'tarifTitle'],
            raw: true
        });
        items.forEach(item=>{
            stream.write({
                url: item.type == 'resource' ? `${this.baseUrl}/et-yemekleri/${item.slug}`: `${this.baseUrl}/${item.slug}`
            })
            if (item.type != 'resource' && item.tarifTitle) {
                stream.write({
                    url:  `${this.baseUrl}/${item.slug}/et-yemekleri`
                })
            } 
        })
    } 


    static async fillProducts(stream: SitemapStream) {
        let items = await Product.findAll({
            attributes: ['slug'],
            raw: true
        });
        items.forEach(item=>{
            stream.write({
                url: `${this.baseUrl}/${item.slug}`
            })
        })
    } 

    static async fill(stream: SitemapStream) {
        var defaultUrls = fs.readFileSync(path.join(config.projectDir, "siteurl.txt"), 'utf8').split(/\r?\n/);
        defaultUrls.forEach(line => {
            stream.write({ url: `${this.baseUrl}${line}`  })
        });
        await this.fillProducts(stream);
        await this.fillCategories(stream);
        await this.fillFoods(stream);
        await this.fillBlog(stream);
        await this.fillButchers(stream);
        await this.fillArea(stream);
    }
}