import { Table, Column, DataType, Model, HasMany, CreatedAt, UpdatedAt, DeletedAt, Unique, Default, AllowNull, ForeignKey, BelongsTo } from 'sequelize-typescript';
import BaseModel from "./basemodel"
import Helper from '../../lib/helper';
import Area from './area';
import Butcher from './butcher';
import ButcherProduct from './butcherproduct';
import { OrderItem, Order } from './order';
import { PreferredAddress } from './user';

@Table({
    tableName: "Dispatchers",
    indexes: [{
        name: 'fromareaid_idx',
        fields: ['fromareaid']
    }, {
        name: 'frombutcherid_idx',
        fields:['frombutcherid']
    }, {
        name: 'toareaid_idx',
        fields: ['toareaid']
    }, {
        name: 'type_idx',
        fields: ['type', 'typeid']
    }]
})
class Dispatcher extends BaseModel<Dispatcher> {

    @ForeignKey(() => Area)
    fromareaid: number;

    @Column({
        allowNull: true,
    })
    fromarealevel: number;    

    @BelongsTo(() => Area, "fromareaid")
    fromarea: Area;
   
    @ForeignKey(() => Butcher)
    frombutcherid: number

    @BelongsTo(() => Butcher, "frombutcherid")
    frombutcher: Butcher;    

    @ForeignKey(() => Area)
    toareaid: number;

    @Column({
        allowNull: true,
    })
    toarealevel: number;    

    @BelongsTo(() => Area, "toareaid")
    toarea: Area;

    @Column({
        allowNull: false,
        defaultValue: 0,
        type: DataType.DECIMAL(5, 2)
    })
    fee: number;    

    @Column({
        allowNull: false,
        defaultValue: 0,
        type: DataType.DECIMAL(5, 2)
    })
    totalForFree: number;     

    @Column({
        allowNull: false,
        defaultValue: 'butcher'
    })
    type: string;

    @Column({
        allowNull: false,
    })
    name: string;        @ForeignKey(() => Butcher)
    butcherid: number

    @BelongsTo(() => Butcher, "butcherid") 
    butcher: Butcher;    

    @ForeignKey(() => OrderItem)
    lastorderitemid: number

    @BelongsTo(() => OrderItem, "lastorderitemid") 
    lastOrderItem: OrderItem;    

    @Column({
        allowNull: false,
    })
    typeid: number;    

    address: PreferredAddress;

}

export default Dispatcher;