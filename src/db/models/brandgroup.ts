


import { Table, Column, DataType, Model, HasMany, CreatedAt, UpdatedAt, DeletedAt, Unique, Default, AllowNull, ForeignKey, BelongsTo } from 'sequelize-typescript';
import BaseModel from "./basemodel"
import Helper from '../../lib/helper';
import User from './user';
import Butcher from './butcher';
import ShopListItem from './shoplistitem';
import { Order } from './order';
import { ShopCard } from '../../models/shopcard';
import Brand from './brand';





@Table({
    tableName: "BrandGroups",
    indexes: [{
        name: "name_idx",
        fields: ["name"]
    }]
})

class BrandGroup extends BaseModel<BrandGroup> {

    @Column({
        allowNull: false
    })
    name: string;       

    @HasMany(() => Brand, {
        sourceKey: "id",
        foreignKey: "groupid",
    })
    brands: Brand[];

}
export default BrandGroup;