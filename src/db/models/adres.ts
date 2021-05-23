import { Table, Column, DataType, Model, HasMany, CreatedAt, UpdatedAt, DeletedAt, Unique, Default, AllowNull, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { GeoLocation, LocationType } from '../../models/geo';
import Area from './area';
import BaseModel from "./basemodel"
import Butcher from './butcher';
import User from './user';


@Table({
    tableName: "ShipAddresses",
    indexes: [{
        name: "user_idx",
        fields: ["userid"]
    }]
})
class ShipAddress extends BaseModel<ShipAddress> {

    @Column
    name: string;  

    @ForeignKey(() => User)
    userid: number;

    @BelongsTo(() => User, "userid")
    user: User;

    @Column
    address: string    

    @Column
    bina: string    

    @Column
    kat: string;

    @Column
    tarif: string;    

    @Column
    daire: string;
    
    @Column({
        allowNull: true,
        type: DataType.GEOMETRY('POINT')
    })
    lastLocation: GeoLocation;

    @Column
    lastLocationType: LocationType;

    @ForeignKey(() => Area)
    level1Id: number;  

    @BelongsTo(() => Area, "level1Id")
    level1: number;  
    
    @ForeignKey(() => Area)
    level2Id: number;  

    @BelongsTo(() => Area, "level2Id")
    level2: number;
    
    @ForeignKey(() => Area)
    level3Id: number;  

    @BelongsTo(() => Area, "level3Id")
    level3: number;  

    @ForeignKey(() => Area)
    level4Id: number;  

    @BelongsTo(() => Area, "level4Id")
    level4: number;  
}

export default ShipAddress;