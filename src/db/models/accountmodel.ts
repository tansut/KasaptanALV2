import { Table, Column, DataType, Model, HasMany, CreatedAt, UpdatedAt, DeletedAt, Unique, Default, AllowNull, ForeignKey, BelongsTo } from 'sequelize-typescript';
import BaseModel from "./basemodel"
import { AccountingOperation } from '../../models/account';
import Helper from '../../lib/helper';
import { SaveOptions } from 'sequelize/types';
const orderid = require('order-id')('dkfjsdklfjsdlkg450435034.,')


@Table({
    tableName: "Accounts",
    indexes: [{
        name: "acc_idx_1",
        fields: ["code"]
    },

    {
        name: "acc_idx_2",
        fields: ["operation", "accorder"]
    }]
})

class AccountModel extends BaseModel<AccountModel> {

    static async saveOperation(list: AccountingOperation, ops: SaveOptions) {
        let arr = [];
        list.accounts.forEach((l, i) => {
            var dbItem = new AccountModel({
                accorder: i + 1,
                borc: l.borc,
                alacak: l.alacak,
                code: l.code,
                desc: list.desc,
                operation: list.opcode,
                date: Helper.Now()
            })            
            arr.push(dbItem.save(ops))      
        })
        Promise.all(arr);
    }

    @Column({
        allowNull: false
    })
    code: string;

    @Column({
        allowNull: false,
        type: DataType.INTEGER
    })
    accorder: number;    

    @Column({
        allowNull: false,
        type: DataType.DECIMAL(13, 2)
    })
    borc: number;
    
    @Column({
        allowNull: false,
        type: DataType.DECIMAL(13, 2)
    })
    alacak: number;

    @Column({
        allowNull: false
    })
    desc: string;
    
    @Column({
        allowNull: false        
    })
    operation: string;        

    @Column({
        allowNull: false        
    })
    date: Date;       
}

export default AccountModel;