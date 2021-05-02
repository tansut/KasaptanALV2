import { Table, Column, DataType, Model, HasMany, CreatedAt, UpdatedAt, DeletedAt, Unique, Default, AllowNull, ForeignKey, BelongsTo } from 'sequelize-typescript';
import BaseModel from "./basemodel"
import Helper from '../../lib/helper';
import Product, { ProductSelection } from './product';
import Category from './category';
import Butcher from './butcher';
import ProductCategory from './productcategory';
import { PriceView } from '../../models/common';
import { Transaction } from "sequelize";
import ButcherPriceHistory from './butcherpricehistory';


@Table({
    tableName: "ButcherProducts",
    indexes: [{
        name: "butcherproduct_idx",
        fields: ["butcherid", "productid"],
        unique: true
    }]
})



class ButcherProduct extends BaseModel<ButcherProduct> {
    @ForeignKey(() => Butcher)
    butcherid: number

    @BelongsTo(() => Butcher, "butcherid")
    butcher: Butcher;

    @ForeignKey(() => Product)
    productid: number

    @BelongsTo(() => Product, "productid")
    product: Product;


    get enabledUnits() {
        let res = [];
        let units = ['unit1', 'unit2', 'unit3'];
        units.forEach(i=> {
            this[`${i}enabled`] && res.push(`${i}`)
        })
        return res;
    }

    canBeEnabled() {
        let eu = this.enabledUnits;
        if (!eu.length) return false;

        return true;
    }

    get priceView(): PriceView {
        let units = ['unit1', 'unit2', 'unit3'];
        if (this.kgPrice > 0) {
            let title = 'KG';
            units.forEach(u=> {
                if (this.product[`${u}`] == 'kg') {
                    title = this.product[`${u}title`]
                }
            })
            return {
                price: this.kgPrice,
                unit: 'kg',
                unitTitle: title
            }
        } else {
            
            for(let i = 0; i< units.length;i++) {
                let done = this[`${units[i]}enabled`] && this[`${units[i]}price`] > 0;
                if (done) return {
                    unit: this.product[`${units[i]}`],
                    unitTitle: this.product[`${units[i]}title`],
                    price: this[`${units[i]}price`]
                }
            }

            return {
                unit:'',
                price: 0.00,
                unitTitle:''
            }
        }
    }

    @Column({
        allowNull: true,
    })
    enabled: boolean;

    @Column({
        allowNull: true,
        type: DataType.DECIMAL(13, 2)
    })
    unit1price: number;

    @Column({
        allowNull: true,
        type: DataType.DECIMAL(13, 2)
    })
    unit2price: number;

    @Column({
        allowNull: true,
        type: DataType.DECIMAL(13, 2)
    })
    unit3price: number;

    @Column({
        allowNull: true,
        type: DataType.DECIMAL(13, 2)
    })
    unit4price: number;

    @Column({
        allowNull: true,
        type: DataType.DECIMAL(13, 2)
    })
    unit5price: number;

    @Column({
        allowNull: false,
        defaultValue: false
    })
    unit1enabled: boolean;    

    @Column({
        allowNull: false,
        defaultValue: false
    })
    unit2enabled: boolean;     

    @Column({
        allowNull: false,
        defaultValue: false
    })
    unit3enabled: boolean;     

    @Column({
        allowNull: false,
        defaultValue: false
    })
    unit4enabled: boolean;    
    
    @Column({
        allowNull: false,
        defaultValue: false
    })
    unit5enabled: boolean;     

    @Column({
        allowNull: false,
        defaultValue: 0,
        type: DataType.DECIMAL(13, 2)        
    })
    kgPrice: number;     


    @Column({
        allowNull: false,
        defaultValue: 'tam'
    })
    selection: ProductSelection;


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
    displayOrder: number;

    @Column({
        allowNull: false,
        defaultValue: false
    })
    vitrin: boolean;

    @Column({
        allowNull: true,
        type: DataType.TEXT
    })
    mddesc: string;   

    @Column({
        allowNull: true,
        type: DataType.TEXT
    })
    longdesc: string;       

    @Column({
        allowNull: true,
        type: DataType.TEXT
    })
    fromButcherDesc: string;       
    
}

export default ButcherProduct;