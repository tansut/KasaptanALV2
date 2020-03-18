import { Table, Column, DataType, Model, HasMany, CreatedAt, UpdatedAt, DeletedAt, Unique, Default, AllowNull, ForeignKey, BelongsTo } from 'sequelize-typescript';
import BaseModel from "./basemodel"
import Helper from '../../lib/helper';
import Product from './product';
import Category from './category';
import Butcher from './butcher';
import ProductCategory from './productcategory';

@Table({
    tableName: "ButcherPriceHistories",
    indexes: [{
        name: "butcherpricehistory_idx",
        fields: ["butcherid", "productid"],
        unique: false
    }]
})

class ButcherPriceHistory extends BaseModel<ButcherPriceHistory> {
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