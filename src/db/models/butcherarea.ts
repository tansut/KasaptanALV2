import { Table, Column, DataType, Model, HasMany, CreatedAt, UpdatedAt, DeletedAt, Unique, Default, AllowNull, ForeignKey, BelongsTo } from 'sequelize-typescript';
import BaseModel from "./basemodel"
import Helper from '../../lib/helper';
import { PreferredAddress } from './user';
import { GeoLocation } from '../../models/geo';
import { Google } from '../../lib/google';
import { add } from 'lodash';
import email from '../../lib/email';
import Butcher from './butcher';
import Area from './area';



@Table({
    tableName: "ButcherAreas",
    indexes: [
    {
        name: "butcher_area_idx",
        fields: ["butcherid", "areaid"],
        unique: true
    }]
})

class ButcherArea extends BaseModel<ButcherArea> {
    @ForeignKey(() => Butcher)
    butcherid: number

    @BelongsTo(() => Butcher, "butcherid")
    butcher: Butcher;

    @ForeignKey(() => Area)
    areaid: number

    @BelongsTo(() => Area, "areaid")
    area: Area;

    @Column({
        allowNull: true
    })
    name: string;

    @Column({
        type: DataType.DECIMAL(5, 1)
    })
    kmDirect: number;

    @Column({
        type: DataType.DECIMAL(5, 1)
    })
    kmGoogle: number;

    @Column({
        type: DataType.DECIMAL(5, 1)
    })
    kmActive: number;    

    get bestKm() {
        return this.kmActive || this.kmGoogle || this.kmDirect * 1.5
    }


    @Column({
        allowNull: true,
        type: DataType.TEXT
    })
    googleData: string;        
}

export default ButcherArea;