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
const helper_1 = require("../lib/helper");
const area_1 = require("../db/models/area");
const product_1 = require("./api/product");
const temp_loc_1 = require("../db/models/temp_loc");
let ellipsis = require('text-ellipsis');
class Route extends router_1.ViewRouter {
    constructor() {
        super(...arguments);
        //tarifs: Resource[];
        this.hide4Sebep = false;
        this.foodsTitle = "Et Yemekleri";
    }
    getBlogItems() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.req.__recentBlogs;
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
    kasapViewRoute() {
        return __awaiter(this, void 0, void 0, function* () {
            this.foods = yield new product_1.default(this.constructorParams).getFoodResources(null, 10);
            this.sendView("pages/content.kasap-basvuru.ejs", this.viewData({}));
        });
    }
    defaultRoute() {
        return __awaiter(this, void 0, void 0, function* () {
            // let recentButchers: ButcherModel[] = CacheManager.dataCache.get("recent-butchers");
            // if (!recentButchers) {
            //     recentButchers = await ButcherModel.findAll({
            //         order: [["updatedon", "DESC"]],
            //         limit: 10,
            //         include: [
            //             { all: true }
            //         ],
            //         where: {
            //             approved: true
            //         }
            //     });
            //     CacheManager.dataCache.set("recent-butchers", recentButchers.map(b => b.get({ plain: true })));
            // }
            // this.foods = await new ProductsApi(this.constructorParams).getResources({
            //     type: ['product-videos', 'product-photos'],
            //     list: true,
            //     tag1: {
            //         [Op.or]: [{
            //             [Op.like]: '%yemek%'
            //         }, { [Op.like]: '%tarif%' }]
            //     }
            // }, null, 10);
            // this.foodsTitle = 'Yemekler ve Tarifler'
            //this.foods = CacheManager.dataCache.get("recent-foods");
            this.blogItems = yield this.getBlogItems();
            //this.stats = await SiteStats.get();
            this.res.render("pages/default.ejs", this.viewData({
                //recentButchers: recentButchers,
                ellipsis: ellipsis
            }));
        });
    }
    setUserAddr() {
        return __awaiter(this, void 0, void 0, function* () {
            let area = yield area_1.default.getBySlug(this.req.params.slug);
            if (!area)
                return this.next();
            if (area.level == 3 || area.level == 4) {
                yield area.ensureLocation();
                yield this.req.helper.setPreferredAddress({
                    level3Id: area.level == 3 ? area.id : undefined,
                    level4Id: area.level == 4 ? area.id : undefined
                }, true);
            }
            if (this.req.query.r)
                this.res.redirect(this.req.query.r);
            else
                this.res.redirect('/');
        });
    }
    tempares() {
        return __awaiter(this, void 0, void 0, function* () {
            let tl = yield temp_loc_1.default.findAll({
                where: {
                    il: ['ANKARA', 'İSTANBUL', 'İZMİR', 'BURSA', 'ESKİŞEHİR']
                }
            });
            for (let i = 0; i < tl.length; i++) {
                let t = tl[i];
                t.semt = t.semt.replace("ERYAMANEVLERİ", "ERYAMAN");
                t.semt = t.semt.replace("HASKÖY S.EVLERİ", "HASKÖY SUBAYEVLERİ");
                let slug = helper_1.default.slugify(`${t.il}-${t.ilce}-${t.semt}`);
                let area = yield area_1.default.findOne({
                    where: {
                        slug: slug
                    }
                });
                if (!area) {
                    console.log(`${t.il}-${t.ilce}-${t.semt} bulunamadı`);
                }
                else {
                    let na = new area_1.default();
                    na.name = helper_1.default.capitlize(t.mahalle.replace(" MAH", ' Mahallesi'));
                    na.slug = helper_1.default.slugify(`${area.slug}-${t.mahalle.replace(" MAH", '')}`);
                    na.parentid = area.id;
                    na.lowerName = helper_1.default.toLower(na.name);
                    na.level = 4;
                    na.status = 'generic';
                    try {
                        yield na.save();
                    }
                    catch (err) {
                        console.log(err.message);
                    }
                }
            }
            this.res.send('OK');
        });
    }
    static SetRoutes(router) {
        // if (config.nodeenv == 'production') {
        //     router.get("/home", Route.BindRequest(this.prototype.defaultRoute))
        //     router.get("/", Route.BindToView("pages/offline.ejs"))
        // }
        // else {
        // }
        router.get("/", Route.BindRequest(this.prototype.defaultRoute));
        router.get("/temparea", Route.BindRequest(this.prototype.tempares));
        router.get("/adres-belirle/:slug", Route.BindRequest(this.prototype.setUserAddr));
        router.get("/hikayemiz", Route.BindToView("pages/content.kurumsal.ejs"));
        router.get("/neden-kasaptanal", Route.BindToView("pages/content.neden-kasaptanal.ejs"));
        router.get("/iletisim", Route.BindToView("pages/content.contact.ejs"));
        router.get("/yardim", Route.BindToView("pages/content.yardim.ejs"));
        router.get("/kasap-secim-kriterleri", Route.BindToView("pages/content.kasap-secim.ejs"));
        router.get("/kasap", Route.BindRequest(this.prototype.kasapViewRoute));
        router.get("/kullanici-sozlesmesi", Route.BindToView("pages/content.kullanici-sozlesmesi.ejs"));
        router.get("/gizlilik-sozlesmesi", Route.BindToView("pages/content.gizlilik-sozlesmesi.ejs"));
        router.get("/satis-sozlesmesi", Route.BindToView("pages/content.satis-sozlesmesi.ejs"));
    }
}
__decorate([
    common_1.Auth.Anonymous(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], Route.prototype, "kasapViewRoute", null);
__decorate([
    common_1.Auth.Anonymous(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], Route.prototype, "defaultRoute", null);
__decorate([
    common_1.Auth.Anonymous(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], Route.prototype, "setUserAddr", null);
exports.default = Route;
