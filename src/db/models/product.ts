import { Table, Column, DataType, Model, HasMany, CreatedAt, UpdatedAt, DeletedAt, Unique, Default, AllowNull, ForeignKey, BelongsTo } from 'sequelize-typescript';
import BaseModel from "./basemodel"
import Helper from '../../lib/helper';
import ProductCategory from './productcategory';
import Category from './category';
import ButcherProduct from './butcherproduct';
import Resource from './resource';
import { Op, QueryTypes } from 'sequelize';
import { AdakProductManager, KurbanProductManager, KurbanDigerProductManager } from '../../lib/common';
import NutritionValue from './nutritionvalue';
import { NutritionView } from '../../models/common';
import { ButcherProperty } from '../../routes/api/product';

export enum ProductType {
    generic = 'generic',
    kurban = 'kurban',
    kurbandiger = 'kurbandiger',
    adak = 'adak',
    tumkuzu = 'tumkuzu',
}

 export enum ProductDispatch {
     dispatcherbased = 'dispatcherbased',
     citywide = 'citywide',
     countrywide = 'countrywide'
 }

 export type ProductPriceUnit = 'kg' | 'unit1' | 'unit3' | 'unit3';

 export type ButcherUnitSelection = 'unselected' | 'selected' | 'forced' | 'none-selected' | 'none-unselected';
 
 export type ButcherUnitEdit = 'none' | 'weight' | 'price' | 'all';

export type ProductStatus = "onsale" | "archieved" 

export type ProductSelection = 'tam' | 'sadece liste' | 'one cikar';

export let ProductSelectionWeigts: {[key in ProductSelection]: number} = {
    'tam': 0,
    'sadece liste': -1,
    'one cikar': 1
}


@Table({
    tableName: "Products",
    indexes: [{
        name: "slug_idx",
        fields: ["slug"],
        unique: true
    },
    { type: 'FULLTEXT', name: 'product_fts', fields: ['name', 'shortdesc', 'slug', 'keywords'] }]
})
class Product extends BaseModel<Product> {
    @Column({
        allowNull: false,
    })
    name: string;

    @Column
    keywords: string;    

    @Column({})
    butcherweightsjson: string

    get butcherWeights(): {[key in ButcherProperty]: number} {
        return this.butcherweightsjson ? JSON.parse(this.getDataValue('butcherweightsjson')) : null
    }

    set butcherWeights(value: {[key in ButcherProperty]: number}) {
        this.setDataValue('butcherweightsjson', JSON.stringify(value));
    }


    @Column({
        type: DataType.TEXT
    })
    producttypedatajson: string

    get asAdak(): AdakProductManager {
        let obj = this.producttypedata || {};
        return Object.assign(new AdakProductManager(), obj)        
    } 

    get asKurban(): AdakProductManager {
        let obj = this.producttypedata || {};
        return Object.assign(new KurbanProductManager(), obj)        
    } 

    get asKurbanDiger(): KurbanDigerProductManager {
        let obj = this.producttypedata || {};
        return Object.assign(new KurbanDigerProductManager(), obj)        
    }     

    get producttypedata(): any {
        return this.producttypedatajson ? JSON.parse(this.getDataValue('producttypedatajson')) : null
    }

    set producttypedata(value: any) {
        this.setDataValue('producttypedatajson', JSON.stringify(value));
    }    

    get generatedDesc() {
        let start = "";
        if (this.shortdesc)
        start = `${this.name}: ${this.shortdesc}.`
        else start = `${this.name} kasaptanAl.com'da.` ;
        let availUnits = this.availableUnits;

        let units = availUnits.length < 3 ? this.availableUnits.join(' veya ').toLocaleLowerCase():
        this.availableUnits.slice(0, -1).join(', ').toLocaleLowerCase() + ' veya ' + this.availableUnits[this.availableUnits.length-1].toLocaleLowerCase()
        ;

        let result = `${start} En iyi ${units} fiyat teklifleriyle online sipariş verin, kapınıza gelsin.`

        return result;
    }

    get priceUnitTitle() {
        if (this.priceUnit == 'kg') return 'KG';
        return this[`${this.priceUnit}title`] || this[`${this.priceUnit}`]
    }

    get priceBasedUnitId() {
        if (this.unit1 == this.priceUnit) return 'unit1';
        if (this.unit2 == this.priceUnit) return 'unit2';
        if (this.unit3 == this.priceUnit) return 'unit3';
        return null;
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

    get availableUnitIds() {
        let res = [];
        this.unit1 && res.push("unit1");
        this.unit2 && res.push("unit2");
        this.unit3 && res.push("unit3");
        this.unit4 && res.push("unit4");
        this.unit5 && res.push("unit5");
        return res;
    }


     getUnitBy(nameOrTitle: string): string {
        if (this.unit1 == nameOrTitle || this.unit1title == nameOrTitle) return 'unit1';
        if (this.unit2 == nameOrTitle || this.unit1title == nameOrTitle) return 'unit2';
        if (this.unit3 == nameOrTitle || this.unit1title == nameOrTitle) return 'unit3';
        if (this.unit4 == nameOrTitle || this.unit1title == nameOrTitle) return 'unit4';
        if (this.unit5 == nameOrTitle || this.unit1title == nameOrTitle) return 'unit5';
        return null;
    }

    @HasMany(() => ProductCategory, {
        sourceKey: "id",
        foreignKey: "productid"
    })
    categories: ProductCategory[];

    @HasMany(() => ButcherProduct, {
        sourceKey: "id",
        foreignKey: "productid"
    })
    butchers: ButcherProduct[];

    @Column({
        allowNull: true,
    })
    tag1: string;

    @Column({
        allowNull: false,
        defaultValue: ProductDispatch.dispatcherbased
        
    })
    dispatch: ProductDispatch;

    @Column({
        allowNull: false,
    })
    slug: string;

    @Column({
        allowNull: false,
        defaultValue: "onsale"        
    })
    status: ProductStatus;


    @Column({
        allowNull: true,
    })
    tag2: string;

    @Column({
        allowNull: true,
    })
    tag3: string;

    @Column({
        allowNull: true,
        type: DataType.TEXT
    })
    shortdesc: string;

    @Column({
        allowNull: true,
        type: DataType.TEXT
    })
    notePlaceholder: string;

    @Column({
        allowNull: true,
        type: DataType.TEXT
    })
    featuresText: string;

    // @Column({
    //     allowNull: false,
    //     defaultValue: 'default'
    // })
    // dispatchArea: string;    
    

    @Column({
        allowNull: true,
    })
    pageTitle: string;

    @Column({
        allowNull: true,
    })
    pageDescription: string;

    

    @Column({
        allowNull: true,
        type: DataType.TEXT
    })
    mddesc: string;    

    @Column({
        allowNull: true,
        type: DataType.TEXT
    })
    butcherNote: string;

    @Column({
        allowNull: true,
        type: DataType.TEXT
    })
    butcherProductNote: string;

    @Column({
        allowNull: true,
    })
    displayOrder: number;

    @Column({
        allowNull: true,
    })
    unit1: string;

    @Column({
        allowNull: true,
    })
    unit2: string;

    @Column({
        allowNull: true,
    })
    unit3: string;

    @Column({
        allowNull: true,
    })
    unit4: string;

    @Column({
        allowNull: true,
    })
    unit5: string;

    @Column({
        allowNull: true,
    })
    unit1title: string;

    @Column({
        allowNull: true,
    })
    unit2title: string;

    @Column({
        allowNull: true,
    })
    unit3title: string;

    @Column({
        allowNull: true,
    })
    unit4title: string;

    @Column({
        allowNull: true,
    })
    unit5title: string;

    @Column({
        allowNull: true,
    })
    unit1weight: string;

    @Column({
        allowNull: true,
    })
    unit2weight: string;

    @Column({
        allowNull: true,
    })
    unit3weight: string;

    @Column({
        allowNull: true,
    })
    unit4weight: string;

    @Column({
        allowNull: true,
    })
    unit5weight: string;


    @Column({
        allowNull: true,
        type: DataType.TEXT
    })
    unit1desc: string;

    @Column({
        allowNull: true,
        type: DataType.TEXT
    })
    unit2desc: string;

    @Column({
        allowNull: true,
        type: DataType.TEXT
    })
    unit3desc: string;

    @Column({
        allowNull: true,
        type: DataType.TEXT
    })
    unit1note: string;

    @Column({
        allowNull: true,
        type: DataType.TEXT
    })
    unit1ButcherNote: string;

    @Column({
        allowNull: true,
        type: DataType.TEXT
    })
    unit2ButcherNote: string;

    @Column({
        allowNull: true,
        type: DataType.TEXT
    })
    unit3ButcherNote: string;

    @Column({
        allowNull: true,
        type: DataType.TEXT
    })
    unit4ButcherNote: string;

    @Column({
        allowNull: true,
        type: DataType.TEXT
    })
    unit5ButcherNote: string;


    @Column({
        allowNull: true,
        type: DataType.TEXT
    })
    unit2note: string;

    @Column({
        allowNull: true,
        type: DataType.TEXT
    })
    unit3note: string;


    @Column({
        allowNull: true,
        type: DataType.TEXT
    })
    unit4desc: string;

    @Column({
        allowNull: true,
        type: DataType.TEXT
    })
    unit5desc: string;

    @Column({
        allowNull: true
    })
    unit1WeigthNote: string;

    @Column({
        allowNull: true
    })
    unit2WeigthNote: string;    

    @Column({
        allowNull: true
    })
    unit3WeigthNote: string;

    @Column({
        allowNull: true
    })
    unit4WeigthNote: string;

    @Column({
        allowNull: true
    })
    unit5WeigthNote: string;    

    // @Column({
    //     allowNull: false,
    //     defaultValue: 1
    // })
    // defaultUnit: number;  
    
    // @Column({
    //     allowNull: false,
    //     defaultValue: 1,
    //     type: DataType.DECIMAL(8, 3)
    // })
    // defaultAmount: number;




    @Column({
        allowNull: false,
        defaultValue: 4.7,
        type: DataType.DECIMAL(4, 2)
    })
    ratingValue: number;    
    
    @Column({
        allowNull: false,
        defaultValue: 1
    })
    reviewCount: number;     
    

    @Column({
        allowNull: false,
        defaultValue: 1,
        type: DataType.DECIMAL(8, 3)
    })
    unit1def: number;

    @Column({
        allowNull: false,
        defaultValue: 1,
        type: DataType.DECIMAL(8, 3)
    })
    unit2def: number;    

    @Column({
        allowNull: false,
        defaultValue: 1,
        type: DataType.DECIMAL(8, 3)
    })
    unit3def: number;

    @Column({
        allowNull: false,
        defaultValue: 1,
        type: DataType.DECIMAL(8, 3)
    })
    unit1min: number;        

    @Column({
        allowNull: false,
        defaultValue: 1,
        type: DataType.DECIMAL(8, 3)
    })
    unit2min: number;   
    
    @Column({
        allowNull: false,
        defaultValue: 1,
        type: DataType.DECIMAL(8, 3)
    })
    unit3min: number;       

    @Column({
        allowNull: false,
        defaultValue: 5,
        type: DataType.DECIMAL(8, 3)
    })
    unit1max: number;        

    @Column({
        allowNull: false,
        defaultValue: 5, 
        type: DataType.DECIMAL(8, 3)
    })
    unit2max: number;   
    
    @Column({ 
        allowNull: false,
        defaultValue: 5,
        type: DataType.DECIMAL(8, 3)
    })
    unit3max: number; 
    
    @Column({
        allowNull: false,
        defaultValue: 1,
        type: DataType.DECIMAL(8, 3)
    })
    unit1step: number;        

    @Column({
        allowNull: false,
        defaultValue: 1,
        type: DataType.DECIMAL(8, 3)
    })
    unit2step: number;   
    
    @Column({
        allowNull: false,
        defaultValue: 1,
        type: DataType.DECIMAL(8, 3)
    })
    unit3step: number;   
    
    @Column({
        allowNull: false,
        defaultValue: 0.25,
        type: DataType.DECIMAL(8, 3)
    })
    unit1perPerson: number;        

    @Column({
        allowNull: false,
        defaultValue: 0.25,
        type: DataType.DECIMAL(8, 3)
    })
    unit2perPerson: number;   
    
    @Column({
        allowNull: false,
        defaultValue: 0.25,
        type: DataType.DECIMAL(8, 3)
    })
    unit3perPerson: number;      
    
    @Column({
        allowNull: false,
        defaultValue: 0
    })
    unit1Order: number;     

    @Column({
        allowNull: false,
        defaultValue: 0
    })
    unit2Order: number;    
    
    @Column({
        allowNull: false,
        defaultValue: 0
    })
    unit3Order: number;       
    
    @Column({
        allowNull: false,
        defaultValue: 0
    })
    unit4Order: number;     

    @Column({
        allowNull: false,
        defaultValue: 0
    })
    unit5Order: number;         
    
    @Column({
        allowNull: false,
        defaultValue: 0,
        type: DataType.DECIMAL(8, 3)
    })
    unit1kgRatio: number;  
    
    @Column({
        allowNull: false,
        defaultValue: 'selected'
    })
    unit1ButcherUnitSelection: ButcherUnitSelection;   

    @Column({
        allowNull: false,
        defaultValue: 'selected'
    })
    unit2ButcherUnitSelection: ButcherUnitSelection;   

    @Column({
        allowNull: false,
        defaultValue: 'selected'
    })
    unit3ButcherUnitSelection: ButcherUnitSelection;   

    @Column({
        allowNull: false,
        defaultValue: 'none'
    })
    unit1ButcherUnitEdit: string;  

    @Column({
        allowNull: false,
        defaultValue: 'none'
    })
    unit2ButcherUnitEdit: string;  

    @Column({
        allowNull: false,
        defaultValue: 'none'
    })
    unit3ButcherUnitEdit: string;  


    @Column({
        allowNull: false,
        defaultValue: 0,
        type: DataType.DECIMAL(8, 3)
    })
    unit2kgRatio: number;     
    
    @Column({
        allowNull: false,
        defaultValue: 0,
        type: DataType.DECIMAL(8, 3)
    })
    unit3kgRatio: number;    

    @Column({
        allowNull: false,
        defaultValue: 0,
        type: DataType.DECIMAL(13, 2)
    })
    kgPrice: number;    

    @Column({
        allowNull: false,
        defaultValue: 'generic'
    })
    productType: string;

    @Column({
        allowNull: true
    })
    badge: string;

    @Column({
        allowNull: false,
        defaultValue: 'kg'
    })
    priceUnit: string;
    
    getCategories(): Category[] {
        let result = [];
        for (let i = 0; i < this.categories.length; i++) {
            result.push(this.categories[i].category)
        }
        return result;
    }

    resources: Resource[];
    nutritionView: NutritionView;


    async getPriceStats() {
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
        and Butchers.approved=true`

        let res = await Product.sequelize.query(q, {
            raw: true  ,
            plain: true,
            type: QueryTypes.SELECT       
        } )        

        return res;
    }

    

    async loadnutritionValues() {
        this.nutritionView = await NutritionValue.loadView('product', this.id);
    }

    async loadResources() {
        this.resources = await Resource.findAll({
            where: {
                type: ["product-photos", "product-videos"],
                [Op.or]: {
                    ref1: this.id,
                    ref2: this.id,
                    ref3: this.id,
                    ref4: this.id,
                    ref5: this.id,
                    ref6: this.id                
                }
            },
            order: [["type", "ASC"], ["displayOrder", "DESC"], ["updatedOn", "DESC"]]
        })
        this.resources.forEach(c=>c.product = this);
    }

}

export default Product;