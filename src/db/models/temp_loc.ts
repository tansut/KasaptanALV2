import { Table, Column, DataType, Model, HasMany, CreatedAt, UpdatedAt, DeletedAt, Unique, Default, AllowNull, ForeignKey, BelongsTo } from 'sequelize-typescript';
import BaseModel from "./basemodel"
import Helper from '../../lib/helper';
import ProductCategory from './productcategory';
import ButcherProduct from './butcherproduct';

@Table({
    tableName: "temp_loc"
})

class TempLoc extends BaseModel<TempLoc> {
    @Column({
        allowNull: false,
    })
    il: string;

    @Column({
        allowNull: false,
    })
    ilce: string;

    @Column({
        allowNull: false,
    })
    semt: string;

    @Column({
        allowNull: false,
    })
    mahalle: string;

    @Column({
        allowNull: false,
    })
    pk: string;
}

export default TempLoc;