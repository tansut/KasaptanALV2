import { SitemapStream, streamToPromise} from "sitemap";
var fs = require('fs')
import config from '../config';
import * as path from "path";
import Product from "../db/models/product";
import Category from "../db/models/category";
import Resource from "../db/models/resource";
import {Op, QueryTypes} from "sequelize";
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
            include: [
                {
                    model: Area,
                    all: true,
                    as: "areaLevel1Id"
    
                }
            ],
            where: {
                approved: true
            }
        });

        for(let i = 0; i < items.length; i++) {
            let item = items[i];
            let resources = await Resource.findAll({
                where: {
                    ref1: item.id,
                    type: 'butcher-google-photos'
                }
            })
            stream.write({
                url: `${this.baseUrl}/${item.slug}`,
                img: resources.map(r=> {
                    return {
                        url: r.getFileUrl(),
                        title: r.title,
                        caption: `${item.name}`,
                                geoLocation: item.areaLevel1 && (item.areaLevel1.name + ',' + 'Turkey')

                    }
                })
            })            
        }

    }

    static async fillBlog(stream: SitemapStream) {
        let catdata = await Content.sequelize.query("SELECT distinct category, categorySlug from Contents", {
            raw: true  ,
            type: QueryTypes.SELECT       
        } )

        catdata.forEach(item=>{
            stream.write({
                url: `${this.baseUrl}/et-kulturu/${item['categorySlug']}`,
                img: []
            })
        })
        
        let items = await Content.findAll({
            raw: true
        });

        items.forEach(item=>{
            stream.write({
                url: `${this.baseUrl}/et-kulturu/${item.slug}`,
                img: [{
                    url: `${config.staticDomain}/content-resimleri/${item.slug}.jpg`,
                    title: item.title,
                    caption: item.description
                }]
            })
        })
    }


    static async fillFoods(stream: SitemapStream) {
        let items = await Resource.findAll({
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
                    url:  `${this.baseUrl}/et-yemekleri/${item.slug || item.id}`,
                    img: item.contentType == 'image/jpeg' ? [ {
                        url: item.getFileUrl(),
                        title: item.title,
                        caption: item.description
                    }
                        
                    ]: []
                })
            })
    }

    static async fillCategories(stream: SitemapStream) {
        let items = await Category.findAll({
            attributes: ['name', 'slug', 'type', 'id', 'tarifTitle'],
            raw: true
        });

        for(let i = 0; i < items.length; i++) {
            let item = items[i];
            let resources = await Resource.findAll({
                where: {
                    ref1: item.id,
                    type: 'category-photos'
                }
            })
            stream.write({
                url: item.type == 'resource' ? `${this.baseUrl}/et-yemekleri/${item.slug}`: `${this.baseUrl}/${item.slug}`,
                img: resources.map(r=> {
                    return {
                        url: r.getFileUrl(),
                        title: r.title || item.name,
                        caption: `${item.shortdesc} || ${item.name}`
                    }
                })
            })    
            
            if (item.type != 'resource' && item.tarifTitle) {
                stream.write({
                    url:  `${this.baseUrl}/${item.slug}/et-yemekleri`
                })
            } 

        }


    } 


    static async fillProducts(stream: SitemapStream) {
        let items = await Product.findAll({
            attributes: ['slug', 'name', 'id'],
            raw: true
        });

        for(let i = 0; i < items.length; i++) {
            let item = items[i];
            let resources = await Resource.findAll({
                where: {
                    ref1: item.id,
                    type: 'product-photos',
                    [Op.or]: [{
                        tag1: ''
                    }, {
                        tag1: null
                    }]
                }
            })



            stream.write({
                url: `${this.baseUrl}/${item.slug}`,
                img: resources.map(r=> {
                    return {
                        url: r.getFileUrl(),
                        title: r.title || item.name,
                        caption: `${item.name}`
                    }
                })
            })    
            

            
        }

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