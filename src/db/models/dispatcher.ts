import { Table, Column, DataType, Model, HasMany, CreatedAt, UpdatedAt, DeletedAt, Unique, Default, AllowNull, ForeignKey, BelongsTo } from 'sequelize-typescript';
import BaseModel from "./basemodel"
import Helper from '../../lib/helper';
import Area from './area';
import Butcher from './butcher';
import ButcherProduct from './butcherproduct';
import { OrderItem, Order } from './order';
import { PreferredAddress } from './user';

export enum DispatcherSelection {    
    full = 'tam',
    listOnly = 'sadece liste'
}


export type DispatcherType = "butcher" | "kasaptanal/motokurye" | "kasaptanal/car"

export let DispatcherTypeDesc = {
    "butcher": "Kasap",
    "kasaptanal/motokurye": "Soğuk Zincir Kurye Sistemi",
    "kasaptanal/car": "Soğuk Zincir Araç Kurye Sistemi",
}

export type LogisticProviderUsage = "none" | "default" | "select" | "force" | "auto" | "disabled"

@Table({
    tableName: "Dispatchers",
    indexes: [{
        name: 'fromareaid_idx',
        fields: ['fromareaid']
    }, {
        name: 'frombutcherid_idx',
        fields: ['frombutcherid']
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
        type: DataType.DECIMAL(13, 2)
    })
    fee: number;

    @Column({
        allowNull: false,
        defaultValue: 0,
        type: DataType.DECIMAL(13, 2)
    })
    totalForFree: number;

    @Column({
        allowNull: false,
        defaultValue: 0,
        type: DataType.DECIMAL(13, 2)
    })
    min: number;

    @Column({
        allowNull: false,
        defaultValue: 'butcher'
    })
    type: DispatcherType;


    @Column({
        allowNull: false,
        defaultValue: "default"
    })
    logisticProviderUsage: LogisticProviderUsage;

    @Column({
        allowNull: false,
    })
    name: string;

    @ForeignKey(() => Butcher)
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

    @Column({
        allowNull: true,
    })
    note: string;

    @Column({
        allowNull: false,
        defaultValue: 'tam'
    })
    selection: string;    

    @Column({
        allowNull: false,
        defaultValue: true
    })
    enabled: boolean;

    @Column({
        allowNull: false,
        defaultValue: false
    })
    takeOnly: boolean;

    get userNote() {
        let desc = "";

        if (this.takeOnly) {
            desc = "*Semtinize sadece gel-al hizmeti verebiliyoruz*"         
        } else {
            if (this.min > 0)
                desc = `Sipariş toplamı ${Helper.formattedCurrency(this.min)} ve üzeriyse adresinize gönderebiliriz`
            else desc = 'Adresinize gönderebiliriz'
        }

        return desc;
    }

    feeOffer: number;    

    get priceInfo() {


        let desc = "";

        if (this.takeOnly) {
            desc = "Gel-al sadece"
            return desc;
        }
        
        if (this.min > 0)
            desc = `En az sipariş tutarı ${Helper.formattedCurrency(this.min)}`

        if (this.fee <= 0) desc += ((desc ? ', ' : '') + 'Ücretsiz Gönderim');
        else if (this.fee > 0 && this.totalForFree <= 0)
            desc += ((desc ? ', ' : '') + `${Helper.formattedCurrency(this.fee)} gönderim ücreti`);
        else if (this.fee > 0)

            desc += ((desc ? ', ' : '') + `${Helper.formattedCurrency(this.totalForFree)} üzeri ücretsiz gönderim`);
        return desc
    }

}

export default Dispatcher;