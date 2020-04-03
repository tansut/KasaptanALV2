import Helper from "../lib/helper";

const orderid = require('order-id')('dkfjsdklfjsdlkg450435034.,')


export type AccountType =  "active" | "passive"
export type ParentAccount =  "kredi-karti-provizyon" | "havuz-hesabi" | 
"kredi-karti-provizyon-iade" | "kredi-karti-odemeleri" | "banka" | "musteri-kalitte-kazanilan-puan" |
"kasap-puan-giderleri" | "kasap-urun-giderleri" | "kalitte-puan-giderleri" | "musteri-kasap-kazanilan-puan" |
"odeme-sirketi-giderleri" | "odeme-bekleyen-satislar" | "satis-alacaklari" | "düşülen-satis-bedelleri"

export interface AccountInfo {
    type: AccountType,
    name: string;
    code: string;
}


export let KnownAccounts: {[key: string]: AccountInfo} = {

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

    "musteri-kalitte-kazanilan-puan": {
        type: "passive",
        name: "",
        code: "132"
    },        

    "kasap-urun-giderleri": {
        type: "active",
        name: "",
        code: "121"
    }  ,

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

    "düşülen-satis-bedelleri": {
        type: "active",
        name: "",
        code: "207"
    }
}



export class Account {    
    code: string;
    info: AccountInfo;
    borc: number;
    alacak: number;   
    desc: string; 

    static getType(parent: ParentAccount) {
        let item = KnownAccounts[parent];
        if (!item) throw new Error('Invalid account:' + parent);
        return item;
    }

    static generateCode(parent: ParentAccount, values: Object[] = null) {
        let accountCode = Account.getType(parent).code;
        return `${accountCode}.` + values.join(".")
    }

    inc(val: number) {
        if (this.info.type == 'active')
            this.borc += val;
        else this.alacak +=val;
        return this;
    }

    dec(val: number) {
        if (this.info.type == 'active')
            this.alacak += val;
        else this.borc +=val;
        return this;
    }

    constructor(parent: ParentAccount, subValues: Object[]) {
        this.info = Account.getType(parent);
        this.code = Account.generateCode(parent, subValues);    
        this.borc = 0.00;
        this.alacak = 0.00;    
    }
}

export class AccountingOperation {    
    desc: string;
    opcode: string;
    accounts: Account[] = [];

    constructor(desc: string, opcode: string = null) {
        this.desc = desc;
        this.opcode = opcode || orderid.generate();
    }

    summary() {
        let borc = 0.00, alacak = 0.00;
        this.accounts.forEach(a => {
            borc+=a.borc;
            alacak+=a.alacak;
        })
        return [Helper.asCurrency(borc), Helper.asCurrency(alacak)]
    }

    validate() {
        let s = this.summary();
        if (s[0] != s[1]) throw new Error("Invalid accounting operation");
        else return s
    }
}