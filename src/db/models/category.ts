import { Table, Column, DataType, Model, HasMany, CreatedAt, UpdatedAt, DeletedAt, Unique, Default, AllowNull, ForeignKey, BelongsTo } from 'sequelize-typescript';
import BaseModel from "./basemodel"
import Helper from '../../lib/helper';
import ProductCategory from './productcategory';
import ButcherProduct from './butcherproduct';
import SubCategory from './subcategory';

export enum CategorySubItemsMode {
    none = 'none',
    tag1 = 'tag1',
    tag2 = 'tag2',
    tag3 = 'tag3',
    subitems = 'subitems',
    subitemsasslider = 'subitemsasslider',
    subitemshiddenasslider = 'subitemshiddenasslider'
}

@Table({
    tableName: "Categories",
    indexes: [{
        name: "slug_idx",
        fields: ["slug"],
        unique: true
    },
    { type: 'FULLTEXT', name: 'category_fts', fields: ['name', 'shortdesc', 'slug', 'keywords'] }]
})

class Category extends BaseModel<Category> {
    @Column({
        allowNull: false,
    })
    name: string;

    @Column({
        allowNull: true
    })
    listTitle: string;    

    @Column({
        allowNull: false,
        defaultValue: 'subitems'
    })
    subItemsMode: string;    


    @Column({
        allowNull: false,
    })
    type: string;

    @Column({
        allowNull: true
    })
    searchhint: string;    

    @Column
    keywords: string;    

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
    tarifDesc: string;    

    @Column({
        allowNull: true
    })
    tarifPageTitle: string;

    @Column({
        allowNull: true
    })
    tarifPageDesc: string;   


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

    @Column({
        allowNull: false,
        defaultValue: 'active'
    })
    status: string;

    @HasMany(() => ProductCategory, {
        sourceKey: "id",
        foreignKey: "categoryid",
        onDelete: "CASCADE"
    })
    products: ProductCategory[];

    @HasMany(() => SubCategory, {
        sourceKey: "id",
        foreignKey: "categoryid",
        onDelete: "CASCADE"
    })
    subCategories: SubCategory[];     

    // @HasMany(() => ButcherProduct, {
    //     sourceKey: "id",
    //     foreignKey: "categoryid"
    // })
    // butchers: ButcherProduct[];
}

export default Category;