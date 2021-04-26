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
const common_1 = require("../../lib/common");
const router_1 = require("../../lib/router");
const shopcard_1 = require("../../models/shopcard");
const product_1 = require("../../db/models/product");
const product_2 = require("./product");
const butcher_1 = require("../../db/models/butcher");
const dispatcher_1 = require("../../db/models/dispatcher");
const google_1 = require("../../lib/google");
const shoplist_1 = require("../../db/models/shoplist");
const helper_1 = require("../../lib/helper");
const order_1 = require("../../db/models/order");
class Route extends router_1.ApiRouter {
    getDispatcher(to) {
        return __awaiter(this, void 0, void 0, function* () {
            let res = yield dispatcher_1.default.findOne({
                where: {
                    toareaid: to.id,
                }
            });
            return res;
        });
    }
    addFromOrderRoute() {
        return __awaiter(this, void 0, void 0, function* () {
            let order = yield order_1.Order.findOne({
                where: {
                    ordernum: this.req.body.ordernum
                },
                include: [
                    {
                        model: order_1.OrderItem
                    }
                ]
            });
            let list = shoplist_1.default.fromOrder(order);
            yield this.append(list);
            this.res.sendStatus(200);
        });
    }
    append(list) {
        return __awaiter(this, void 0, void 0, function* () {
            let butcher = yield butcher_1.default.findByPk(list.butcherid, {
                include: [
                    {
                        all: true
                    }
                ]
            });
            let shopcard = yield shopcard_1.ShopCard.createFromRequest(this.req);
            for (let i = 0; i < list.items.length; i++) {
                let li = list.items[i];
                try {
                    let api = new product_2.default(this.constructorParams);
                    let product = yield product_1.default.findByPk(li.productid);
                    let productView = yield api.getProductView(product, butcher);
                    let po = productView.purchaseOptions.find(po => po.unit == li.poUnit);
                    if (po) {
                        //let bp = butcher.products.find(bp=>bp.enabled && bp.un)
                        shopcard.addProduct(productView, li.quantity, po, li.note, {});
                    }
                }
                catch (exc) {
                    helper_1.default.logError(exc, {}, this.req);
                }
            }
            yield shopcard.saveToRequest(this.req);
        });
    }
    addRoute(item) {
        return __awaiter(this, void 0, void 0, function* () {
            let api = new product_2.default(this.constructorParams);
            item = item || this.req.body;
            let shopcard = yield shopcard_1.ShopCard.createFromRequest(this.req);
            let product = yield product_1.default.findByPk(item.id);
            let butcher = item.butcher ? yield butcher_1.default.findOne({
                where: {
                    slug: item.butcher.slug
                },
                include: [{
                        all: true
                    }]
            }) : null;
            let productView = yield api.getProductView(product, butcher);
            if (item.shopcardIndex >= 0) {
                shopcard.remove(item.shopcardIndex);
            }
            shopcard.addProduct(productView, item.quantity, item.purchaseoption, item.note, item.productTypeData || {});
            if (this.req.body.userSelectedButcher) {
                for (var bi in shopcard.butchers) {
                    if (shopcard.butchers[bi].slug == this.req.body.userSelectedButcher) {
                        shopcard.butchers[bi].userSelected = true;
                    }
                }
            }
            yield shopcard.saveToRequest(this.req);
            let l = this.generateUserLog('shopcard', 'add');
            if (l) {
                l.productid = product.id;
                l.productName = product.name;
                l.butcherid = butcher ? butcher.id : undefined;
                l.butcherName = butcher ? butcher.name : undefined;
                yield this.saveUserLog(l);
            }
            this.res.send(shopcard);
        });
    }
    updateRoute() {
        return __awaiter(this, void 0, void 0, function* () {
            let api = new product_2.default(this.constructorParams);
            let item = this.req.body;
            let shopcard = yield shopcard_1.ShopCard.createFromRequest(this.req);
            let product = yield product_1.default.findByPk(item.id);
            let butcher = this.req.body.butcher ? yield butcher_1.default.findOne({
                where: {
                    slug: this.req.body.butcher.slug
                },
                include: [{
                        all: true
                    }]
            }) : null;
            let productView = yield api.getProductView(product, butcher);
            shopcard.addProduct(productView, item.quantity, item.purchaseoption, item.note, item.productTypeData || {});
            yield shopcard.saveToRequest(this.req);
            let l = this.generateUserLog('shopcard', 'update');
            if (l) {
                l.productid = product.id;
                l.productName = product.name;
                l.butcherid = butcher ? butcher.id : undefined;
                l.butcherName = butcher ? butcher.name : undefined;
                yield this.saveUserLog(l);
            }
            this.res.send(shopcard);
        });
    }
    removeRoute() {
        return __awaiter(this, void 0, void 0, function* () {
            let item = this.req.body;
            let shopcard = yield shopcard_1.ShopCard.createFromRequest(this.req);
            let scItem = shopcard.items[item.order];
            shopcard.remove(item.order);
            yield shopcard.saveToRequest(this.req);
            let l = this.generateUserLog('shopcard', 'remove');
            if (l) {
                l.productid = scItem.product.id;
                l.productName = scItem.product.name;
                l.butcherid = scItem.product.butcher.id;
                l.butcherName = scItem.product.butcher.name;
                yield this.saveUserLog(l);
            }
            this.res.send(shopcard);
        });
    }
    geocode() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.req.body.address)
                return this.next();
            let semt = this.req.prefAddr.display;
            let coded = yield google_1.Google.getLocation(this.req.body.address + ' ' + semt);
            this.res.send(coded);
        });
    }
    //@Auth.RequireCatcpha()
    revgeocode() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.req.body.lat || !this.req.body.lng)
                return this.next();
            let semt = this.req.prefAddr.display;
            let address = yield google_1.Google.reverse(parseFloat(this.req.body.lat), parseFloat(this.req.body.lng));
            this.res.send(address);
        });
    }
    static SetRoutes(router) {
        router.post("/shopcard/geocode", Route.BindRequest(this.prototype.geocode));
        router.post("/shopcard/reversegeocode", Route.BindRequest(this.prototype.revgeocode));
        router.post("/shopcard/add", Route.BindRequest(this.prototype.addRoute));
        router.post("/shopcard/addFromOrder", Route.BindRequest(this.prototype.addFromOrderRoute));
        router.post("/shopcard/update", Route.BindRequest(this.prototype.updateRoute));
        router.post("/shopcard/remove", Route.BindRequest(this.prototype.removeRoute));
    }
}
__decorate([
    common_1.Auth.Anonymous(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], Route.prototype, "addRoute", null);
__decorate([
    common_1.Auth.Anonymous(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], Route.prototype, "updateRoute", null);
__decorate([
    common_1.Auth.Anonymous(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], Route.prototype, "removeRoute", null);
__decorate([
    common_1.Auth.Anonymous(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], Route.prototype, "geocode", null);
exports.default = Route;
