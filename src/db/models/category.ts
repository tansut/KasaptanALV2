import { Table, Column, DataType, Model, HasMany, CreatedAt, UpdatedAt, DeletedAt, Unique, Default, AllowNull, ForeignKey, BelongsTo } from 'sequelize-typescript';
import BaseModel from "./basemodel"
import Helper from '../../lib/helper';
import ProductCategory from './productcategory';
import ButcherProduct from './butcherproduct';

@Table({
    tableName: "Categories",
    indexes: [{
        name: "slug_idx",
        fields: ["slug"],
        unique: true
    },
    { type: 'FULLTEXT', name: 'product_fts', fields: ['name', 'shortdesc', 'mddesc', 'slug'] }]
})

class Category extends BaseModel<Category> {
    @Column({
        allowNull: false,
    })
    name: string;

    @Column({
        allowNull: false,
    })
    type: string;

    @Column({
        allowNull: false,
    })
    slug: string;

    @Column({
        allowNull: true
    })
    tarifTitle: string;

    @Column({
        allowNull: true
    })
    relatedFoodCategory: number;    

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
    shortdesc: string;

    @Column({
        allowNull: true,
        type: DataType.TEXT
    })
    mddesc: string;    

    @Column({
        allowNull: true,
    })
    displayOrder: number;

    @HasMany(() => ProductCategory, {
        sourceKey: "id",
        foreignKey: "categoryid",
        onDelete: "CASCADE"
    })
    products: ProductCategory[];

    // @HasMany(() => ButcherProduct, {
    //     sourceKey: "id",
    //     foreignKey: "categoryid"
    // })
    // butchers: ButcherProduct[];
}

export default Category;