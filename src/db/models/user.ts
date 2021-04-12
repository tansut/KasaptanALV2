import { Table, Column, Model, HasMany, CreatedAt, UpdatedAt, DeletedAt, DataType } from 'sequelize-typescript';
import * as moment from 'moment';
import * as authorization from '../../lib/authorizationToken';
import BaseModel from "./basemodel"
import { AppUser } from '../../models/user';
import * as bcrypt from 'bcryptjs';
import Helper from '../../lib/helper';
import validator from 'validator';
import { GeoLocation, LocationType } from '../../models/geo';
import AccountModel from './accountmodel';
import { Account } from '../../models/account';
import Area from './area';


export enum UserRole {

}

export interface PreferredAddressQuery {
    level1Id?: number;
    level2Id?: number;
    level3Id?: number;
    level4Id?: number;
}

export interface PreferredAddress {

    level1?: Area;
    level2?: Area;
    level3?: Area;
    level4?: Area;

    based: Area;

    level1Id?: number;
    level2Id?: number;
    level3Id?: number;
    level4Id?: number;

    level1Text?: string;
    level2Text?: string;
    level3Text?: string;
    level4Text?: string;

    level1Slug?: string;
    level2Slug?: string;
    level3Slug?: string;    
    level4Slug?: string;    

    level1Status?: string;
    level2Status?: string;
    level3Status?: string;
    level4Status?: string;

    lat?:number;
    lng?:number;

    display?: string;
}

@Table({
    tableName: "Users",
    indexes: [
        {
            unique: true,
            fields: ['email']
        },
        {
            unique: true,
            fields: ['mphone']
        }
    ]
})
export default class User extends BaseModel<User> {
    @Column
    email: string;

    @Column
    name: string;

    @Column
    mphone: string;

    @Column
    password: string;

    @Column
    resetToken?: string;

    @Column
    roles: string

    @Column
    resetTokenValid?: Date;

    @Column
    ivCode: string;

    @Column
    lastLogin: Date

    @Column
    lastAddress: string    

    @Column
    lastBina: string    

    @Column
    lastKat: string;

    @Column
    lastTarif: string;    

    @Column
    lastDaire: string    

    @Column({
        allowNull: true,
        type: DataType.GEOMETRY('POINT')
    })
    lastLocation: GeoLocation;

    @Column
    lastLocationType: LocationType;

    puans: AccountModel;
    usablePuans = 0.00;
    
    async loadPuanView() {
        this.puans  = await AccountModel.summary([
            Account.generateCode("musteri-kalitte-kazanilan-puan", [this.id, 1]),
            Account.generateCode("musteri-kalitte-kazanilan-puan", [this.id, 2]), 
            Account.generateCode("musteri-kasap-kazanilan-puan", [this.id]),
            Account.generateCode("musteri-harcanan-puan", [this.id])
            ])
            this.usablePuans = Helper.asCurrency(this.puans.alacak - this.puans.borc);
            this.usablePuans = this.usablePuans < 0 ? Helper.asCurrency(0): this.usablePuans;
            return this;
    }

    @Column
    butcherid: number;

    @Column({
        allowNull: false,
        defaultValue: 'web'
    })
    platform: string;

    static retrieveByEMailOrPhone(email: string) {
        email = email || "";
        let where = validator.isEmail(email) ? {
            email: email.toLowerCase()
        } : {
                mphone: Helper.getPhoneNumber(email)
            }
        var q = User.findOne({ where: where }).then(u=> {
             
                return u ? u.loadPuanView(): u
            
        });
        return q;
    }

    hasRole(role: string) {
        let roles = this.getRoles();
        return roles.indexOf(role) >= 0;
    }

    setPassword(password: string) {
        var passwordSalt = bcrypt.genSaltSync(10);
        var hash = bcrypt.hashSync(password, passwordSalt);
        this.password = hash;
    }

    getRoles() {
        let roles = this.roles || ""
        return roles.split(",");
    }

    @Column({
        allowNull: false       ,
        defaultValue:"kasaptanal.com" 
    })
    source: string;     
    
    @Column({
        allowNull: false       ,
        defaultValue:0 
    })
    sourceId: number;         

    @Column({
        allowNull: true        
    })
    lastLevel1Id: number;  
    
    @Column({
        allowNull: true        
    })
    lastLevel2Id: number;     
    
    @Column({
        allowNull: true        
    })
    lastLevel3Id: number;       

    @Column({
        allowNull: true        
    })
    lastLevel4Id: number;          

    @Column({
        allowNull: false,
        defaultValue: false
    })
    mphoneverified: boolean;

    @Column({
        allowNull: false,
        defaultValue: false
    })
    emailverified: boolean;

    toClient() {
        return super.toClient(AppUser);
    }

    verifyPassword(password: string): boolean {
        return bcrypt.compareSync(password, this.password)
    }

    @Column
    shopcardjson: Buffer

    get shopcard(): any {
        return this.shopcardjson ? JSON.parse((<Buffer>this.getDataValue('shopcardjson')).toString()) : null
    }

    set shopcard(value: any) {
        this.setDataValue('shopcardjson', Buffer.from(JSON.stringify(value), "utf-8"));
    }

    @Column
    mobiledeviceUpdateDate: Date;

    @Column
    mobiledeviceFirstUpdateDate: Date;

    @Column
    mobiledevicedata: Buffer

    get mobiledevice(): any {
        return this.mobiledevicedata ? JSON.parse((<Buffer>this.getDataValue('mobiledevicedata')).toString()) : null
    }

    set mobiledevice(value: any) {
        this.setDataValue('mobiledevicedata', Buffer.from(JSON.stringify(value), "utf-8"));
    }

    @Column
    oneSignalUserId: string;

    @Column
    oneSignalPushToken: string;

    @Column
    mobilePlatform: string;

    @Column
    mobileAppVersion: string;    
    
    @Column
    mobileModel: string;    



    hasSavedLocation() {
        return (this.lastLevel1Id && this.lastLevel2Id && this.lastLevel3Id);
    }

    generateAccessToken(): authorization.IAccessTokenData {
        var tokenData = <authorization.IAccessTokenData>{
            userId: this["id"],
            expiration_time: moment().add('minute', 30).toDate(),
            props: []
        };
        return tokenData;
    }
};