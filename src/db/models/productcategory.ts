import { Table, Column, DataType, Model, HasMany, CreatedAt, UpdatedAt, DeletedAt, Unique, Default, AllowNull, ForeignKey, BelongsTo } from 'sequelize-typescript';
import BaseModel from "./basemodel"
import Helper from '../../lib/helper';
import Product from './product';
import Category from './category';

@Table({
    tableName: "ProductCategories",
    indexes: [{
        name: "productcategory_idx",
        fields: ["productid", "categoryid"],
        unique: true
    }]
})

class ProductCategory extends BaseModel<ProductCategory> {
    @ForeignKey(() => Product)
    productid: number

    @BelongsTo(() => Product, "productid")
    product: Product;

    @ForeignKey(() => Category)
    categoryid: number

    @BelongsTo(() => Category, "categoryid")
    category: Category;

    @Column({
        allowNull: true,
    })
    displayOrder: number;
}

export default ProductCategory;