"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const nconf = require("nconf");
const path = require("path");
const fs = require("fs");
class Config {
    constructor() {
        nconf.argv().env().file(path.join(__dirname, "../config.json"));
        this.nodeenv = this.get(Config.NODEENV) || 'development';
        this.pagetrack = this.get(Config.PAGETRACK) || 'true';
        this.port = this.get(Config.PORT) || process.env.PORT || 3000;
        this.dbaddress = this.get(Config.DBADDRESS) || '127.0.0.1';
        this.dbport = this.get(Config.DBPORT) || 3306;
        this.dbname = this.get(Config.DBNAME) || 'kasaptanal-local';
        this.dbuser = this.get(Config.DBUSER) || '';
        this.dbpwd = this.get(Config.DBPWD) || '';
        this.authdb = this.get(Config.AUTHDB) || 'admin';
        this.apidbaddress = this.get(Config.APIDBADDRESS) || '127.0.0.1';
        this.apidbport = this.get(Config.APIDBPORT) || 27017;
        this.apidbname = this.get(Config.APIDBNAME) || 'kasaptanal-api';
        this.apidbuser = this.get(Config.APIDBUSER) || '';
        this.apidbpwd = this.get(Config.APIDBPWD) || '';
        this.apiauthdb = this.get(Config.APIAUTHDB) || 'admin';
        this.stripeApi = this.get(Config.STRIPEAPIKEY) || '';
        this.stripePublic = this.get(Config.STRIPEPUBLICKEY) || '';
        this.sinchApi = this.get(Config.SINCHAPIKEY) || '';
        this.emailAccessKey = this.get(Config.EMAILACCESSKEY) || '';
        this.emailSecretAccessKey = this.get(Config.EMAILSECRETACCESSKEY) || '';
        this.emailServiceUrl = this.get(Config.EMAILSERVICEURL) || '';
        this.emailRateLimit = this.get(Config.EMAILRATELIMIT) || 15;
        this.apiUrl = this.get(Config.APIURL) || 'http://localhost:3001';
        this.enckey = this.get(Config.ENCKEY);
        this.emailHost = this.get(Config.EMAILHOST) || '';
        this.emailPort = this.get(Config.EMAILPORT) || 8889;
        this.emailUsername = this.get(Config.EMAILUSERNAME) || '';
        this.emailPass = this.get(Config.EMAILPASS) || '';
        this.publicDir = this.get(Config.PUBLICDIR) || '';
        this.staticDomain = this.get(Config.STATICDOMAIN) || '';
        this.smsKey = this.get(Config.SMSKEY) || '';
        this.smsSecret = this.get(Config.SMSSECRET) || '';
        this.paymentProvider = this.get(Config.PAYMENTPROVIDER) || 'iyzico';
        this.projectDir = path.join(__dirname, "../");
        this.versionKey = new Date(fs.statSync(path.join(this.projectDir, "package.json")).mtime).getTime();
    }
    get(key, cb) {
        return nconf.get(key, cb);
    }
}
Config.NODEENV = "NODE_ENV";
Config.PAGETRACK = "PAGETRACK";
Config.PORT = "PORT";
Config.DBADDRESS = "DBADDRESS";
Config.DBPORT = "DBPORT";
Config.DBNAME = "DBNAME";
Config.DBUSER = "DBUSER";
Config.DBPWD = "DBPWD";
Config.AUTHDB = "AUTHDB";
Config.APIDBADDRESS = "APIDBADDRESS";
Config.APIDBPORT = "APIDBPORT";
Config.APIDBNAME = "APIDBNAME";
Config.APIDBUSER = "APIDBUSER";
Config.APIDBPWD = "APIDBPWD";
Config.APIAUTHDB = "APIAUTHDB";
Config.STRIPEAPIKEY = "STRIPEAPIKEY";
Config.STRIPEPUBLICKEY = "STRIPEPUBLICKEY";
Config.SINCHAPIKEY = "SINCHAPIKEY";
Config.EMAILACCESSKEY = "EMAILACCESSKEY";
Config.EMAILSECRETACCESSKEY = "EMAILSECRETACCESSKEY";
Config.EMAILSERVICEURL = "EMAILSERVICEURL";
Config.EMAILRATELIMIT = "EMAILRATELIMIT";
Config.APIURL = "APIURL";
Config.ENCKEY = "ENCKEY";
Config.EMAILHOST = "EMAILHOST";
Config.EMAILPORT = "EMAILPORT";
Config.EMAILUSERNAME = "EMAILUSERNAME";
Config.EMAILPASS = "EMAILPASS";
Config.PUBLICDIR = "PUBLICDIR";
Config.STATICDOMAIN = "STATICDOMAIN";
Config.SMSKEY = "SMSKEY";
Config.SMSSECRET = "SMSSECRET";
Config.PAYMENTPROVIDER = "PAYMENTPROVIDER";
exports.default = new Config();

//# sourceMappingURL=config.js.map
