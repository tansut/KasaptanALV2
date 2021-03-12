"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const crypto = require("crypto");
class AuthorizationTokenController {
    constructor() {
        this.genericCipherAlgorithm = 'aes-256-ctr';
        this.cipherAlgorithm = 'aes-256-gcm';
        this.genericTokenKey = '3zTvzr3p67vC61kmd54rIYu1545x4TlY';
        this.genericTokenIV = '60ih0h6vcoEa';
        // encryptAccessToken(tokenData: IAccessTokenData): string {
        //     var encryption = this.encryptGeneric(tokenData);
        //     return encryption;
        // }
        // encryptRefreshToken(userId: number, access_token: IAccessTokenData): Promise<string> {
        //     return new Promise((resolve, reject) => {
        //         User.findByPk(userId).then((res) => {
        //             if (!res) {
        //                 reject(new http.NotFoundError("User not found"));
        //                 return;
        //             }
        //             var encryptAccessToken = this.encrypt(access_token, res.ivCode);
        //             var tagDataString = this.convertBufferToUtfString(encryptAccessToken.tag);
        //             var encryptedAccessToken = <IEncryptedAccessTokenData>{ tokenData: encryptAccessToken.encryptedData };
        //             var refreshToken = <IRefreshTokenData>{
        //                 access_token: encryptedAccessToken,
        //                 expire_time: moment().add(1, 'year').toDate(),
        //                 userId: userId
        //             }
        //             var refreshTokenDocument = <RefreshToken>{
        //                 userId: userId,
        //                 token: encryptedAccessToken.tokenData,
        //                 tag: encryptAccessToken.tag
        //             };
        //             RefreshToken.create(refreshTokenDocument, { isNewRecord: true }).then((createdDocument) => {
        //                 refreshToken.tokenId = createdDocument.id.toString();
        //                 var encryptedRefreshToken = this.encryptGeneric(refreshToken);
        //                 resolve(encryptedRefreshToken);
        //             }).catch((err) => {
        //                 reject(new Error("Refresh token couldn't be created"));
        //                 return;
        //             });
        //         });
        //     });
        // }
        // decryptAccessToken(accessTokenData: string): IAccessTokenData {
        //     var decryptedData = <IAccessTokenData>this.decryptGeneric(accessTokenData);
        //     return decryptedData;
        // }
        // decryptRefreshToken(refreshTokenData: string) {
        //     var refreshTokenUnDecrypted = <IRefreshTokenData>this.decryptGeneric(refreshTokenData);
        //     var userCall = User.findByPk(refreshTokenUnDecrypted.userId);
        //     var tokenCall = RefreshToken.findByPk(refreshTokenUnDecrypted.tokenId);
        //     return new Promise((resolve, reject) => {
        //         Promise.all<any>([userCall, tokenCall]).then((retrieveData: any) => {
        //             var user = retrieveData[0];
        //             var token = retrieveData[1];
        //             if (!token || !user) {
        //                 reject("Refresh token is invalid or used already");
        //                 return;
        //             }
        //             try {
        //                 var userAccessToken = <IAccessTokenData>this.decrypt(refreshTokenUnDecrypted.access_token.tokenData, token.tag, user.ivCode);
        //                 if (userAccessToken.userId == token.userId) {
        //                     RefreshToken.destroy({where: {token:token}}).then(() => {
        //                         resolve(user);
        //                     }).catch((err) => {
        //                         reject(err);
        //                     });
        //                 } else {
        //                     reject("Refresh Token Is Modified From Outside Environment.");
        //                 }
        //             } catch (e) {
        //                 reject("Token does not match");
        //             }
        //         }).catch((err) => {
        //             reject(err);
        //         });
        //     });
        // }
    }
    convertUtfStringToBuffer(input) {
        return Buffer.from(input, 'utf8');
    }
    convertBufferToUtfString(input) {
        return input.toString('utf8');
    }
    // private encryptGeneric(item: Object): string {
    //     var encryptionString = JSON.stringify(item);
    //     var cipher = crypto.createCipher(this.genericCipherAlgorithm, this.genericTokenKey);
    //     var encrypted = cipher.update(encryptionString, 'utf8', 'hex');
    //     return encrypted;
    // }
    // private decryptGeneric(encrypted: string): Object {
    //     var cipher = crypto.createDecipher(this.genericCipherAlgorithm, this.genericTokenKey);
    //     var decrypted = cipher.update(encrypted, 'hex', 'utf8');
    //     return JSON.parse(decrypted);
    // }
    // private encrypt(item: Object, iv: string): encrypytionData {
    //     var encryptionString = JSON.stringify(item);
    //     var cipher = crypto.createCipheriv(this.cipherAlgorithm, this.genericTokenKey, iv);
    //     var encrypted = cipher.update(encryptionString, 'utf8', 'hex');
    //     encrypted += cipher.final('hex');
    //     var tag = (<any>cipher).getAuthTag();
    //     return { tag: tag, encryptedData: encrypted };
    // }
    decrypt(encryptedData, tag, iv) {
        var deChipher = crypto.createDecipheriv(this.cipherAlgorithm, this.genericTokenKey, iv);
        deChipher.setAuthTag(tag);
        var decryptedToken = deChipher.update(encryptedData, 'hex', 'utf8');
        decryptedToken += deChipher.final('utf8');
        return JSON.parse(decryptedToken);
    }
}
/*
Usage of tokens :
    access_token
Incoming Token Data (JSON) : {
                    tag : self decryption tag,
tokenData (generic encrypted) : {
                    Includes User Id,
                Expiration Time Of Token Itself, (30 minutes default),
                other props : any[]
            }
        }

        refresh_token
If Incoming Token Data Fails : {
                    Client sends refresh token,
Refresh token includes : {
                    tokenId : Self decryption tag,
refresh_token : (generic encrypted) {
                    access_token : (private encrypted)
                Refresh token Id (private encrypted),
                Expiration time of refresh token Itself, (1 year default)
            }
        }
        Refresh token regenerated. Old one expires
        New access token generated for refresh token (expire time changes)
        Sends client side new access_token along with refresh token
    }

 */
exports.default = new AuthorizationTokenController();
