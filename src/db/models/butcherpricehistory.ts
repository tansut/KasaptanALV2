import { Table, Column, DataType, Model, HasMany, CreatedAt, UpdatedAt, DeletedAt, Unique, Default, AllowNull, ForeignKey, BelongsTo } from 'sequelize-typescript';
import BaseModel from "./basemodel"
import Helper from '../../lib/helper';
import Product from './product';
import Category from './category';
import Butcher from './butcher';
import ProductCategory from './productcategory';
import ButcherProduct from './butcherproduct';
import { Transaction } from "sequelize";


@Table({
    tableName: "ButcherPriceHistories",
    indexes: [{
        name: "butcherpricehistory_idx",
        fields: ["butcherid", "productid"],
        unique: false
    }]
})

class ButcherPriceHistory extends BaseModel<ButcherPriceHistory> {

    static async manageHistory(rec: ButcherProduct, t: Transaction) {
        if (!rec.enabled)
            return;            
        let existing = await ButcherPriceHistory.findOne({
            where: {
                butcherid: rec.butcherid,
                productid: rec.productid,                
            },
            order: [['id', 'desc']],            
        })
        if (existing) {
            if (existing.unit1price == rec.unit1price && 
                existing.unit2price == rec.unit2price &&
                existing.unit3price == rec.unit3price &&
                existing.unit4price == rec.unit4price &&
                existing.unit5price == rec.unit5price &&
                existing.kgPrice == rec.kgPrice)
                return;
        }    
        
        let newItem = new ButcherPriceHistory();
        newItem.unit1price = rec.unit1price;
        newItem.unit2price = rec.unit2price;
        newItem.unit3price = rec.unit3price;
        newItem.unit4price = rec.unit4price;
        newItem.unit5price = rec.unit5price;
        newItem.kgPrice = rec.kgPrice;
        newItem.productid = rec.productid;
        newItem.butcherid = rec.butcherid;
        return newItem.save({
            transaction: t
        })
    }


    @ForeignKey(() => Butcher)
    butcherid: number

    @BelongsTo(() => Butcher, "butcherid")
    butcher: Butcher;

    @ForeignKey(() => Product)
    productid: number

    @BelongsTo(() => Product, "productid")
    product: Product;

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
        defaultValue: 0,
        type: DataType.DECIMAL(13, 2)        
    })
    kgPrice: number;     

}

export default ButcherPriceHistory;