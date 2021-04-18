import { Table, Column, DataType, Model, HasMany, CreatedAt, UpdatedAt, DeletedAt, Unique, Default, AllowNull, ForeignKey, BelongsTo } from 'sequelize-typescript';
import BaseModel from "./basemodel"
import Helper from '../../lib/helper';
import { AgreementType } from '../../models/common';



@Table({
    tableName: "Agreements"
})
class AgreementLog extends BaseModel<AgreementLog> {


    @Column({
        allowNull: true
    })
    userid: number;

    @Column({
        allowNull: false,
    })
    type: AgreementType;

    @Column({
        allowNull: false,
    })
    title: string;

    @Column({
        allowNull: true,
    })
    name: string;

    @Column({
        allowNull: true,
    })
    sessionid: string;

    @Column({
        allowNull: true,
    })
    ip: string;

    @Column({
        allowNull: true,
        type: DataType.TEXT
    })
    content: string;    
}

export default AgreementLog;
