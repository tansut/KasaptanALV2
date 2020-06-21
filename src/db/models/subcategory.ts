import { Table, Column, DataType, Model, HasMany, CreatedAt, UpdatedAt, DeletedAt, Unique, Default, AllowNull, ForeignKey, BelongsTo } from 'sequelize-typescript';
import BaseModel from "./basemodel"
import Helper from '../../lib/helper';
import Product from './product';
import Category from './category';

@Table({
    tableName: "Subcategories",
    indexes: []
})

class SubCategory extends BaseModel<SubCategory> {
    @ForeignKey(() => Product)
    categoryid: number

    @BelongsTo(() => Category, "categoryid")
    category: Category;

    @Column({
        allowNull: true,
    })
    displayOrder: number;

    @Column({
        allowNull: false,
    })
    title: string;    

    @Column({
        allowNull: true,
        type: DataType.TEXT
    })
    description: string;      

    @Column({
        allowNull: false,
        type: DataType.BOOLEAN,
        defaultValue: true
    })
    visible: boolean;    

    products: Product[];

    
}

export default SubCategory;