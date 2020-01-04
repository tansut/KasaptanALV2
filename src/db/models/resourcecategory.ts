import { Table, Column, DataType, Model, HasMany, CreatedAt, UpdatedAt, DeletedAt, Unique, Default, AllowNull, ForeignKey, BelongsTo } from 'sequelize-typescript';
import BaseModel from "./basemodel"
import Helper from '../../lib/helper';
import Product from './product';
import Category from './category';
import Resource from './resource';

@Table({
    tableName: "ResourceCategories",
    indexes: [{
        name: "resourcecategory_idx",
        fields: ["resourceid", "categoryid"],
        unique: true
    }]
})

class ResourceCategory extends BaseModel<ResourceCategory> {
    @ForeignKey(() => Resource)
    resourceid: number

    @BelongsTo(() => Resource, "resourceid")
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

export default ResourceCategory;