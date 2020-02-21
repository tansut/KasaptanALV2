import { Table, Column, DataType, Model, HasMany, CreatedAt, UpdatedAt, DeletedAt, Unique, Default, AllowNull, ForeignKey, BelongsTo } from 'sequelize-typescript';
import BaseModel from "./basemodel"
import Helper from '../../lib/helper';
import ProductCategory from './productcategory';
import ButcherProduct from './butcherproduct';

@Table({
    tableName: "Contents",
    indexes: [{
        name: "slug_idx",
        fields: ["slug"],
        unique: true
    }]
})

class Content extends BaseModel<Content> {

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
    title: string;

    @Column({
        allowNull: false,
    })
    category: string;

    @Column({
        allowNull: false,
    })
    slug: string;

    @Column({
        allowNull: true,
    })
    categorySlug: string;

    @Column({
        allowNull: true,
    })
    description: string;

    @Column({
        allowNull: true,
    })
    displayOrder: number;

    @Column
    markdown: Buffer;


    get markDownStr(): string {
        return this.getDataValue('markdown') ? (<Buffer>this.getDataValue('markdown')).toString() : ""
    }

    set markDownStr(value: string) {
        this.setDataValue('markdown', Buffer.from(value));
    }

}

export default Content;