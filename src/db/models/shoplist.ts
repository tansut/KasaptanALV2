


import { Table, Column, DataType, Model, HasMany, CreatedAt, UpdatedAt, DeletedAt, Unique, Default, AllowNull, ForeignKey, BelongsTo } from 'sequelize-typescript';
import BaseModel from "./basemodel"
import Helper from '../../lib/helper';
import User from './user';
import Butcher from './butcher';
import ShopListItem from './shoplistitem';
import { Order } from './order';
import { ShopCard } from '../../models/shopcard';


export type userLogCategory = 'page' | 'product' | 'category' | 'shopcard' | 'butcher'
export type UserLogAction = 'view' | 'select' | 'add' | 'remove' | 'update'

@Table({
    tableName: "ShopLists",
    indexes: [{
        name: "userid_idx",
        fields: ["userid"]
    }]
})

class ShopList extends BaseModel<ShopList> {

    @ForeignKey(() => User)
    userid: number

    @BelongsTo(() => User, "userid")
    user: User;

    @ForeignKey(() => Butcher)
    butcherid: number

    @BelongsTo(() => Butcher, "butcherid")
    butcher: Butcher;

    @HasMany(() => ShopListItem, {
        sourceKey: "id",
        foreignKey: "listid",
        //as: "ButcherProduct"
    })
    items: ShopListItem[];   

    @Column({
        allowNull: true,
    })
    name: string;    

    @Column({
        allowNull: true,
    })
    ordernote: string;  

    @Column({
        allowNull: true,
    })
    desc: string;        


    static fromOrder(o: Order) {
        let s = new ShopList();
        s.userid = o.userId;
        s.butcherid = o.butcherid;
        s.items = [];
        o.items.forEach(oi => {
            let item = new ShopListItem();
            item.list = s;
            item.productid = oi.productid;
            item.note = oi.note;
            item.poUnit = oi.pounit;
            item.quantity = oi.quantity;
            s.items.push(item)
        });
        return s;
    }
}
export default ShopList;