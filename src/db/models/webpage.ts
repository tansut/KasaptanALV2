import { Table, Column, DataType, Model, HasMany, CreatedAt, UpdatedAt, DeletedAt, Unique, Default, AllowNull, ForeignKey, BelongsTo } from 'sequelize-typescript';
import BaseModel from "./basemodel"
import Helper from '../../lib/helper';
import ProductCategory from './productcategory';
import ButcherProduct from './butcherproduct';

@Table({
    tableName: "WebPages",
    indexes: [{
        name: "slug_idx",
        fields: ["slug"],
        unique: true
    }]
})

class WebPage extends BaseModel<WebPage> {

    @Column({
        allowNull: true,
    })
    pageTitle: string;

    @Column({
        allowNull: true,
    })
    pageDescription: string;
    
    @Column({
        allowNull: false,
    })
    slug: string;
}

export default WebPage;