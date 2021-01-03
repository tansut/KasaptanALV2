import { Table, Column, DataType, Model, HasMany, CreatedAt, UpdatedAt, DeletedAt, Unique, Default, AllowNull, ForeignKey, BelongsTo } from 'sequelize-typescript';
import BaseModel from "./basemodel"
import Helper from '../../lib/helper';
import { Json } from 'sequelize/types/lib/utils';
import { NutritionValueTitles, NutritionView } from '../../models/common';
import NutritionValue from './nutritionvalue';


@Table({
    tableName: "NutritionValueItems",
    indexes: []
})
class NutritionValueItem extends BaseModel<NutritionValueItem> {

    @ForeignKey(() => NutritionValue)
    nutritionid: number

    @BelongsTo(() => NutritionValue, "nutritionid")
    nutritionValue: NutritionValue;


    @Column({
        allowNull: false
    })
    type: string;

    @Column({
        allowNull: false
    })
    unit: string;

    @Column({
        allowNull: false,
        type: DataType.DECIMAL(7,2)
    })
    amount: number;
}

export default NutritionValueItem;