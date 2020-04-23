import { Table, Column, DataType, Model, HasMany, CreatedAt, UpdatedAt, DeletedAt, Unique, Default, AllowNull, ForeignKey, BelongsTo } from 'sequelize-typescript';
import BaseModel from "./basemodel"
import Helper from '../../lib/helper';

@Table({
    tableName: "Payments",
    indexes: [{
        fields: ['paymentId'],
        name: 'paymentId_idx'
    }, {
        fields: ['conversationId'],
        name: 'conversationId_idx',
        unique: false
    }]
})
class Payment extends BaseModel<Payment> {
    @Column({
        allowNull: true
    })
    userid: number;

    @Column({
        allowNull: false,
    })
    provider: string;

    @Column({
        allowNull: true,
    })
    paymentId: string;

    @Column({
        allowNull: true,
    })
    conversationId: string;

    @Column({
        allowNull: true,
    })
    ip: string;

    @Column({
        defaultValue: 'unused'        
    })
    status: string;    

    @Column({
        allowNull: false,
        type: DataType.DECIMAL(13, 2)
    })
    price: number;     

    @Column({
        allowNull: true,
        type: DataType.TEXT
    })
    request: string;    

    @Column({
        allowNull: true,
        type: DataType.TEXT
    })
    response: string;   
    
 

}

export default Payment;