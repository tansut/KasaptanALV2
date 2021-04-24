import { Table, Column, DataType, Model, HasMany, CreatedAt, UpdatedAt, DeletedAt, Unique, Default, AllowNull, ForeignKey, BelongsTo } from 'sequelize-typescript';
import BaseModel from "./basemodel"
import Helper from '../../lib/helper';
import Product from './product';
import Category from './category';
import SubCategory from './subcategory';

export type ProductRelationType= 'price' | 'similar'


@Table({
    tableName: "ProductRelations",
    indexes: [{
        name: "product_idx",
        fields: ["productid1", "productid2"],
        unique: true
    }]
})
class ProductRelation extends BaseModel<ProductRelation> {
    @ForeignKey(() => Product)
    productid1: number

    @BelongsTo(() => Product, "productid1")
    product1: Product;

    @ForeignKey(() => Product)
    productid2: number

    @BelongsTo(() => Product, "productid2")
    product2: Product;

    @Column({
        allowNull: true
    })
    displayOrder: number;

    @Column({
        allowNull: false,
        defaultValue: 'price'
    })
    relation: ProductRelationType;

    @Column({
        allowNull: true
    })
    note: string;
 
}

export default ProductRelation;