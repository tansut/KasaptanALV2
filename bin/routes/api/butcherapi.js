"use strict";
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
const router_1 = require("../../lib/router");
const butcher_1 = require("../../db/models/butcher");
const butcherproduct_1 = require("../../db/models/butcherproduct");
const product_1 = require("../../db/models/product");
const area_1 = require("../../db/models/area");
const helper_1 = require("../../lib/helper");
const order_1 = require("./../api/order");
const order_2 = require("../../db/models/order");
const order_3 = require("../../models/order");
const sms_1 = require("../../lib/sms");
const sitelog_1 = require("./sitelog");
const user_1 = require("../../db/models/user");
const user_2 = require("./user");
class Route extends router_1.ApiRouter {
    loadButcher(id) {
        return __awaiter(this, void 0, void 0, function* () {
            let butcher = yield butcher_1.default.findOne({
                include: [{
                        model: butcherproduct_1.default,
                        include: [product_1.default],
                        order: [['id', "DESC"]]
                    },
                    {
                        model: area_1.default,
                        all: true,
                        as: "areaLevel1Id"
                    }], where: { id: id
                }
            });
            return butcher;
        });
    }
    setButcher() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.req.session.__butcherid) {
                this.butcher = yield this.loadButcher(this.req.session.__butcherid);
            }
            else if (this.req.user.butcherid) {
                this.butcher = yield this.loadButcher(this.req.user.butcherid);
            }
        });
    }
    sendPayment() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.setButcher();
            this.req.body.phone = this.req.body.phone || "";
            this.req.body.name = this.req.body.name || "";
            let phone = this.req.body.phone.trim();
            let name = this.req.body.name.trim();
            let tutar = helper_1.default.parseFloat(this.req.body.pay);
            let user = yield user_1.default.retrieveByEMailOrPhone(phone);
            if (!user) {
                user = yield new user_2.default(this.constructorParams).createAsButcherCustomer({
                    phone: phone,
                    name: name
                }, this.butcher.id);
            }
            this.api = new order_1.default(this.constructorParams);
            let o = new order_2.Order();
            o.total = tutar;
            o.subTotal = tutar;
            o.phone = user.mphone;
            o.name = name;
            o.note = this.req.body.desc;
            o.paymentType = "onlinepayment";
            o.paymentTypeText = "Online Ödeme";
            o.status = order_3.OrderItemStatus.shipping;
            o.userId = user.id;
            o.discountTotal = 0;
            o.shippingTotal = 0;
            o.butcherid = this.butcher.id;
            o.butcherName = this.butcher.name;
            o.dispatcherType = "butcher";
            o.dispatcherName = this.butcher.name;
            o.email = this.butcher.email || `${this.butcher.slug}@kasaptanal.com`;
            o.address = "sipariş adresi";
            o.areaLevel1Id = this.butcher.areaLevel1Id;
            o.areaLevel1Text = this.butcher.areaLevel1.name;
            yield this.api.createAsButcherOrder(o);
            let payUrl = `${this.url}/pay/${o.ordernum}`;
            let text = `${this.butcher.name} ${helper_1.default.formattedCurrency(tutar)} sipariş tutarı online ödeme yapmak için lütfen ${payUrl} adresini ziyaret edin. ${this.req.body.desc}`;
            let log = new sitelog_1.default(this.constructorParams);
            yield sms_1.Sms.send('90' + o.phone, text, true, log);
            this.res.send({
                text: text,
                url: payUrl
            });
        });
    }
    getPaymentSmsTextRoute() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.setButcher();
            let tutar = helper_1.default.parseFloat(this.req.body.pay);
            let text = `${this.butcher.name} ${helper_1.default.formattedCurrency(tutar)} siparişiniz online ödeme yapmak için lütfen tıklayın. ${this.req.body.desc}`;
            this.res.send({ text: text });
        });
    }
    static SetRoutes(router) {
        router.post("/payment/send", Route.BindRequest(this.prototype.sendPayment));
        router.post("/payment/getsms", Route.BindRequest(this.prototype.getPaymentSmsTextRoute));
    }
}
exports.default = Route;
