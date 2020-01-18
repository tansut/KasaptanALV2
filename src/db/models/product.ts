import { Table, Column, DataType, Model, HasMany, CreatedAt, UpdatedAt, DeletedAt, Unique, Default, AllowNull, ForeignKey, BelongsTo } from 'sequelize-typescript';
import BaseModel from "./basemodel"
import Helper from '../../lib/helper';
import ProductCategory from './productcategory';
import Category from './category';
import ButcherProduct from './butcherproduct';
import Resource from './resource';
import { Op } from 'sequelize';

@Table({
    tableName: "Products",
    indexes: [{
        name: "slug_idx",
        fields: ["slug"],
        unique: true
    },
    { type: 'FULLTEXT', name: 'product_fts', fields: ['name', 'description', 'mddesc'] }]
})

class Product extends BaseModel<Product> {
    @Column({
        allowNull: false,
    })
    name: string;

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
    })
    slug: string;


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

    @Column({
        allowNull: false,
        defaultValue: 1
    })
    defaultUnit: number;  
    
    @Column({
        allowNull: false,
        defaultValue: 1,
        type: DataType.DECIMAL(8, 3)
    })
    defaultAmount: number;



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
        defaultValue: 0.25,
        type: DataType.DECIMAL(8, 3)
    })
    perPersonKg: number; 

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
    

    getCategories(): Category[] {
        let result = [];
        for (let i = 0; i < this.categories.length; i++) {
            result.push(this.categories[i].category)
        }
        return result;
    }

    resources: Resource[];

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