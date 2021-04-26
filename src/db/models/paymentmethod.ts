


import { Table, Column, DataType, Model, HasMany, CreatedAt, UpdatedAt, DeletedAt, Unique, Default, AllowNull, ForeignKey, BelongsTo } from 'sequelize-typescript';
import BaseModel from "./basemodel"
import Helper from '../../lib/helper';
import User from './user';
import Butcher from './butcher';
import ShopListItem from './shoplistitem';
import { Order } from './order';
import { ShopCard } from '../../models/shopcard';


export type Method = 'creditcard' 


@Table({
    tableName: "PaymentMethods",
    indexes: [{
        name: "userid_idx",
        fields: ["userid"]
    }]
})

class PaymentMethod extends BaseModel<PaymentMethod> {

    @ForeignKey(() => User)
    userid: number;

    @BelongsTo(() => User, "userid")
    user: User;

    @Column({
        allowNull: false,
        defaultValue: 'creditcard'
    })
    method: Method;       

    @Column({
        allowNull: false
    })
    instance: string;   

    @Column({
        allowNull: false
    })
    name: string;   

    @Column({
        allowNull: false,
        type: DataType.TEXT
    })
    data: string;  
    
    get dataObj(): any {
        return this.data ? JSON.parse(this.data) : null
    }

    @Column({
        allowNull: false,
        defaultValue: true
    })
    enabled: boolean;  
}
export default PaymentMethod;