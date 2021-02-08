import * as _ from 'lodash';
import * as moment from 'moment';
import * as stream from 'stream';
import * as validator from 'validator';
import * as crypto from 'crypto';
import { Table, Column, Model, BelongsTo } from 'sequelize-typescript';
import BaseModel from "./basemodel"
import { where } from 'sequelize/types';
import User from './user';
import Helper from '../../lib/helper';


@Table({
    tableName: "RefreshTokens",
    indexes: [{
        name: "refreshtoken_key_idx",
        fields: ["token"],
        unique: true
    }
    ]
})
export default class RefreshToken extends BaseModel<RefreshToken> {
    @Column
    token: string;

    @Column
    tag: Buffer;

    @Column
    userId: number;

    @BelongsTo(() => User, "userId")
    user: User;
    
    isValid() {
        const copy = new Date(this.updatedOn)
        copy.setDate(this.updatedOn.getDate() + 14)
        return (moment(copy).utc().isSameOrAfter(moment(Helper.Now()).utc()));
    }

    static async  consume(token: string): Promise<RefreshToken> {
        let result = await RefreshToken.findOne({
            where: {
                token: token
            },
            include: [
                {all: true}
            ]
        })

        if (result) await RefreshToken.destroy({
            where: {
                token: token
            }
        })

        return (result && result.isValid()) ? result: null;
    }
}
