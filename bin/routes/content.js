"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const router_1 = require("../lib/router");
const common_1 = require("../lib/common");
const content_1 = require("../db/models/content");
const config_1 = require("../config");
let ellipsis = require('text-ellipsis');
var MarkdownIt = require('markdown-it');
const product_1 = require("./api/product");
const sequelize_1 = require("sequelize");
class Route extends router_1.ViewRouter {
    constructor() {
        super(...arguments);
        this.resources = [];
        this.mangalFoods = [];
    }
    foods() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield new product_1.default(this.constructorParams).getFoodAndTarifResources(null, 10);
        });
    }
    filterProductsByCategory(category, limit = 8) {
        let result = [];
        let prodSlugs = this.req.__categoryProducts[category.slug];
        if (prodSlugs) {
            for (let i = 0; i < prodSlugs.length; i++) {
                let product = this.req.__products[prodSlugs[i].slug];
                if (product)
                    result.push(product);
                if (result.length >= limit)
                    break;
            }
        }
        return result; //.slice(0, 8);
    }
    loadCategories() {
        return __awaiter(this, void 0, void 0, function* () {
            let catdata = yield content_1.default.sequelize.query("SELECT distinct category, categorySlug from Contents", {
                raw: true,
                type: sequelize_1.QueryTypes.SELECT
            });
            this.categories = catdata;
        });
    }
    getContentImages() {
        return [{
                url: `${config_1.default.staticDomain}/content-resimleri/${this.content.slug}.jpg`
            }];
    }
    // getHtmlContent() {
    //     let md = new MarkdownIt();
    //     let file = path.resolve(path.join(config.projectDir, "src/views/pages/content/" + this.content.slug + ".md"))
    //     let content = fs.readFileSync(file, "utf8")
    //     return md.render(content)
    // }
    renderPage() {
        this.res.render(`pages/blog.view.ejs`, this.viewData({
            pageThumbnail: `${config_1.default.staticDomain}/content-resimleri/${this.content.slug}-thumbnail.jpg`,
            pageTitle: (this.content.pageTitle || this.content.title),
            pageDescription: this.content.pageDescription || this.content.description
        }));
    }
    getthumbnailurl(content) {
        return `${config_1.default.staticDomain}/content-resimleri/${content.slug}-thumbnail.jpg`;
    }
    indexRoute() {
        return __awaiter(this, void 0, void 0, function* () {
            let where = {};
            if (this.req.params.category)
                where = {
                    categorySlug: this.req.params.category
                };
            let allcontent = yield content_1.default.findAll({
                attributes: ["title", "category", "description", "slug", "categorySlug"],
                order: [["displayOrder", "DESC"], ["UpdatedOn", "DESC"]],
                where: where,
                limit: 25
            });
            if (this.req.params.category && allcontent.length == 0)
                return this.next();
            if (this.req.path.toLowerCase().startsWith('/et-kulturu')) {
                return this.res.redirect(this.req.originalUrl.toLowerCase().replace('/et-kulturu', '/blog'), 301);
            }
            this.allcontent = allcontent;
            this.resources = yield new product_1.default(this.constructorParams).getInformationalVideos(25);
            yield this.loadCategories();
            let category = this.categories.find(p => p.categorySlug == this.req.params.category);
            this.renderView('pages/blog.index.ejs', this.req.params.category ? `blog/${this.req.params.category}` : null, {
                pageTitle: 'Et Kültür Blog' + (category ? ' | ' + category.category : ''),
                pageDescription: category ? 'KasaptanAl.com Et Kültür Blog ' + category.category + ' kategorisi içeriklerini keşfedin.' : 'KasaptanAl.com Et Kültür Blog ete ve hayata dair pek çok eğlenceli, kısa ve öz içeriklerle sizi bekliyor.',
                allcontent: allcontent
            });
        });
    }
    viewRoute() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.req.params.content) {
                return this.next();
            }
            this.content = yield content_1.default.findOne({
                where: {
                    slug: this.req.params.content
                }
            });
            if (!this.content)
                return this.next();
            if (this.req.path.toLowerCase().startsWith('/et-kulturu')) {
                return this.res.redirect(this.req.originalUrl.toLowerCase().replace('/et-kulturu', '/blog'), 301);
            }
            yield this.loadCategories();
            this.mangalFoods = this.req.params.content == 'antrikot' ? yield this.foods() : [];
            this.renderPage();
        });
    }
    static SetRoutes(router) {
        router.get("/blog", Route.BindRequest(Route.prototype.indexRoute));
        router.get("/blog/:category", Route.BindRequest(Route.prototype.indexRoute));
        router.get("/blog/:content", Route.BindRequest(Route.prototype.viewRoute));
        router.get("/et-kulturu", Route.BindRequest(Route.prototype.indexRoute, [true]));
        router.get("/et-kulturu/:category", Route.BindRequest(Route.prototype.indexRoute, [true]));
        router.get("/et-kulturu/:content", Route.BindRequest(Route.prototype.viewRoute, [true]));
    }
}
__decorate([
    common_1.Auth.Anonymous(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], Route.prototype, "indexRoute", null);
__decorate([
    common_1.Auth.Anonymous(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], Route.prototype, "viewRoute", null);
exports.default = Route;
