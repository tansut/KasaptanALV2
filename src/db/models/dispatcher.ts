import { Table, Column, DataType, Model, HasMany, CreatedAt, UpdatedAt, DeletedAt, Unique, Default, AllowNull, ForeignKey, BelongsTo } from 'sequelize-typescript';
import BaseModel from "./basemodel"
import Helper from '../../lib/helper';
import Area from './area';
import Butcher from './butcher';
import ButcherProduct from './butcherproduct';
import { OrderItem, Order } from './order';
import { PreferredAddress } from './user';
import { LogisticFactory, LogisticProvider } from '../../lib/logistic/core';
import { ProductType } from './product';
import ButcherArea from './butcherarea';

export enum DispatcherSelection {    
    full = 'tam',
    listOnly = 'sadece liste',
    onecikar = 'one cikar'
}


export let DispatcherSelectionWeigts: {[key: string]: number} = {
    'tam': 0,
    'sadece liste': -1,
    'one cikar': 1
}

export type DispatcherType = "default"| "butcher" | "butcher/auto" | "banabikurye" | "banabikurye/car"



export let DispatcherTypeDesc = {
    "butcher": "Kasap",
    "butcher/auto": "Kasap",
    "banabikurye": "Hızlı Kurye Sistemi",
    "banabikurye/car": "Araç Kurye Sistemi"
}

export type ExternalLogisticProviderUsage = "none" | "default" | "select" | "force" | "auto" | "disabled"

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
        allowNull: true,
        type: DataType.TEXT
    })
    longdesc: string;     

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

    _minCalculated: number;

    get minCalculated(): number {
        if (!this._minCalculated) {
            return this.min;
        } else return this._minCalculated
    }

    set minCalculated(val: number) {
        this._minCalculated = val;
    }

    @Column({
        allowNull: false,
        defaultValue: 'butcher'
    })
    type: DispatcherType;


    @Column({
        allowNull: false,
        defaultValue: "default"
    })
    logisticProviderUsage: ExternalLogisticProviderUsage;



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

    @Column({
        allowNull: true
    })
    userNote: string;

    @Column
    areaTag: string;

    provider: LogisticProvider;

    setProvider(useLevel1: boolean, l3: Area, productType: ProductType | string, distance2Butcher: number) {
        let dispath = this;
        let butcherAvail = dispath.toarealevel == 0 || (dispath.toarealevel > 1) || useLevel1;
        if (!useLevel1 && dispath.toarealevel == 1) {
            let forceL1 = dispath.butcher.dispatchArea == "citywide" || dispath.butcher.dispatchArea == "radius";
            if (dispath.butcher.dispatchArea == "radius") {
                let distance = distance2Butcher || Helper.distance(dispath.butcher.location, l3.location);
                butcherAvail = dispath.butcher.radiusAsKm >= distance;
            } else butcherAvail = forceL1;
            if (butcherAvail && dispath.areaTag) {
                butcherAvail = dispath.areaTag == l3.dispatchTag;
            }
        }


        if (butcherAvail) {
            let providerKey = "butcher";
             if (Helper.isSingleShopcardProduct(productType)) {

             } else {
                if (dispath.type == "default") {
                    providerKey = dispath.type = dispath.butcher.defaultDispatcher
                } else {
                    providerKey = dispath.type;
                }
            }
            this.provider = LogisticFactory.getInstance(providerKey, {
                dispatcher: dispath,
                initialDistance: distance2Butcher
            })
        } 
        return this.provider;
    }

    // get userNote() {
    //     this.provider
    //     let desc = "";

    //     if (this.takeOnly) {
    //         desc = "*Semtinize sadece gel-al hizmeti verebiliyoruz*"         
    //     } else {
    //         if (this.min > 0)
    //             desc = `Sipariş toplamı ${Helper.formattedCurrency(this.min)} ve üzeriyse adresinize gönderebiliriz`
    //         else desc = 'Adresinize gönderebiliriz'
    //     }

    //     return desc;
    // }

    feeOffer: number;    

    butcherArea: ButcherArea;

    get priceInfo() {
        if (this.type == "banabikurye") {
            let time = '60-90 dk';
            if (this.butcherArea.bestKm <= 15.0) {
                 time = '45-60 dk';
            } else if (this.butcherArea.bestKm > 25.0 && this.butcherArea.bestKm <= 35.00) {
                time = '75-120 dk'
            } else if (this.butcherArea.bestKm > 35 && this.butcherArea.bestKm <= 45.00) {
                time = '90-150 dk'
            } else if (this.butcherArea.bestKm > 45.0) {
                time = '120-180 dk'
            }
            return `${time} kurye ile teslimat` 
        } else if (this.type == "banabikurye/car") {
            
            return `1-3 saat araç kurye ile teslimat` 
        } 
        else if (!this.toareaid) {
            return "2-3 gün kargo ile teslimat";
        } else {
            return "1-3 saat soğuk zincir teslimat";
        }

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