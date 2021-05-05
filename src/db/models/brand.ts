


import { Table, Column, DataType, Model, HasMany, CreatedAt, UpdatedAt, DeletedAt, Unique, Default, AllowNull, ForeignKey, BelongsTo } from 'sequelize-typescript';
import BaseModel from "./basemodel"
import Helper from '../../lib/helper';
import User from './user';
import Butcher from './butcher';
import ShopListItem from './shoplistitem';
import { Order } from './order';
import { ShopCard } from '../../models/shopcard';
import BrandGroup from './brandgroup';


export type Method = 'creditcard' 


@Table({
    tableName: "Brands",
    indexes: [{
        name: "group_idx",
        fields: ["groupid"]
    }]
})

class Brand extends BaseModel<Brand> {

    @ForeignKey(() => BrandGroup)
    groupid: number;

    @Column({
        allowNull: false
    })
    name: string;       


}
export default Brand;