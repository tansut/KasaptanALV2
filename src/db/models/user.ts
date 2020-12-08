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


export enum UserRole {

}

export interface PreferredAddress {
    level1Id?: number;
    level2Id?: number;
    level3Id?: number;

    level1Text?: string;
    level2Text?: string;
    level3Text?: string;

    level1Slug?: string;
    level2Slug?: string;
    level3Slug?: string;    

    level1Status?: string;
    level2Status?: string;
    level3Status?: string;

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

    static retrieveByEMailOrPhone(email: string) {
        email = email || "";
        let where = validator.isEmail(email) ? {
            email: email.toLowerCase()
        } : {
                mphone: Helper.getPhoneNumber(email)
            }
        var q = User.findOne({ where: where }).then(u=> {
             
                return u.loadPuanView()
            
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



    generateAccessToken(): authorization.IAccessTokenData {
        var tokenData = <authorization.IAccessTokenData>{
            userId: this["id"],
            expiration_time: moment().add('minute', 30).toDate(),
            props: []
        };
        return tokenData;
    }
};