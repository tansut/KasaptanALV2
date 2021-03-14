import * as http from './http';
import * as _ from 'lodash';
import * as moment from 'moment';
import * as crypto from 'crypto';
import RefreshToken from '../db/models/refreshToken';
import User from '../db/models/user';


interface encrypytionData {
    tag: Buffer,
    encryptedData: string
}

export interface IEncryptedAccessTokenData {
    tag: string;
    tokenData: string;
}

export interface IAccessTokenData {
    userId: number;
    expiration_time: Date;
    props: any[];
}

export interface IRefreshTokenData {
    access_token: IEncryptedAccessTokenData;
    userId: number;
    tokenId: string;
    expire_time: Date;
}


export interface IEncryptedRefreshTokenData {
    refresh_token: string;
}

class AuthorizationTokenController {
    private genericCipherAlgorithm = 'aes-256-ctr';
    private cipherAlgorithm = 'aes-256-gcm';
    private genericTokenKey = '3zTvzr3p67vC61kmd54rIYu1545x4TlY';
    private genericTokenIV = '60ih0h6vcoEa';



}



export default new AuthorizationTokenController();

