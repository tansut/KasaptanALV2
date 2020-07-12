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
exports.SearchResult = void 0;
const common_1 = require("../../lib/common");
const router_1 = require("../../lib/router");
const sq = require("sequelize");
const user_1 = require("../../db/models/user");
const product_1 = require("../../db/models/product");
const resource_1 = require("../../db/models/resource");
const _ = require("lodash");
const area_1 = require("../../db/models/area");
class SearchResult {
}
exports.SearchResult = SearchResult;
class Route extends router_1.ApiRouter {
    getProducrs(search) {
        return __awaiter(this, void 0, void 0, function* () {
            let psql = this.req.query.c ?
                "select p.name as name, p.slug as url, '' as type, match(p.name, p.shortdesc, p.slug, p.keywords) against (:search IN BOOLEAN MODE) as RELEVANCE " +
                    "from Products p, ProductCategories pc, Categories c where pc.productid = p.id and c.id = pc.categoryid and c.slug = :category and match(p.name, p.shortdesc, p.slug, p.keywords)  against (:search IN BOOLEAN MODE) ORDER BY RELEVANCE DESC LIMIT 10"
                :
                    "select name, slug as url, '' as type, match(name, shortdesc, slug, keywords) against (:search IN BOOLEAN MODE) as RELEVANCE " +
                        "from Products where match(name, shortdesc, slug, keywords)  against (:search IN BOOLEAN MODE) ORDER BY RELEVANCE DESC LIMIT 10";
            let prods = yield user_1.default.sequelize.query(psql, {
                replacements: { search: search, category: this.req.query.c },
                type: sq.QueryTypes.SELECT,
                mapToModel: false,
                raw: true
            }).map((p, i) => {
                let px = p;
                return {
                    id: 'p' + i,
                    name: px.name,
                    url: '/' + px.url,
                    type: px.type,
                    score: px.RELEVANCE,
                    thumb: this.req.helper.imgUrl('product-photos', px.url)
                };
            });
            return prods;
        });
    }
    getCategories(search) {
        return __awaiter(this, void 0, void 0, function* () {
            let cats = yield user_1.default.sequelize.query("select name, slug as url, 'Kategoriler' as type, match(name, shortdesc, slug, keywords) against (:search IN BOOLEAN MODE) as RELEVANCE " +
                "from Categories where match(name, shortdesc, slug, keywords)  against (:search IN BOOLEAN MODE) ORDER BY Categories.type, RELEVANCE DESC LIMIT 10", {
                replacements: { search: search },
                type: sq.QueryTypes.SELECT,
                mapToModel: false,
                raw: true
            }).map((p, i) => {
                let px = p;
                return {
                    id: 'c' + i,
                    name: px.name,
                    url: '/' + px.url,
                    type: px.type,
                    score: px.RELEVANCE,
                    thumb: this.req.helper.imgUrl('category-photos', px.url)
                };
            });
            return cats;
        });
    }
    getAreaButchers(search) {
        return __awaiter(this, void 0, void 0, function* () {
            let areas = yield user_1.default.sequelize.query("select name, slug as url, 'Bölgeler' as type, match(name, slug, keywords) against (:search IN BOOLEAN MODE) as RELEVANCE " +
                "from Areas where status='active' and match(name, slug, keywords)  against (:search IN BOOLEAN MODE) ORDER BY RELEVANCE DESC LIMIT 10", {
                replacements: { search: search },
                type: sq.QueryTypes.SELECT,
                mapToModel: false,
                raw: true
            }).map((p, i) => {
                let px = p;
                return {
                    id: 'loc' + i,
                    name: px.name + ' Kasapları',
                    url: '/' + px.url + '-kasap',
                    type: px.type,
                    score: px.RELEVANCE,
                    thumb: null // this.req.helper.imgUrl('category-photos', px.url)
                };
            });
            return areas;
        });
    }
    getAreas(search) {
        return __awaiter(this, void 0, void 0, function* () {
            let areas = yield user_1.default.sequelize.query("select id, name, slug as url, 'Semt' as type, match(name, slug, keywords) against (:search IN BOOLEAN MODE) as RELEVANCE " +
                "from Areas where level=3 and match(name, slug, keywords)  against (:search IN BOOLEAN MODE) ORDER BY RELEVANCE DESC LIMIT 10", {
                replacements: { search: search },
                type: sq.QueryTypes.SELECT,
                mapToModel: false,
                raw: true
            }).map((p, i) => {
                let px = p;
                return {
                    id: px.id,
                    name: px.name,
                    url: px.url,
                    type: px.type,
                    score: px.RELEVANCE
                };
            });
            for (let i = 0; i < areas.length; i++) {
                let area = areas[i];
                let addr = yield area_1.default.findByPk(area.id);
                let pref = yield addr.getPreferredAddress();
                area['display'] = pref.display;
                area['l1'] = {
                    name: pref.level1Text,
                    slug: pref.level1Slug
                },
                    area['l2'] = {
                        name: pref.level2Text,
                        slug: pref.level2Slug
                    };
            }
            return areas;
        });
    }
    getButchers(search) {
        return __awaiter(this, void 0, void 0, function* () {
            let butchers = yield user_1.default.sequelize.query("select name, slug as url, 'Kasaplar' as type, match(name, slug, keywords) against (:search IN BOOLEAN MODE) as RELEVANCE " +
                "from Butchers where approved=true and match(name, slug, keywords)  against (:search IN BOOLEAN MODE) ORDER BY RELEVANCE DESC LIMIT 10", {
                replacements: { search: search },
                type: sq.QueryTypes.SELECT,
                mapToModel: false,
                raw: true
            }).map((p, i) => {
                let px = p;
                return {
                    id: 'b' + i,
                    name: px.name,
                    url: '/' + px.url,
                    type: px.type,
                    score: px.RELEVANCE,
                    thumb: this.req.helper.imgUrl('butcher-google-photos', px.url)
                };
            });
            return butchers;
        });
    }
    getFoods(search) {
        return __awaiter(this, void 0, void 0, function* () {
            let foodResources = yield resource_1.default.sequelize.query("select id, title, ref1, slug, contentType, thumbnailUrl, folder,  match(title, description, slug, keywords) against (:search IN BOOLEAN MODE) as RELEVANCE " +
                "from Resources where (tag1 like '%tarif%' or tag1 like '%yemek%') and match(title, description, slug, keywords)  against (:search IN BOOLEAN MODE) ORDER BY  RELEVANCE DESC LIMIT 10", {
                replacements: { search: search },
                model: resource_1.default,
                type: sq.QueryTypes.SELECT,
                mapToModel: true
            });
            let foodProds = yield product_1.default.findAll({
                where: {
                    id: foodResources.map(p => p['ref1'])
                }
            });
            let foods = foodResources.map((p, i) => {
                let px = p;
                return {
                    id: 'f' + i,
                    name: px.title,
                    score: px.RELEVANCE,
                    url: px.slug ? ('/et-yemekleri/' + px.slug) : '/' + foodProds.find(fp => fp.id == px.ref1).slug + '?r=' + px.id,
                    type: 'Eti Bizden',
                    thumb: px.contentType == 'video-youtube' ? (px.thumbnailUrl ? px.getThumbnailFileUrl() : null) : px.getThumbnailFileUrl()
                };
            });
            return foods;
        });
    }
    searchRoute() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.req.query.q || this.req.query.q.length < 2)
                return this.res.send([]);
            let text = this.req.query.q;
            let words = text.match(/\S+/g).filter(w => w.length > 2).map(w => `+${w}*`);
            let search = words.join();
            let products = (!this.req.query.t || this.req.query.t == 'product') ? yield this.getProducrs(search) : [];
            let categories = (!this.req.query.t || this.req.query.t == 'category') ? yield this.getCategories(search) : [];
            let foods = (!this.req.query.t || this.req.query.t == 'food') ? yield this.getFoods(search) : [];
            let butchers = (!this.req.query.t || this.req.query.t == 'butcher') ? yield this.getButchers(search) : [];
            let areaBtchers = (!this.req.query.t || this.req.query.t == 'area-butcher') ? yield this.getAreaButchers(search) : [];
            let areas = (this.req.query.t == 'area') ? yield this.getAreas(search) : [];
            let combined = categories.concat(products.concat(foods.concat(butchers.concat(areaBtchers.concat(areas)))));
            let sorted = _.sortBy(combined, 'RELEVANCE');
            this.res.send(sorted);
        });
    }
    static SetRoutes(router) {
        router.get("/fts", Route.BindRequest(this.prototype.searchRoute));
    }
}
__decorate([
    common_1.Auth.Anonymous(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], Route.prototype, "searchRoute", null);
exports.default = Route;

//# sourceMappingURL=fts.js.map
