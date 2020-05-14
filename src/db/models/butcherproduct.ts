import { Table, Column, DataType, Model, HasMany, CreatedAt, UpdatedAt, DeletedAt, Unique, Default, AllowNull, ForeignKey, BelongsTo } from 'sequelize-typescript';
import BaseModel from "./basemodel"
import Helper from '../../lib/helper';
import Product from './product';
import Category from './category';
import Butcher from './butcher';
import ProductCategory from './productcategory';
import { PriceView } from '../../models/common';

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


    get priceView(): PriceView {
        if (this.kgPrice > 0) {
            return {
                price: this.kgPrice,
                unit: 'kg',
                unitTitle: 'KG'
            }
        } else {
            let units = ['unit1', 'unit2', 'unit3'];
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
        defaultValue: true
    })
    unit1enabled: boolean;    

    @Column({
        allowNull: false,
        defaultValue: true
    })
    unit2enabled: boolean;     

    @Column({
        allowNull: false,
        defaultValue: true
    })
    unit3enabled: boolean;     

    @Column({
        allowNull: false,
        defaultValue: true
    })
    unit4enabled: boolean;    
    
    @Column({
        allowNull: false,
        defaultValue: true
    })
    unit5enabled: boolean;     

    @Column({
        allowNull: false,
        defaultValue: 0,
        type: DataType.DECIMAL(13, 2)        
    })
    kgPrice: number;     

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
}

export default ButcherProduct;