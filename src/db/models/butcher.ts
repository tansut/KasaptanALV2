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



@Table({
    tableName: "Butchers",
    indexes: [
        { type: 'FULLTEXT', name: 'butcher_fts', fields: ['name', 'slug', 'keywords'] }]
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

    get userRatingAsPerc() {
        return Math.round((this.userRating * 2) * 10);
    }

    get shipRatingAsPerc() {
        let succ = this.shipTotalCount - this.shipFailureCount;
        return this.shipTotalCount > 0 ? Math.round((succ / this.shipTotalCount) * 100): 0;
    }

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
        return JSON.parse((<Buffer>this.getDataValue('gpplacejson')).toString())
    }

    set gpPlace(value: Object) {
        this.setDataValue('gpplacejson', Buffer.from(JSON.stringify(value), "utf-8"));
    }

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

    @Column({
        allowNull: true,
        type: DataType.GEOMETRY('POINT')
    })
    location: object;


    @Column
    phone: string;

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

    @Column
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
        allowNull: true
    })
    badges: string;   

    getPuanData(): Puan {
        return this.enablePuan ? {
            name: 'Kasap Kart Puanı',
            minSales: this.minSalesPuan,
            rate: this.customerPuanRate,
            minPuanForUsage: this.minPuanUsage
        }: null        
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

        if (this.enableCreditCard) {
            list.push({
                icon: 'czi-card',
                name: 'online/kapıda ödeme',
                tip: 'Online veya kapıda ödeme yapabilirsiniz'
            })
        } 
     
        return list;
    }

    @Column({
        allowNull: true
    })
    iyzicoSubMerchantKey: string;   

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
        type: DataType.DECIMAL(13, 2),
        defaultValue: 0.00
    })
    payCommissionFee: number;      


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
        return this.location ? (<any>this.location).coordinates[0]: 0
    }

    get lng(): number {
        return this.location ? (<any>this.location).coordinates[1]: 0
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

}

export default Butcher;