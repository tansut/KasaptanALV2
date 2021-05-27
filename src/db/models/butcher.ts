import { Table, Column, DataType, Model, HasMany, CreatedAt, UpdatedAt, DeletedAt, Unique, Default, AllowNull, ForeignKey, BelongsTo } from 'sequelize-typescript';
import BaseModel from "./basemodel"
import Area, { AreaLevels } from './area';
import ButcherProduct from './butcherproduct';
import Product from './product';
import { Op } from 'sequelize';
import { Badge } from '../../models/badge';
import { Puan } from '../../models/puan';
import AccountModel from './accountmodel';
import { Account } from '../../models/account';
import Helper from '../../lib/helper';
import { ExternalLogisticProviderUsage, DispatcherType } from './dispatcher';
import { GeoLocation } from '../../models/geo';
import { ShipmentInfo } from '../../models/shipment';
import Resource from './resource';
import { AgreementAcceptStatus } from '../../models/common';

export type DispatchArea = "manual" | "citywide" | "radius";

export type ButcherStatus = "open" | "closed";

export type PriceDisplay = 'show' | 'hide';

export type ManualPaymentsAsDebt = 'add' | 'none';

@Table({
    tableName: "Butchers",
    indexes: [
        { type: 'FULLTEXT', name: 'butcher_fts', fields: ['name', 'slug', 'keywords'] },
        {
            name: "displayOrder_idx",
            fields: ["displayOrder"]
        }, {
            name: 'parentButcher_idx',
            fields: ['parentButcher']
        },
        {
            name: 'butcherstatus_idx',
            fields: ['status']
        },
        {
            name: 'approved_idx',
            fields: ['approved']
        }
    ]
})
class Butcher extends BaseModel<Butcher> {

    @AllowNull(false)
    @Column
    name: string;

    @AllowNull(false)
    @Column
    legalName: string;

    @Unique({ name: "slug_idx", msg: "" })
    @AllowNull(false)
    @Column
    slug: string;

    
    @Column({
        allowNull: false,
        defaultValue: 'add'
    })
    manualPaymentsAsDebt: ManualPaymentsAsDebt;

    get userRatingAsPerc() {
        return Math.round((this.userRating * 2) * 10);
    }

    get shipRatingAsPerc() {
        let succ = this.shipTotalCount - this.shipFailureCount;
        return this.shipTotalCount > 0 ? Math.round((succ / this.shipTotalCount) * 100) : 0;
    }

    get totalRatingAsPerc() {
        return Math.round((this.userRatingAsPerc + this.shipRatingAsPerc) / 2)
    }    

    get weightRatingAsPerc() {
        if (this.shipSuccessCount < 3)
            return 100;
        return this.totalRatingAsPerc;
    } 

    get shipSuccessCount() {
        return this.shipTotalCount - this.shipFailureCount;
    }

    get shipSuccessText() {
        return this.shipSuccessCount >= 10 ? Helper.number2Text(this.shipSuccessCount, 50):''
    }


    calculatedRate: number;

    @Column({
        allowNull: true
    })
    priceBasedButcher: number;


    @Column({
        allowNull: false,
        defaultValue: "manual",
    })
    dispatchArea: DispatchArea;

    @Column({
        allowNull: false,
        defaultValue: "show",
    })
    priceDisplay: PriceDisplay;

    @Column({
        allowNull: true        
    })
    defaultCategoryId: number;    

    @Column({
        allowNull: false,
        defaultValue: "open",
    })
    status: ButcherStatus;

    @AllowNull(true)
    @Column
    locationText: string;

    @AllowNull(true)
    @Column
    btnText: string;

    @AllowNull(true)
    @Column
    btnUrl: string;

    
    @Column({
        allowNull: false,
        defaultValue: 'waiting'
    })
    agreementStatus: AgreementAcceptStatus;

    @Column({
        allowNull: false,
        defaultValue: 50,
        type: DataType.INTEGER
    })
    radiusAsKm: number;

    @Column({
        allowNull: false,
        defaultValue: 0,
        type: DataType.INTEGER
    })
    radiusAsKmMax: number;    

    @Column({
        allowNull: false,
        defaultValue: 0,
        type: DataType.INTEGER
    })
    selectionRadiusAsKm: number;

    @Column({
        allowNull: false,
        defaultValue: 0,
        type: DataType.DECIMAL(5, 2)
    })
    userRating: number;

    @Column({
        allowNull: false,
        type: DataType.INTEGER,
        defaultValue: 0
    })
    userRatingCount: number;

    @Column({
        allowNull: false,
        type: DataType.INTEGER,
        defaultValue: 0
    })
    shipFailureCount: number;



    @Column({
        allowNull: false,
        type: DataType.INTEGER,
        defaultValue: 0
    })
    shipTotalCount: number;

    @AllowNull(false)
    @Default(false)
    @Column
    approved: boolean;

    @Unique({ name: "gpid_idx", msg: "" })
    @Column
    gpid: string;

    @Column
    gplastdate: Date

    @Column
    gpplacejson: Buffer

    get gpPlace(): Object {
        return this.getDataValue('gpplacejson') ? JSON.parse((<Buffer>this.getDataValue('gpplacejson')).toString()): null
    }

    set gpPlace(value: Object) {
        this.setDataValue('gpplacejson', Buffer.from(JSON.stringify(value), "utf-8"));
    }

    @AllowNull(false)
    @Default(true)
    @Column
    showListing: boolean;    

    @AllowNull(false)
    @Default(true)
    @Column
    shipday0: boolean;    

    @AllowNull(false)
    @Default(true)
    @Column
    shipday1: boolean;   
    
    @AllowNull(false)
    @Default(true)
    @Column
    shipday2: boolean;    
    
    @AllowNull(false)
    @Default(true)
    @Column
    shipday3: boolean;    

    @AllowNull(false)
    @Default(true)
    @Column
    shipday4: boolean;    

    @AllowNull(false)
    @Default(true)
    @Column
    shipday5: boolean;    

    @AllowNull(false)
    @Default(true)
    @Column
    shipday6: boolean;    


    // @Column
    // shipmentjson: Buffer;

    // get shipmentInfo(): ShipmentInfo {
    //     if (!this.shipmentjson)
    //         return {
    //             excludeDays: []
    //         }
    //     return JSON.parse((<Buffer>this.getDataValue('shipmentjson')).toString())
    // }

    // set shipmentInfo(value: ShipmentInfo) {
    //     this.setDataValue('shipmentjson', Buffer.from(JSON.stringify(value), "utf-8"));    
    // }
    

    @ForeignKey(() => Area)
    @Column
    areaLevel1Id: number;

    @BelongsTo(() => Area, "areaLevel1Id")
    areaLevel1: Area;

    @ForeignKey(() => Area)
    @Column
    areaLevel2Id: number;

    @BelongsTo(() => Area, "areaLevel2Id")
    areaLevel2: Area;

    @ForeignKey(() => Area)
    @Column
    areaLevel3Id: number;

    @BelongsTo(() => Area, "areaLevel3Id")
    areaLevel3: Area;

    @Column
    address: string;

    @Column
    areaLevel1Text: string;

    @Column({
        allowNull: true,
        type: DataType.GEOMETRY('POINT')
    })
    location: GeoLocation;

    @Column({
        type: DataType.TEXT
    })
    logisticjson: string

    get logisticSetings(): any {
        return this.logisticjson ? JSON.parse(this.getDataValue('logisticjson')) : null
    }

    set logisticSetings(value: any) {
        this.setDataValue('logisticjson', JSON.stringify(value));
    }


    @Column({
        allowNull: false,
        defaultValue: "none"
    })
    logisticProviderUsage: ExternalLogisticProviderUsage;


    @Column({
        allowNull: false,
        defaultValue: "butcher"
    })
    defaultDispatcher: DispatcherType;


    @Column
    logisticProvider: string;

    @Column
    phone: string;

    @Column
    badge: string;    

    @Column
    website: string;

    @Column({ type: DataType.FLOAT, defaultValue: 0, allowNull: false })
    rating: number;

    @Default(0)
    @AllowNull(false)
    @Column
    ratingCount: number;

    thumbnail: string;

    @Column
    postal: string;

    @Column
    pageTitle: string;

    @Column
    keywords: string;

    @Column({
        type: DataType.TEXT
    }
        
    )
    pageDescription: string;


    @Column
    instagram: string;

    @Column
    facebook: string;

    @Column({
        allowNull: true,
        type: DataType.TEXT
    })
    description: string;

    @Column({
        allowNull: true,
        type: DataType.TEXT
    })
    mddesc: string;


    @Column({
        allowNull: true
    })
    iban: string;

    @Column({
        allowNull: true
    })
    companyType: string;

    @Column({
        allowNull: true
    })
    taxOffice: string;

    @Column({
        allowNull: true
    })
    taxNumber: string;

    @Column({
        allowNull: true
    })
    email: string;

    @Column({
        allowNull: false,
        defaultValue: false
    })
    enableCreditCard: boolean;

    @Column({
        allowNull: false,
        defaultValue: true
    })
    enableOnDoor: boolean;    

    @Column({
        allowNull: true
    })
    badges: string;

    getPuanData(orderType: string): Puan {
        return this.enablePuan ? {
            platforms: 'app,web',
            name: 'Kasap Kart Puanı',
            minSales: this.minSalesPuan,
            rate: orderType == 'kurban' ? this.kurbanPuanRate : this.customerPuanRate,
            minPuanForUsage: this.minPuanUsage
        } : null
    }



    getBadgeList(): Badge[] {
        let list: Badge[] = []



        if (this.enablePuan) {
            list.push({
                icon: '',
                name: 'Kasap Kart™',
                tip: 'Alışverişlerinizden puan kazandırır'
            })
        }

        // if (this.enableCreditCard) {
        //     list.push({
        //         icon: 'czi-card',
        //         name: 'Online/Kapıda Ödeme',
        //         tip: 'Online veya kapıda ödeme yapabilirsiniz'
        //     })
        // } 

        return list;
    }

    @Column({
        allowNull: true
    })
    iyzicoSubMerchantKey: string;

    @Column({
        allowNull: false,
        defaultValue: 0
    })
    displayOrder: number;


    @Column({
        allowNull: true
    })
    parentButcher: string;

    @Column({
        allowNull: true
    })
    notifyMobilePhones: string;

    @Column({
        allowNull: false,
        type: DataType.DECIMAL(10, 4),
        defaultValue: 0.02
    })
    payCommissionRate: number;

    @Column({
        allowNull: false,
        type: DataType.DECIMAL(10, 2),
        defaultValue: 0.18
    })
    vatRate: number;


    @Column({
        allowNull: false,
        type: DataType.DECIMAL(13, 2),
        defaultValue: 0.00
    })
    payCommissionFee: number;

    @Column({
        allowNull: false,
        type: DataType.DECIMAL(10, 4),
        defaultValue: 0.04
    })
    kurbanCommissionRate: number;

    @Column({
        allowNull: false,
        type: DataType.DECIMAL(13, 2),
        defaultValue: 0.00
    })
    kurbanCommissionFee: number;

    @Column({
        allowNull: false,
        type: DataType.DECIMAL(10, 4),
        defaultValue: 0.15
    })
    noshipCommissionRate: number;

    @Column({
        allowNull: false,
        type: DataType.DECIMAL(13, 2),
        defaultValue: 0.00
    })
    noshipCommissionFee: number;


    @Column({
        allowNull: false,
        type: DataType.DECIMAL(10, 4),
        defaultValue: 0.1
    })
    commissionRate: number;

    @Column({
        allowNull: false,
        type: DataType.DECIMAL(13, 2),
        defaultValue: 0.00
    })
    commissionFee: number;

    @Column({
        allowNull: false,
        type: DataType.DECIMAL(13, 2),
        defaultValue: 0.00
    })
    minSalesPuan: number;

    @Column({
        allowNull: false,
        type: DataType.DECIMAL(5, 2),
        defaultValue: 0.01
    })
    customerPuanRate: number;

    @Column({
        allowNull: false,
        type: DataType.DECIMAL(5, 2),
        defaultValue: 0.02
    })
    kurbanPuanRate: number;

    @Column({
        allowNull: false,
        type: DataType.DECIMAL(13, 2),
        defaultValue: 50.00
    })
    minPuanUsage: number;

    @Column({
        allowNull: false,
        defaultValue: false
    })
    enablePuan: boolean;



    @Column
    videoinstagram: Buffer;

    @HasMany(() => ButcherProduct, {
        sourceKey: "id",
        foreignKey: "butcherid",
        //as: "ButcherProduct"
    })
    products: ButcherProduct[];


    get videoInstagramStr(): string {
        return this.getDataValue('videoinstagram') ? (<Buffer>this.getDataValue('videoinstagram')).toString() : ""
    }

    set videoInstagramStr(value: string) {
        this.setDataValue('videoinstagram', Buffer.from(value));
    }

    get lat(): number {
        return this.location ? (<any>this.location).coordinates[0] : 0
    }

    get lng(): number {
        return this.location ? (<any>this.location).coordinates[1] : 0
    }

     async copyPricesFromMainButcher() {
            await ButcherProduct.destroy({
                where: {
                    butcherid: this.id
                }
            })        
            let mainPrices = await ButcherProduct.findAll({
                where: {
                    butcherid: this.priceBasedButcher
                },
                raw: true
            })

            for(var i = 0; i < mainPrices.length;i++) {
                let newItem = new ButcherProduct(mainPrices[i]);
                newItem.id = null;
                newItem.butcherid = this.id;
                await newItem.save();
            }

    }

    static async loadButcherWithProducts(slug: string | number, includeDisabled: boolean = false) {
        let where = {};
        let id = typeof(slug) == 'string' ? parseInt(slug): slug;
        if (Number.isNaN(id)) {
            where['slug'] = slug;
        } else 
            where["id"] = id

        let butcher = await Butcher.findOne({
            include: [{
                model: ButcherProduct,
                include: [Product],
                // where: {
                //     [Op.or]: [{
                //         '$products.kgPrice$': {
                //             [Op.gt]: 0.0
                //         }
                //     },

                //     {
                //         '$products.unit1price$': {
                //             [Op.gt]: 0.0
                //         }
                //     },

                //     {
                //         '$products.unit2price$': {
                //             [Op.gt]: 0.0
                //         }
                //     },
                //     {
                //         '$products.unit3price$': {
                //             [Op.gt]: 0.0
                //         }
                //     }
                //     ]                    
                // }
            },
            {
                model: Area,
                all: true,
                as: "areaLevel1Id"

            }], where: where
        });
        if (butcher) {
            butcher.products = butcher.products.filter(p => {
                return (p.product.status == "onsale") && (includeDisabled ? true: p.enabled) && (p.kgPrice > 0 || (p.unit1price > 0 && p.unit1enabled) || (p.unit2price > 0 && p.unit2enabled) || (p.unit3price > 0 && p.unit1enabled))
            })
        }
        return butcher;
    }


    getProducts(): Product[] {
        let result = [];
        for (let i = 0; i < this.products.length; i++) {
            result.push(this.products[i].product)
        }
        return result;
    }

    static async sellingButchers(productid: number, areas?: AreaLevels) {
        let where = {
            productid: productid,
            [Op.or]: [
                {
                    kgPrice: {
                        [Op.gt]: 0.0
                    }
                },
                {
                    unit1price: {
                        [Op.gt]: 0.0
                    }
                },
                {
                    unit2price: {
                        [Op.gt]: 0.0
                    }
                },
                {
                    unit3price: {
                        [Op.gt]: 0.0
                    }
                }

            ],
            enabled: true
        }
        if (areas) {
            areas.level1Id ? where['$butcher.areaLevel1Id$'] = areas.level1Id : null;
            areas.level2Id ? where['$butcher.areaLevel2Id$'] = areas.level2Id : null;;
            areas.level3Id ? where['$butcher.areaLevel3Id$'] = areas.level3Id : null;
        }
        return await ButcherProduct.findAll({
            where: where,
            include: [Butcher]
        })
    }

    static async getByArea(id, level) {
        let col = `areaLevel${level}Id`;
        let where = {};
        where[col] = id;
        return await Butcher.findAll(
            {
                include: [{
                    all: true
                }],
                where: where
            }
        )
    }

    static async getBySlug(slug: string) {
        return await Butcher.findOne(
            {
                include: [{
                    all: true
                }],
                where: {
                    slug: slug
                }
            }
        )
    }

    resources: Resource[];

    async loadResources() {
        this.resources = await Resource.findAll({
            where: {
                type: ["butcher-google-photos", "butcher-videos"],
                ref1: this.id
         
            },
            order: [["displayOrder", "DESC"], ["updatedOn", "DESC"]]
        })

        return this.resources;
    }

}

export default Butcher;