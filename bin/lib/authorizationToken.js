"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class AuthorizationTokenController {
    constructor() {
        this.genericCipherAlgorithm = 'aes-256-ctr';
        this.cipherAlgorithm = 'aes-256-gcm';
        this.genericTokenKey = '3zTvzr3p67vC61kmd54rIYu1545x4TlY';
        this.genericTokenIV = '60ih0h6vcoEa';
    }
}
exports.default = new AuthorizationTokenController();
