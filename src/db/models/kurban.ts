import { Table, Column, DataType, Model, HasMany, CreatedAt, UpdatedAt, DeletedAt, Unique, Default, AllowNull, ForeignKey, BelongsTo } from 'sequelize-typescript';
import BaseModel from "./basemodel"
import Butcher from './butcher';

export type KurbanType = 'buyukbas' | 'kucukbas';
export type KurbanTeslimType = 'ship' | 'take';

@Table({
    tableName: "Kurbans",
    indexes: [{
        name: "butcher_idx",
        fields: ["butcherid"]
    }]
})
class Kurban extends BaseModel<Kurban> {

    @ForeignKey(() => Butcher)
    butcherid: number;

    @BelongsTo(() => Butcher, "butcherid")
    butcher: Butcher;

    @Column({
        allowNull: false,
        defaultValue: 0,
        type: DataType.INTEGER
    })
    availableHisse: number;   

    @Column({
        allowNull: false,
        defaultValue: 0,
        type: DataType.INTEGER
    })
    totalHisse: number;   

    @Column({
        allowNull: false,
        defaultValue: 0,
        type: DataType.INTEGER
    })
    kg: number;   

    @Column({
        allowNull: false,
        defaultValue: 'buyukbas'
    })
    kurbanType: KurbanType;   

    @Column({
        allowNull: false,
        defaultValue: 'ship'
    })
    teslimType: KurbanTeslimType;  

    @Column({
        allowNull: false,
        defaultValue: 2,
        type: DataType.INTEGER
    })
    teslimGun: number;   
    
    @Column({
        allowNull: false,
        type: DataType.DECIMAL(13, 2)
    })
    kgPrice: number;

    @Column({
        allowNull: false
    })
    cinsi: string;      
    
    @Column({
        allowNull: true
    })
    desc: string;  
}
export default Kurban;