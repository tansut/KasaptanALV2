"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccountingOperation = exports.Account = exports.KnownAccounts = void 0;
const helper_1 = require("../lib/helper");
const orderid = require('order-id')('dkfjsdklfjsdlkg450435034.,');
exports.KnownAccounts = {
    "kredi-karti-provizyon": {
        type: "passive",
        name: "Müşterilerden çekilen provizyon",
        code: "200"
    },
    "havuz-hesabi": {
        type: "active",
        name: "Havuz hesabı",
        code: "201"
    },
    "kredi-karti-provizyon-iade": {
        type: "active",
        name: "",
        code: "202"
    },
    "kredi-karti-odemeleri": {
        type: "passive",
        name: "",
        code: "600"
    },
    "musteri-harcanan-puan": {
        type: "active",
        name: "Kullanılan puanlar",
        code: "602"
    },
    "banka": {
        type: "active",
        name: "",
        code: "100"
    },
    "kasap-puan-giderleri": {
        type: "active",
        name: "",
        code: "120"
    },
    "musteri-kasap-kazanilan-puan": {
        type: "passive",
        name: "",
        code: "130"
    },
    "kullanilan-puanlar": {
        type: "passive",
        name: "",
        code: "126"
    },
    "musteri-kalitte-kazanilan-puan": {
        type: "passive",
        name: "",
        code: "132"
    },
    "kasap-urun-giderleri": {
        type: "active",
        name: "",
        code: "121"
    },
    "kalitte-puan-giderleri": {
        type: "active",
        name: "",
        code: "125"
    },
    "odeme-sirketi-giderleri": {
        type: "active",
        name: "",
        code: "110"
    },
    "odeme-bekleyen-satislar": {
        type: "passive",
        name: "",
        code: "205"
    },
    "satis-alacaklari": {
        type: "active",
        name: "",
        code: "206"
    },
    "kasaplardan-alacaklar": {
        type: "active",
        name: "",
        code: "210"
    },
    "kasap-borc-tahakkuk": {
        type: "passive",
        name: "",
        code: "605"
    },
    "satis-indirimleri": {
        type: "active",
        name: "Uygulanan Satış İndirimleri",
        code: "207"
    },
    "gelirler": {
        type: "passive",
        name: "Gelirler",
        code: "650"
    },
    "kasaplardan-kesilen-komisyonlar": {
        type: "active",
        name: "Kasaplardan Kesilen komisyonlar",
        code: "215"
    }
};
class Account {
    constructor(parent, subValues, itemDesc = '') {
        this.info = Account.getType(parent);
        this.code = Account.generateCode(parent, subValues);
        this.borc = 0.00;
        this.alacak = 0.00;
        this.itemDesc = itemDesc;
    }
    static getType(parent) {
        let item = exports.KnownAccounts[parent];
        if (!item)
            throw new Error('Invalid account:' + parent);
        return item;
    }
    static generateCode(parent, values) {
        let accountCode = Account.getType(parent).code;
        return `${accountCode}.` + values.join(".");
    }
    inc(val) {
        if (this.info.type == 'active')
            this.borc += helper_1.default.asCurrency(val);
        else
            this.alacak += helper_1.default.asCurrency(val);
        return this;
    }
    dec(val) {
        if (this.info.type == 'active')
            this.alacak += helper_1.default.asCurrency(val);
        else
            this.borc += helper_1.default.asCurrency(val);
        return this;
    }
}
exports.Account = Account;
class AccountingOperation {
    constructor(desc, opcode) {
        this.accounts = [];
        this.desc = desc;
        this.opcode = opcode || orderid.generate();
    }
    summary() {
        let borc = 0.00, alacak = 0.00;
        this.accounts.forEach(a => {
            borc += a.borc;
            alacak += a.alacak;
        });
        return [helper_1.default.asCurrency(borc), helper_1.default.asCurrency(alacak)];
    }
    validate() {
        let s = this.summary();
        if (s[0] != s[1]) {
            throw new Error("Invalid accounting operation");
        }
        else
            return s;
    }
}
exports.AccountingOperation = AccountingOperation;
