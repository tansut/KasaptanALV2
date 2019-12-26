import * as _ from 'lodash';
import * as moment from 'moment';
import * as stream from 'stream';
import * as validator from 'validator';
import * as crypto from 'crypto';
import { Table, Column, Model } from 'sequelize-typescript';
import BaseModel from "./basemodel"


@Table({
    tableName: "RefreshTokens",
})
export default class RefreshToken extends BaseModel<RefreshToken> {
    @Column
    token: string;

    @Column
    tag: Buffer;

    @Column
    userId: number;
}