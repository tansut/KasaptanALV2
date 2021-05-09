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
var Butcher_1;
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_typescript_1 = require("sequelize-typescript");
const basemodel_1 = require("./basemodel");
const area_1 = require("./area");
const butcherproduct_1 = require("./butcherproduct");
const product_1 = require("./product");
const sequelize_1 = require("sequelize");
const helper_1 = require("../../lib/helper");
const resource_1 = require("./resource");
let Butcher = Butcher_1 = class Butcher extends basemodel_1.default {
    get userRatingAsPerc() {
        return Math.round((this.userRating * 2) * 10);
    }
    get shipRatingAsPerc() {
        let succ = this.shipTotalCount - this.shipFailureCount;
        return this.shipTotalCount > 0 ? Math.round((succ / this.shipTotalCount) * 100) : 0;
    }
    get totalRatingAsPerc() {
        return Math.round((this.userRatingAsPerc + this.shipRatingAsPerc) / 2);
    }
    get weightRatingAsPerc() {
        if (this.shipSuccessCount < 5)
            return 100;
        return this.totalRatingAsPerc;
    }
    get shipSuccessCount() {
        return this.shipTotalCount - this.shipFailureCount;
    }
    get shipSuccessText() {
        return this.shipSuccessCount >= 10 ? helper_1.default.number2Text(this.shipSuccessCount, 50) : '';
    }
    get gpPlace() {
        return this.getDataValue('gpplacejson') ? JSON.parse(this.getDataValue('gpplacejson').toString()) : null;
    }
    set gpPlace(value) {
        this.setDataValue('gpplacejson', Buffer.from(JSON.stringify(value), "utf-8"));
    }
    get logisticSetings() {
        return this.logisticjson ? JSON.parse(this.getDataValue('logisticjson')) : null;
    }
    set logisticSetings(value) {
        this.setDataValue('logisticjson', JSON.stringify(value));
    }
    getPuanData(orderType) {
        return this.enablePuan ? {
            platforms: 'app,web',
            name: 'Kasap Kart Puanı',
            minSales: this.minSalesPuan,
            rate: orderType == 'kurban' ? this.kurbanPuanRate : this.customerPuanRate,
            minPuanForUsage: this.minPuanUsage
        } : null;
    }
    getBadgeList() {
        let list = [];
        if (this.enablePuan) {
            list.push({
                icon: '',
                name: 'Kasap Kart™',
                tip: 'Alışverişlerinizden puan kazandırır'
            });
        }
        // if (this.enableCreditCard) {
        //     list.push({
        //         icon: 'czi-card',
        //         name: 'Online/Kapıda Ödeme',
        //         tip: 'Online veya kapıda ödeme yapabilirsiniz'
        //     })
        // } 
        return list;
    }
    get videoInstagramStr() {
        return this.getDataValue('videoinstagram') ? this.getDataValue('videoinstagram').toString() : "";
    }
    set videoInstagramStr(value) {
        this.setDataValue('videoinstagram', Buffer.from(value));
    }
    get lat() {
        return this.location ? this.location.coordinates[0] : 0;
    }
    get lng() {
        return this.location ? this.location.coordinates[1] : 0;
    }
    copyPricesFromMainButcher() {
        return __awaiter(this, void 0, void 0, function* () {
            yield butcherproduct_1.default.destroy({
                where: {
                    butcherid: this.id
                }
            });
            let mainPrices = yield butcherproduct_1.default.findAll({
                where: {
                    butcherid: this.priceBasedButcher
                },
                raw: true
            });
            for (var i = 0; i < mainPrices.length; i++) {
                let newItem = new butcherproduct_1.default(mainPrices[i]);
                newItem.id = null;
                newItem.butcherid = this.id;
                yield newItem.save();
            }
        });
    }
    static loadButcherWithProducts(slug, includeDisabled = false) {
        return __awaiter(this, void 0, void 0, function* () {
            let where = {};
            let id = typeof (slug) == 'string' ? parseInt(slug) : slug;
            if (Number.isNaN(id)) {
                where['slug'] = slug;
            }
            else
                where["id"] = id;
            let butcher = yield Butcher_1.findOne({
                include: [{
                        model: butcherproduct_1.default,
                        include: [product_1.default],
                    },
                    {
                        model: area_1.default,
                        all: true,
                        as: "areaLevel1Id"
                    }], where: where
            });
            if (butcher) {
                butcher.products = butcher.products.filter(p => {
                    return (p.product.status == "onsale") && (includeDisabled ? true : p.enabled) && (p.kgPrice > 0 || (p.unit1price > 0 && p.unit1enabled) || (p.unit2price > 0 && p.unit2enabled) || (p.unit3price > 0 && p.unit1enabled));
                });
            }
            return butcher;
        });
    }
    getProducts() {
        let result = [];
        for (let i = 0; i < this.products.length; i++) {
            result.push(this.products[i].product);
        }
        return result;
    }
    static sellingButchers(productid, areas) {
        return __awaiter(this, void 0, void 0, function* () {
            let where = {
                productid: productid,
                [sequelize_1.Op.or]: [
                    {
                        kgPrice: {
                            [sequelize_1.Op.gt]: 0.0
                        }
                    },
                    {
                        unit1price: {
                            [sequelize_1.Op.gt]: 0.0
                        }
                    },
                    {
                        unit2price: {
                            [sequelize_1.Op.gt]: 0.0
                        }
                    },
                    {
                        unit3price: {
                            [sequelize_1.Op.gt]: 0.0
                        }
                    }
                ],
                enabled: true
            };
            if (areas) {
                areas.level1Id ? where['$butcher.areaLevel1Id$'] = areas.level1Id : null;
                areas.level2Id ? where['$butcher.areaLevel2Id$'] = areas.level2Id : null;
                ;
                areas.level3Id ? where['$butcher.areaLevel3Id$'] = areas.level3Id : null;
            }
            return yield butcherproduct_1.default.findAll({
                where: where,
                include: [Butcher_1]
            });
        });
    }
    static getByArea(id, level) {
        return __awaiter(this, void 0, void 0, function* () {
            let col = `areaLevel${level}Id`;
            let where = {};
            where[col] = id;
            return yield Butcher_1.findAll({
                include: [{
                        all: true
                    }],
                where: where
            });
        });
    }
    static getBySlug(slug) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield Butcher_1.findOne({
                include: [{
                        all: true
                    }],
                where: {
                    slug: slug
                }
            });
        });
    }
    loadResources() {
        return __awaiter(this, void 0, void 0, function* () {
            this.resources = yield resource_1.default.findAll({
                where: {
                    type: ["butcher-google-photos", "butcher-videos"],
                    ref1: this.id
                },
                order: [["displayOrder", "DESC"], ["updatedOn", "DESC"]]
            });
            return this.resources;
        });
    }
};
__decorate([
    sequelize_typescript_1.AllowNull(false),
    sequelize_typescript_1.Column,
    __metadata("design:type", String)
], Butcher.prototype, "name", void 0);
__decorate([
    sequelize_typescript_1.AllowNull(false),
    sequelize_typescript_1.Column,
    __metadata("design:type", String)
], Butcher.prototype, "legalName", void 0);
__decorate([
    sequelize_typescript_1.Unique({ name: "slug_idx", msg: "" }),
    sequelize_typescript_1.AllowNull(false),
    sequelize_typescript_1.Column,
    __metadata("design:type", String)
], Butcher.prototype, "slug", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: false,
        defaultValue: 'add'
    }),
    __metadata("design:type", String)
], Butcher.prototype, "manualPaymentsAsDebt", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: true
    }),
    __metadata("design:type", Number)
], Butcher.prototype, "priceBasedButcher", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: false,
        defaultValue: "manual",
    }),
    __metadata("design:type", String)
], Butcher.prototype, "dispatchArea", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: false,
        defaultValue: "show",
    }),
    __metadata("design:type", String)
], Butcher.prototype, "priceDisplay", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: true
    }),
    __metadata("design:type", Number)
], Butcher.prototype, "defaultCategoryId", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: false,
        defaultValue: "open",
    }),
    __metadata("design:type", String)
], Butcher.prototype, "status", void 0);
__decorate([
    sequelize_typescript_1.AllowNull(true),
    sequelize_typescript_1.Column,
    __metadata("design:type", String)
], Butcher.prototype, "locationText", void 0);
__decorate([
    sequelize_typescript_1.AllowNull(true),
    sequelize_typescript_1.Column,
    __metadata("design:type", String)
], Butcher.prototype, "btnText", void 0);
__decorate([
    sequelize_typescript_1.AllowNull(true),
    sequelize_typescript_1.Column,
    __metadata("design:type", String)
], Butcher.prototype, "btnUrl", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: false,
        defaultValue: 'waiting'
    }),
    __metadata("design:type", String)
], Butcher.prototype, "agreementStatus", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: false,
        defaultValue: 50,
        type: sequelize_typescript_1.DataType.INTEGER
    }),
    __metadata("design:type", Number)
], Butcher.prototype, "radiusAsKm", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: false,
        defaultValue: 0,
        type: sequelize_typescript_1.DataType.INTEGER
    }),
    __metadata("design:type", Number)
], Butcher.prototype, "selectionRadiusAsKm", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: false,
        defaultValue: 0,
        type: sequelize_typescript_1.DataType.DECIMAL(5, 2)
    }),
    __metadata("design:type", Number)
], Butcher.prototype, "userRating", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: false,
        type: sequelize_typescript_1.DataType.INTEGER,
        defaultValue: 0
    }),
    __metadata("design:type", Number)
], Butcher.prototype, "userRatingCount", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: false,
        type: sequelize_typescript_1.DataType.INTEGER,
        defaultValue: 0
    }),
    __metadata("design:type", Number)
], Butcher.prototype, "shipFailureCount", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: false,
        type: sequelize_typescript_1.DataType.INTEGER,
        defaultValue: 0
    }),
    __metadata("design:type", Number)
], Butcher.prototype, "shipTotalCount", void 0);
__decorate([
    sequelize_typescript_1.AllowNull(false),
    sequelize_typescript_1.Default(false),
    sequelize_typescript_1.Column,
    __metadata("design:type", Boolean)
], Butcher.prototype, "approved", void 0);
__decorate([
    sequelize_typescript_1.Unique({ name: "gpid_idx", msg: "" }),
    sequelize_typescript_1.Column,
    __metadata("design:type", String)
], Butcher.prototype, "gpid", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", Date)
], Butcher.prototype, "gplastdate", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", Buffer)
], Butcher.prototype, "gpplacejson", void 0);
__decorate([
    sequelize_typescript_1.AllowNull(false),
    sequelize_typescript_1.Default(true),
    sequelize_typescript_1.Column,
    __metadata("design:type", Boolean)
], Butcher.prototype, "showListing", void 0);
__decorate([
    sequelize_typescript_1.AllowNull(false),
    sequelize_typescript_1.Default(true),
    sequelize_typescript_1.Column,
    __metadata("design:type", Boolean)
], Butcher.prototype, "shipday0", void 0);
__decorate([
    sequelize_typescript_1.AllowNull(false),
    sequelize_typescript_1.Default(true),
    sequelize_typescript_1.Column,
    __metadata("design:type", Boolean)
], Butcher.prototype, "shipday1", void 0);
__decorate([
    sequelize_typescript_1.AllowNull(false),
    sequelize_typescript_1.Default(true),
    sequelize_typescript_1.Column,
    __metadata("design:type", Boolean)
], Butcher.prototype, "shipday2", void 0);
__decorate([
    sequelize_typescript_1.AllowNull(false),
    sequelize_typescript_1.Default(true),
    sequelize_typescript_1.Column,
    __metadata("design:type", Boolean)
], Butcher.prototype, "shipday3", void 0);
__decorate([
    sequelize_typescript_1.AllowNull(false),
    sequelize_typescript_1.Default(true),
    sequelize_typescript_1.Column,
    __metadata("design:type", Boolean)
], Butcher.prototype, "shipday4", void 0);
__decorate([
    sequelize_typescript_1.AllowNull(false),
    sequelize_typescript_1.Default(true),
    sequelize_typescript_1.Column,
    __metadata("design:type", Boolean)
], Butcher.prototype, "shipday5", void 0);
__decorate([
    sequelize_typescript_1.AllowNull(false),
    sequelize_typescript_1.Default(true),
    sequelize_typescript_1.Column,
    __metadata("design:type", Boolean)
], Butcher.prototype, "shipday6", void 0);
__decorate([
    sequelize_typescript_1.ForeignKey(() => area_1.default),
    sequelize_typescript_1.Column,
    __metadata("design:type", Number)
], Butcher.prototype, "areaLevel1Id", void 0);
__decorate([
    sequelize_typescript_1.BelongsTo(() => area_1.default, "areaLevel1Id"),
    __metadata("design:type", area_1.default)
], Butcher.prototype, "areaLevel1", void 0);
__decorate([
    sequelize_typescript_1.ForeignKey(() => area_1.default),
    sequelize_typescript_1.Column,
    __metadata("design:type", Number)
], Butcher.prototype, "areaLevel2Id", void 0);
__decorate([
    sequelize_typescript_1.BelongsTo(() => area_1.default, "areaLevel2Id"),
    __metadata("design:type", area_1.default)
], Butcher.prototype, "areaLevel2", void 0);
__decorate([
    sequelize_typescript_1.ForeignKey(() => area_1.default),
    sequelize_typescript_1.Column,
    __metadata("design:type", Number)
], Butcher.prototype, "areaLevel3Id", void 0);
__decorate([
    sequelize_typescript_1.BelongsTo(() => area_1.default, "areaLevel3Id"),
    __metadata("design:type", area_1.default)
], Butcher.prototype, "areaLevel3", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", String)
], Butcher.prototype, "address", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", String)
], Butcher.prototype, "areaLevel1Text", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: true,
        type: sequelize_typescript_1.DataType.GEOMETRY('POINT')
    }),
    __metadata("design:type", Object)
], Butcher.prototype, "location", void 0);
__decorate([
    sequelize_typescript_1.Column({
        type: sequelize_typescript_1.DataType.TEXT
    }),
    __metadata("design:type", String)
], Butcher.prototype, "logisticjson", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: false,
        defaultValue: "none"
    }),
    __metadata("design:type", String)
], Butcher.prototype, "logisticProviderUsage", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: false,
        defaultValue: "butcher"
    }),
    __metadata("design:type", String)
], Butcher.prototype, "defaultDispatcher", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", String)
], Butcher.prototype, "logisticProvider", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", String)
], Butcher.prototype, "phone", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", String)
], Butcher.prototype, "badge", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", String)
], Butcher.prototype, "website", void 0);
__decorate([
    sequelize_typescript_1.Column({ type: sequelize_typescript_1.DataType.FLOAT, defaultValue: 0, allowNull: false }),
    __metadata("design:type", Number)
], Butcher.prototype, "rating", void 0);
__decorate([
    sequelize_typescript_1.Default(0),
    sequelize_typescript_1.AllowNull(false),
    sequelize_typescript_1.Column,
    __metadata("design:type", Number)
], Butcher.prototype, "ratingCount", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", String)
], Butcher.prototype, "postal", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", String)
], Butcher.prototype, "pageTitle", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", String)
], Butcher.prototype, "keywords", void 0);
__decorate([
    sequelize_typescript_1.Column({
        type: sequelize_typescript_1.DataType.TEXT
    }),
    __metadata("design:type", String)
], Butcher.prototype, "pageDescription", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", String)
], Butcher.prototype, "instagram", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", String)
], Butcher.prototype, "facebook", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: true,
        type: sequelize_typescript_1.DataType.TEXT
    }),
    __metadata("design:type", String)
], Butcher.prototype, "description", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: true,
        type: sequelize_typescript_1.DataType.TEXT
    }),
    __metadata("design:type", String)
], Butcher.prototype, "mddesc", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: true
    }),
    __metadata("design:type", String)
], Butcher.prototype, "iban", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: true
    }),
    __metadata("design:type", String)
], Butcher.prototype, "companyType", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: true
    }),
    __metadata("design:type", String)
], Butcher.prototype, "taxOffice", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: true
    }),
    __metadata("design:type", String)
], Butcher.prototype, "taxNumber", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: true
    }),
    __metadata("design:type", String)
], Butcher.prototype, "email", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: false,
        defaultValue: false
    }),
    __metadata("design:type", Boolean)
], Butcher.prototype, "enableCreditCard", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: true
    }),
    __metadata("design:type", String)
], Butcher.prototype, "badges", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: true
    }),
    __metadata("design:type", String)
], Butcher.prototype, "iyzicoSubMerchantKey", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: false,
        defaultValue: 0
    }),
    __metadata("design:type", Number)
], Butcher.prototype, "displayOrder", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: true
    }),
    __metadata("design:type", String)
], Butcher.prototype, "parentButcher", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: true
    }),
    __metadata("design:type", String)
], Butcher.prototype, "notifyMobilePhones", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: false,
        type: sequelize_typescript_1.DataType.DECIMAL(10, 4),
        defaultValue: 0.02
    }),
    __metadata("design:type", Number)
], Butcher.prototype, "payCommissionRate", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: false,
        type: sequelize_typescript_1.DataType.DECIMAL(10, 2),
        defaultValue: 0.18
    }),
    __metadata("design:type", Number)
], Butcher.prototype, "vatRate", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: false,
        type: sequelize_typescript_1.DataType.DECIMAL(13, 2),
        defaultValue: 0.00
    }),
    __metadata("design:type", Number)
], Butcher.prototype, "payCommissionFee", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: false,
        type: sequelize_typescript_1.DataType.DECIMAL(10, 4),
        defaultValue: 0.04
    }),
    __metadata("design:type", Number)
], Butcher.prototype, "kurbanCommissionRate", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: false,
        type: sequelize_typescript_1.DataType.DECIMAL(13, 2),
        defaultValue: 0.00
    }),
    __metadata("design:type", Number)
], Butcher.prototype, "kurbanCommissionFee", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: false,
        type: sequelize_typescript_1.DataType.DECIMAL(10, 4),
        defaultValue: 0.15
    }),
    __metadata("design:type", Number)
], Butcher.prototype, "noshipCommissionRate", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: false,
        type: sequelize_typescript_1.DataType.DECIMAL(13, 2),
        defaultValue: 0.00
    }),
    __metadata("design:type", Number)
], Butcher.prototype, "noshipCommissionFee", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: false,
        type: sequelize_typescript_1.DataType.DECIMAL(10, 4),
        defaultValue: 0.1
    }),
    __metadata("design:type", Number)
], Butcher.prototype, "commissionRate", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: false,
        type: sequelize_typescript_1.DataType.DECIMAL(13, 2),
        defaultValue: 0.00
    }),
    __metadata("design:type", Number)
], Butcher.prototype, "commissionFee", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: false,
        type: sequelize_typescript_1.DataType.DECIMAL(13, 2),
        defaultValue: 0.00
    }),
    __metadata("design:type", Number)
], Butcher.prototype, "minSalesPuan", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: false,
        type: sequelize_typescript_1.DataType.DECIMAL(5, 2),
        defaultValue: 0.01
    }),
    __metadata("design:type", Number)
], Butcher.prototype, "customerPuanRate", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: false,
        type: sequelize_typescript_1.DataType.DECIMAL(5, 2),
        defaultValue: 0.02
    }),
    __metadata("design:type", Number)
], Butcher.prototype, "kurbanPuanRate", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: false,
        type: sequelize_typescript_1.DataType.DECIMAL(13, 2),
        defaultValue: 50.00
    }),
    __metadata("design:type", Number)
], Butcher.prototype, "minPuanUsage", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: false,
        defaultValue: false
    }),
    __metadata("design:type", Boolean)
], Butcher.prototype, "enablePuan", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", Buffer)
], Butcher.prototype, "videoinstagram", void 0);
__decorate([
    sequelize_typescript_1.HasMany(() => butcherproduct_1.default, {
        sourceKey: "id",
        foreignKey: "butcherid",
    }),
    __metadata("design:type", Array)
], Butcher.prototype, "products", void 0);
Butcher = Butcher_1 = __decorate([
    sequelize_typescript_1.Table({
        tableName: "Butchers",
        indexes: [
            { type: 'FULLTEXT', name: 'butcher_fts', fields: ['name', 'slug', 'keywords'] },
            {
                name: "displayOrder_idx",
                fields: ["displayOrder"]
            }, {
                name: 'parentButcher_idx',
                fields: ['parentButcher']
            },
            {
                name: 'butcherstatus_idx',
                fields: ['status']
            },
            {
                name: 'approved_idx',
                fields: ['approved']
            }
        ]
    })
], Butcher);
exports.default = Butcher;
