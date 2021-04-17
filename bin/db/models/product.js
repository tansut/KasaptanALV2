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
var Product_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductSelectionWeigts = exports.ProductDispatch = exports.ProductType = void 0;
const sequelize_typescript_1 = require("sequelize-typescript");
const basemodel_1 = require("./basemodel");
const productcategory_1 = require("./productcategory");
const butcherproduct_1 = require("./butcherproduct");
const resource_1 = require("./resource");
const sequelize_1 = require("sequelize");
const common_1 = require("../../lib/common");
const nutritionvalue_1 = require("./nutritionvalue");
var ProductType;
(function (ProductType) {
    ProductType["generic"] = "generic";
    ProductType["kurban"] = "kurban";
    ProductType["kurbandiger"] = "kurbandiger";
    ProductType["adak"] = "adak";
    ProductType["tumkuzu"] = "tumkuzu";
})(ProductType = exports.ProductType || (exports.ProductType = {}));
var ProductDispatch;
(function (ProductDispatch) {
    ProductDispatch["dispatcherbased"] = "dispatcherbased";
    ProductDispatch["citywide"] = "citywide";
    ProductDispatch["countrywide"] = "countrywide";
})(ProductDispatch = exports.ProductDispatch || (exports.ProductDispatch = {}));
exports.ProductSelectionWeigts = {
    'tam': 0,
    'sadece liste': -1,
    'one cikar': 1
};
let Product = Product_1 = class Product extends basemodel_1.default {
    get butcherWeights() {
        return this.butcherweightsjson ? JSON.parse(this.getDataValue('butcherweightsjson')) : null;
    }
    set butcherWeights(value) {
        this.setDataValue('butcherweightsjson', JSON.stringify(value));
    }
    get asAdak() {
        let obj = this.producttypedata || {};
        return Object.assign(new common_1.AdakProductManager(), obj);
    }
    get asKurban() {
        let obj = this.producttypedata || {};
        return Object.assign(new common_1.KurbanProductManager(), obj);
    }
    get asKurbanDiger() {
        let obj = this.producttypedata || {};
        return Object.assign(new common_1.KurbanDigerProductManager(), obj);
    }
    get producttypedata() {
        return this.producttypedatajson ? JSON.parse(this.getDataValue('producttypedatajson')) : null;
    }
    set producttypedata(value) {
        this.setDataValue('producttypedatajson', JSON.stringify(value));
    }
    get generatedDesc() {
        let start = "";
        if (this.shortdesc)
            start = `${this.name}: ${this.shortdesc}.`;
        else
            start = `${this.name} kasaptanAl.com'da.`;
        let availUnits = this.availableUnits;
        let units = availUnits.length < 3 ? this.availableUnits.join(' veya ').toLocaleLowerCase() :
            this.availableUnits.slice(0, -1).join(', ').toLocaleLowerCase() + ' veya ' + this.availableUnits[this.availableUnits.length - 1].toLocaleLowerCase();
        let result = `${start} En iyi ${units} fiyat teklifleriyle online sipariş verin, kapınıza gelsin.`;
        return result;
    }
    get availableUnits() {
        let res = [];
        this.unit1 && res.push(this.unit1title || this.unit1);
        this.unit2 && res.push(this.unit2title || this.unit2);
        this.unit3 && res.push(this.unit3title || this.unit3);
        this.unit4 && res.push(this.unit4title || this.unit4);
        this.unit5 && res.push(this.unit5title || this.unit5);
        return res;
    }
    getUnitBy(nameOrTitle) {
        if (this.unit1 == nameOrTitle || this.unit1title == nameOrTitle)
            return 'unit1';
        if (this.unit2 == nameOrTitle || this.unit1title == nameOrTitle)
            return 'unit2';
        if (this.unit3 == nameOrTitle || this.unit1title == nameOrTitle)
            return 'unit3';
        if (this.unit4 == nameOrTitle || this.unit1title == nameOrTitle)
            return 'unit4';
        if (this.unit5 == nameOrTitle || this.unit1title == nameOrTitle)
            return 'unit5';
        return null;
    }
    getCategories() {
        let result = [];
        for (let i = 0; i < this.categories.length; i++) {
            result.push(this.categories[i].category);
        }
        return result;
    }
    getPriceStats() {
        return __awaiter(this, void 0, void 0, function* () {
            let q = `select count(*) as count, 
        min(kgPrice) as kgmin, avg(kgPrice) as kgavg, max(kgPrice) as kgmax, 
        min(unit1price) as unit1min, avg(unit1price) as unit1avg, max(unit1price) as unit1max,
        min(unit2price)  as unit2min, avg(unit1price)  as unit2avg, max(unit2price) as unit2max,
        min(unit3price)  as unit3min, avg(unit1price)  as unit2avg, max(unit3price) as unit3max
        from ButcherProducts, Butchers 
        where 
        ButcherProducts.productid=${this.id} and 
        ButcherProducts.enabled=true and 
        ButcherProducts.butcherid = Butchers.id 
        and Butchers.approved=true`;
            let res = yield Product_1.sequelize.query(q, {
                raw: true,
                plain: true,
                type: sequelize_1.QueryTypes.SELECT
            });
            return res;
        });
    }
    loadnutritionValues() {
        return __awaiter(this, void 0, void 0, function* () {
            this.nutritionView = yield nutritionvalue_1.default.loadView('product', this.id);
        });
    }
    loadResources() {
        return __awaiter(this, void 0, void 0, function* () {
            this.resources = yield resource_1.default.findAll({
                where: {
                    type: ["product-photos", "product-videos"],
                    [sequelize_1.Op.or]: {
                        ref1: this.id,
                        ref2: this.id,
                        ref3: this.id,
                        ref4: this.id,
                        ref5: this.id,
                        ref6: this.id
                    }
                },
                order: [["type", "ASC"], ["displayOrder", "DESC"], ["updatedOn", "DESC"]]
            });
            this.resources.forEach(c => c.product = this);
        });
    }
};
__decorate([
    sequelize_typescript_1.Column({
        allowNull: false,
    }),
    __metadata("design:type", String)
], Product.prototype, "name", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", String)
], Product.prototype, "keywords", void 0);
__decorate([
    sequelize_typescript_1.Column({}),
    __metadata("design:type", String)
], Product.prototype, "butcherweightsjson", void 0);
__decorate([
    sequelize_typescript_1.Column({
        type: sequelize_typescript_1.DataType.TEXT
    }),
    __metadata("design:type", String)
], Product.prototype, "producttypedatajson", void 0);
__decorate([
    sequelize_typescript_1.HasMany(() => productcategory_1.default, {
        sourceKey: "id",
        foreignKey: "productid"
    }),
    __metadata("design:type", Array)
], Product.prototype, "categories", void 0);
__decorate([
    sequelize_typescript_1.HasMany(() => butcherproduct_1.default, {
        sourceKey: "id",
        foreignKey: "productid"
    }),
    __metadata("design:type", Array)
], Product.prototype, "butchers", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: true,
    }),
    __metadata("design:type", String)
], Product.prototype, "tag1", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: false,
        defaultValue: ProductDispatch.dispatcherbased
    }),
    __metadata("design:type", String)
], Product.prototype, "dispatch", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: false,
    }),
    __metadata("design:type", String)
], Product.prototype, "slug", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: false,
        defaultValue: "onsale"
    }),
    __metadata("design:type", String)
], Product.prototype, "status", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: true,
    }),
    __metadata("design:type", String)
], Product.prototype, "tag2", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: true,
    }),
    __metadata("design:type", String)
], Product.prototype, "tag3", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: true,
        type: sequelize_typescript_1.DataType.TEXT
    }),
    __metadata("design:type", String)
], Product.prototype, "shortdesc", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: true,
        type: sequelize_typescript_1.DataType.TEXT
    }),
    __metadata("design:type", String)
], Product.prototype, "notePlaceholder", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: true,
        type: sequelize_typescript_1.DataType.TEXT
    }),
    __metadata("design:type", String)
], Product.prototype, "featuresText", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: true,
    }),
    __metadata("design:type", String)
], Product.prototype, "pageTitle", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: true,
    }),
    __metadata("design:type", String)
], Product.prototype, "pageDescription", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: true,
        type: sequelize_typescript_1.DataType.TEXT
    }),
    __metadata("design:type", String)
], Product.prototype, "mddesc", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: true,
        type: sequelize_typescript_1.DataType.TEXT
    }),
    __metadata("design:type", String)
], Product.prototype, "butcherNote", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: true,
        type: sequelize_typescript_1.DataType.TEXT
    }),
    __metadata("design:type", String)
], Product.prototype, "butcherProductNote", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: true,
    }),
    __metadata("design:type", Number)
], Product.prototype, "displayOrder", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: true,
    }),
    __metadata("design:type", String)
], Product.prototype, "unit1", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: true,
    }),
    __metadata("design:type", String)
], Product.prototype, "unit2", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: true,
    }),
    __metadata("design:type", String)
], Product.prototype, "unit3", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: true,
    }),
    __metadata("design:type", String)
], Product.prototype, "unit4", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: true,
    }),
    __metadata("design:type", String)
], Product.prototype, "unit5", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: true,
    }),
    __metadata("design:type", String)
], Product.prototype, "unit1title", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: true,
    }),
    __metadata("design:type", String)
], Product.prototype, "unit2title", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: true,
    }),
    __metadata("design:type", String)
], Product.prototype, "unit3title", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: true,
    }),
    __metadata("design:type", String)
], Product.prototype, "unit4title", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: true,
    }),
    __metadata("design:type", String)
], Product.prototype, "unit5title", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: true,
    }),
    __metadata("design:type", String)
], Product.prototype, "unit1weight", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: true,
    }),
    __metadata("design:type", String)
], Product.prototype, "unit2weight", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: true,
    }),
    __metadata("design:type", String)
], Product.prototype, "unit3weight", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: true,
    }),
    __metadata("design:type", String)
], Product.prototype, "unit4weight", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: true,
    }),
    __metadata("design:type", String)
], Product.prototype, "unit5weight", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: true,
        type: sequelize_typescript_1.DataType.TEXT
    }),
    __metadata("design:type", String)
], Product.prototype, "unit1desc", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: true,
        type: sequelize_typescript_1.DataType.TEXT
    }),
    __metadata("design:type", String)
], Product.prototype, "unit2desc", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: true,
        type: sequelize_typescript_1.DataType.TEXT
    }),
    __metadata("design:type", String)
], Product.prototype, "unit3desc", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: true,
        type: sequelize_typescript_1.DataType.TEXT
    }),
    __metadata("design:type", String)
], Product.prototype, "unit1note", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: true,
        type: sequelize_typescript_1.DataType.TEXT
    }),
    __metadata("design:type", String)
], Product.prototype, "unit1ButcherNote", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: true,
        type: sequelize_typescript_1.DataType.TEXT
    }),
    __metadata("design:type", String)
], Product.prototype, "unit2ButcherNote", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: true,
        type: sequelize_typescript_1.DataType.TEXT
    }),
    __metadata("design:type", String)
], Product.prototype, "unit3ButcherNote", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: true,
        type: sequelize_typescript_1.DataType.TEXT
    }),
    __metadata("design:type", String)
], Product.prototype, "unit4ButcherNote", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: true,
        type: sequelize_typescript_1.DataType.TEXT
    }),
    __metadata("design:type", String)
], Product.prototype, "unit5ButcherNote", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: true,
        type: sequelize_typescript_1.DataType.TEXT
    }),
    __metadata("design:type", String)
], Product.prototype, "unit2note", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: true,
        type: sequelize_typescript_1.DataType.TEXT
    }),
    __metadata("design:type", String)
], Product.prototype, "unit3note", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: true,
        type: sequelize_typescript_1.DataType.TEXT
    }),
    __metadata("design:type", String)
], Product.prototype, "unit4desc", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: true,
        type: sequelize_typescript_1.DataType.TEXT
    }),
    __metadata("design:type", String)
], Product.prototype, "unit5desc", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: true
    }),
    __metadata("design:type", String)
], Product.prototype, "unit1WeigthNote", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: true
    }),
    __metadata("design:type", String)
], Product.prototype, "unit2WeigthNote", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: true
    }),
    __metadata("design:type", String)
], Product.prototype, "unit3WeigthNote", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: true
    }),
    __metadata("design:type", String)
], Product.prototype, "unit4WeigthNote", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: true
    }),
    __metadata("design:type", String)
], Product.prototype, "unit5WeigthNote", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: false,
        defaultValue: 4.7,
        type: sequelize_typescript_1.DataType.DECIMAL(4, 2)
    }),
    __metadata("design:type", Number)
], Product.prototype, "ratingValue", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: false,
        defaultValue: 1
    }),
    __metadata("design:type", Number)
], Product.prototype, "reviewCount", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: false,
        defaultValue: 1,
        type: sequelize_typescript_1.DataType.DECIMAL(8, 3)
    }),
    __metadata("design:type", Number)
], Product.prototype, "unit1def", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: false,
        defaultValue: 1,
        type: sequelize_typescript_1.DataType.DECIMAL(8, 3)
    }),
    __metadata("design:type", Number)
], Product.prototype, "unit2def", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: false,
        defaultValue: 1,
        type: sequelize_typescript_1.DataType.DECIMAL(8, 3)
    }),
    __metadata("design:type", Number)
], Product.prototype, "unit3def", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: false,
        defaultValue: 1,
        type: sequelize_typescript_1.DataType.DECIMAL(8, 3)
    }),
    __metadata("design:type", Number)
], Product.prototype, "unit1min", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: false,
        defaultValue: 1,
        type: sequelize_typescript_1.DataType.DECIMAL(8, 3)
    }),
    __metadata("design:type", Number)
], Product.prototype, "unit2min", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: false,
        defaultValue: 1,
        type: sequelize_typescript_1.DataType.DECIMAL(8, 3)
    }),
    __metadata("design:type", Number)
], Product.prototype, "unit3min", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: false,
        defaultValue: 5,
        type: sequelize_typescript_1.DataType.DECIMAL(8, 3)
    }),
    __metadata("design:type", Number)
], Product.prototype, "unit1max", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: false,
        defaultValue: 5,
        type: sequelize_typescript_1.DataType.DECIMAL(8, 3)
    }),
    __metadata("design:type", Number)
], Product.prototype, "unit2max", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: false,
        defaultValue: 5,
        type: sequelize_typescript_1.DataType.DECIMAL(8, 3)
    }),
    __metadata("design:type", Number)
], Product.prototype, "unit3max", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: false,
        defaultValue: 1,
        type: sequelize_typescript_1.DataType.DECIMAL(8, 3)
    }),
    __metadata("design:type", Number)
], Product.prototype, "unit1step", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: false,
        defaultValue: 1,
        type: sequelize_typescript_1.DataType.DECIMAL(8, 3)
    }),
    __metadata("design:type", Number)
], Product.prototype, "unit2step", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: false,
        defaultValue: 1,
        type: sequelize_typescript_1.DataType.DECIMAL(8, 3)
    }),
    __metadata("design:type", Number)
], Product.prototype, "unit3step", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: false,
        defaultValue: 0.25,
        type: sequelize_typescript_1.DataType.DECIMAL(8, 3)
    }),
    __metadata("design:type", Number)
], Product.prototype, "unit1perPerson", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: false,
        defaultValue: 0.25,
        type: sequelize_typescript_1.DataType.DECIMAL(8, 3)
    }),
    __metadata("design:type", Number)
], Product.prototype, "unit2perPerson", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: false,
        defaultValue: 0.25,
        type: sequelize_typescript_1.DataType.DECIMAL(8, 3)
    }),
    __metadata("design:type", Number)
], Product.prototype, "unit3perPerson", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: false,
        defaultValue: 0
    }),
    __metadata("design:type", Number)
], Product.prototype, "unit1Order", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: false,
        defaultValue: 0
    }),
    __metadata("design:type", Number)
], Product.prototype, "unit2Order", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: false,
        defaultValue: 0
    }),
    __metadata("design:type", Number)
], Product.prototype, "unit3Order", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: false,
        defaultValue: 0
    }),
    __metadata("design:type", Number)
], Product.prototype, "unit4Order", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: false,
        defaultValue: 0
    }),
    __metadata("design:type", Number)
], Product.prototype, "unit5Order", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: false,
        defaultValue: 0,
        type: sequelize_typescript_1.DataType.DECIMAL(8, 3)
    }),
    __metadata("design:type", Number)
], Product.prototype, "unit1kgRatio", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: false,
        defaultValue: 0,
        type: sequelize_typescript_1.DataType.DECIMAL(8, 3)
    }),
    __metadata("design:type", Number)
], Product.prototype, "unit2kgRatio", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: false,
        defaultValue: 0,
        type: sequelize_typescript_1.DataType.DECIMAL(8, 3)
    }),
    __metadata("design:type", Number)
], Product.prototype, "unit3kgRatio", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: false,
        defaultValue: 0,
        type: sequelize_typescript_1.DataType.DECIMAL(13, 2)
    }),
    __metadata("design:type", Number)
], Product.prototype, "kgPrice", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: false,
        defaultValue: 'generic'
    }),
    __metadata("design:type", String)
], Product.prototype, "productType", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: true
    }),
    __metadata("design:type", String)
], Product.prototype, "badge", void 0);
__decorate([
    sequelize_typescript_1.Column({
        allowNull: false,
        defaultValue: 'kg'
    }),
    __metadata("design:type", String)
], Product.prototype, "priceUnit", void 0);
Product = Product_1 = __decorate([
    sequelize_typescript_1.Table({
        tableName: "Products",
        indexes: [{
                name: "slug_idx",
                fields: ["slug"],
                unique: true
            },
            { type: 'FULLTEXT', name: 'product_fts', fields: ['name', 'shortdesc', 'slug', 'keywords'] }]
    })
], Product);
exports.default = Product;
