


import { Table, Column, DataType, Model, HasMany, CreatedAt, UpdatedAt, DeletedAt, Unique, Default, AllowNull, ForeignKey, BelongsTo } from 'sequelize-typescript';
import BaseModel from "./basemodel"
import Helper from '../../lib/helper';


export type userLogCategory = 'page' | 'product' | 'category' | 'shopcard' | 'butcher'
export type UserLogAction = 'view' | 'select' | 'add' | 'remove' | 'update'

@Table({
    tableName: "UserLogs",
    indexes: [{
        name: "userid_idx",
        fields: ["userid"]
    }]
})
class UserLog extends BaseModel<UserLog> {

    @Column({
        allowNull: false
    })
    userid: number;

    @Column({
        allowNull: true,
    })
    name: string;    

    @Column({
        allowNull: true,
    })
    role: string;        

    @Column({
        allowNull: true,
    })
    platform: string;        

    @Column({
        allowNull: false,
    })
    logCategory: string;

    @Column({
        allowNull: false,
    })
    logAction: string;

    @Column({
        allowNull: true
    })
    productid: number;

    @Column({
        allowNull: true
    })
    productName: string;

    @Column({
        allowNull: true
    })
    categoryid: number;    

    @Column({
        allowNull: true
    })
    categoryName: string;    

    @Column({
        allowNull: true
    })
    areaid: number;

    @Column({
        allowNull: true
    })
    arelaL1: string;

    @Column({
        allowNull: true
    })
    arelaL2: string;    

    @Column({
        allowNull: true
    })
    arelaL3: string;

    @Column({
        allowNull: true
    })
    arelaL4: string;    

    @Column({
        allowNull: true,
    })
    areaDisplay: string;

    @Column({
        allowNull: true,
    })
    butcherid: number;    

    @Column({
        allowNull: true,
    })
    butcherName: string;        

    @Column({
        allowNull: true
    })
    ip: string;
   

    @Column({
        type: DataType.TEXT
    })
    url: string;

    @Column({
        allowNull: true
    })
    referal: string;    

    @Column({
        allowNull: true
    })
    note: string;        
}

export default UserLog;