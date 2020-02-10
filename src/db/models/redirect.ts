import { Table, Column, DataType, Model, HasMany, CreatedAt, UpdatedAt, DeletedAt, Unique, Default, AllowNull, ForeignKey, BelongsTo } from 'sequelize-typescript';
import BaseModel from "./basemodel"
import Helper from '../../lib/helper';

@Table({
    tableName: "Redirects",
    indexes: []
})
class Redirect extends BaseModel<Redirect> {

    @Column({
        allowNull: false,
        unique: true
    })
    fromUrl: string;

    @Column({
        allowNull: false
    })
    toUrl: string;

    @Column({
        allowNull: false,
        defaultValue: true
    })
    enabled: boolean;

    @Column({
        allowNull: false,
        defaultValue: true
    })
    permanent: boolean;

    @Column({
        allowNull: true
    })
    desc: string;

}

export default Redirect;