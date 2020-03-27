import { Table, Column, DataType, Model, HasMany, CreatedAt, UpdatedAt, DeletedAt, Unique, Default, AllowNull, ForeignKey, BelongsTo } from 'sequelize-typescript';
import BaseModel from "./basemodel"
import Helper from '../../lib/helper';

@Table({
    tableName: "SiteLogs",
    indexes: []
})
class SiteLog extends BaseModel<SiteLog> {

    @Column({
        allowNull: false,
    })
    logtype: string;

    @Column({
        allowNull: true,
    })
    f1: string;

    @Column({
        allowNull: true,
    })
    f2: string;

    @Column({
        allowNull: true,
    })
    f3: string;

    @Column({
        allowNull: true,
    })
    email: string;

    @Column({
        allowNull: true,
    })
    firstname: string;

    @Column({
        allowNull: true,
    })
    surname: string;

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
    logData: string;    

}

export default SiteLog;