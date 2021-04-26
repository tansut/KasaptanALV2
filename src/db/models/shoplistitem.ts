


import { Table, Column, DataType, Model, HasMany, CreatedAt, UpdatedAt, DeletedAt, Unique, Default, AllowNull, ForeignKey, BelongsTo } from 'sequelize-typescript';
import BaseModel from "./basemodel"
import Helper from '../../lib/helper';
import User from './user';
import Butcher from './butcher';
import ShopList from './shoplist';
import Product from './product';


export type userLogCategory = 'page' | 'product' | 'category' | 'shopcard' | 'butcher'
export type UserLogAction = 'view' | 'select' | 'add' | 'remove' | 'update'

@Table({
    tableName: "ShopListItems",
    indexes: [{
        name: "listid_idx",
        fields: ["listid"]
    }]
})

class ShopListItem extends BaseModel<ShopListItem> {

    @ForeignKey(() => ShopList)
    listid: number

    @BelongsTo(() => ShopList, "listid")
    list: ShopList;    

    @ForeignKey(() => Product)
    productid: number

    @BelongsTo(() => Product, "productid")
    product: Product;

    @Column({
        allowNull: true,
    })
    note: string;    

    @Column({
        allowNull: true,
    })
    poUnit: string; 
    
    @Column({
        allowNull: false,
        type: DataType.DECIMAL(13, 2)
    })
    quantity: number;
}
export default ShopListItem;