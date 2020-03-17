import { Table, Column, DataType, Model, HasMany, CreatedAt, UpdatedAt, DeletedAt, Unique, Default, AllowNull, ForeignKey, BelongsTo } from 'sequelize-typescript';
import BaseModel from "./basemodel"
import Helper from '../../lib/helper';
import ProductCategory from './productcategory';
import ButcherProduct from './butcherproduct';
import Category from './category';

@Table({
    tableName: "PriceCategories",
    indexes: [{
        name: "slug_idx",
        fields: ["slug"],
        unique: true
    },
    { type: 'FULLTEXT', name: 'price_category_fts', fields: ['name', 'shortdesc', 'slug'] }]
})

class PriceCategory extends BaseModel<PriceCategory> {
    @Column({
        allowNull: false,
    })
    name: string;

    @Column({
        allowNull: false,
        defaultValue: 'generic'
    })
    type: string;

    @Column({
        allowNull: false,
    })
    slug: string;   

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

    @Column({
        allowNull: false,
        defaultValue: 'active'
    })
    status: string;

    @ForeignKey(() => Category)
    categoryid: number

    @BelongsTo(() => Category, "categoryid")
    category: Category;
}

export default PriceCategory;