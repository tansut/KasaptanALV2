import * as Jimp2 from 'jimp'
import * as path from "path"
import * as numeral from 'numeral';
import moment = require('moment');
import { AppRequest } from './http';
import config from '../config';
import { GeoLocation } from '../models/geo';
import { ProductType } from '../db/models/product';
import { min, round } from 'lodash';
import parsePhoneNumber from 'libphonenumber-js';
import { Shipment, ShipmentDays } from '../models/shipment';
import * as crypto from 'crypto';
import User, { PreferredAddress } from '../db/models/user';
import email from './email';

export default class Helper {

    static foodCategories = [{
        slug: 'yemekler',
        name: 'Yemekler'
    }, {
        slug: 'tarifler',
        name: 'Tarifler'
    }]


    static serializePrefAddr(adr: PreferredAddress) {
        return {
            level1Id: adr.level1Id,
            level2Id: adr.level2Id,
            level3Id: adr.level3Id,
            level4Id: adr.level4Id
        }
    }

    static getUrl(req) {
        let proto = req.header("x-forwarded-proto") || req.protocol;
        let host = config.nodeenv == "development" ? req.get('Host'): 'www.kasaptanal.com';
        return proto + '://' + host;      
    }

    static nvl(val, def = 0) {
        return parseInt(val) == NaN ? def: parseInt(val);
    }

    static parseFloat(val) {
        return parseFloat(val.replace(/,/g, ''));
    }


    static distance(p1: GeoLocation, p2: GeoLocation) {
        return Helper._distance(p1.coordinates[0], p1.coordinates[1], p2.coordinates[0], p2.coordinates[1], 'K')
    }


    static number2Text(n: number, slice:  number) {
        let rounded = 0;
        for(let i=50; i>0;i-=10) {
            rounded = Math.round(Math.floor(n/i)*i);
            if (rounded > 0) break;
        }

        if (rounded > 0) {
            return `${rounded}+`
        } else if (n>0)
            return `${n}+`
        else return '';
    }

    static hasRightOnButcher(user: User, butcherid: number) {
        return user.hasRole("admin") || ((user.hasRole("butcher") && user.butcherid == butcherid))
    }

    static getErrorLog(err: Error,  additionalData?: Object, req?: AppRequest) {

        
        return `
            ********* ${Helper.Now().toString()} ********
            Error: ${err ? JSON.stringify(err): 'none'},
            Message: ${err ? err.message: 'none'},
            Stack: ${err ? err.stack: 'none'},
            Additional: ${additionalData ? JSON.stringify(additionalData): 'none'}
            Url: ${req ? req.url: ''}
            Method: ${req ? req.method: ''}
            Agent: ${req ? req.headers["user-agent"]: ''}
            ******************π***************************
        `
        

    }

    // static dateAdd(date: Date, interval: number, units: string) {
    //     if(!(date instanceof Date))
    //       return undefined;
    //     var ret = new Date(date); //don't change original date
    //     var checkRollover = function() { if(ret.getDate() != date.getDate()) ret.setDate(0);};
    //     switch(String(interval).toLowerCase()) {
    //       case 'year'   :  ret.setFullYear(ret.getFullYear() + units); checkRollover();  break;
    //       case 'quarter':  ret.setMonth(ret.getMonth() + 3*units); checkRollover();  break;
    //       case 'month'  :  ret.setMonth(ret.getMonth() + units); checkRollover();  break;
    //       case 'week'   :  ret.setDate(ret.getDate() + 7*units);  break;
    //       case 'day'    :  ret.setDate(ret.getDate() + units);  break;
    //       case 'hour'   :  ret.setTime(ret.getTime() + units*3600000);  break;
    //       case 'minute' :  ret.setTime(ret.getTime() + units*60000);  break;
    //       case 'second' :  ret.setTime(ret.getTime() + units*1000);  break;
    //       default       :  ret = undefined;  break;
    //     }
    //     return ret;
    //   }

    static async logError(err: Error, additionalData?: Object, req?: AppRequest, sendEmail: boolean = true) {
        let text = Helper.getErrorLog(err, additionalData, req)
        console.log(text);
        (config.nodeenv == "production") && sendEmail && await email.send('tansut@gmail.com', 'kasaptanAl:hata', "error.ejs", {
            text: text,
            stack: err.stack
        }, 'error')
    }


    static isSingleShopcardProduct(type: string) {
        return (type == ProductType.adak) ||
        (type == ProductType.kurban) ||
        (type == ProductType.kurbandiger) ||
        (type == ProductType.tumkuzu)
    }

    static _distance(lat1, lon1, lat2, lon2, unit) {
        if ((lat1 == lat2) && (lon1 == lon2)) {
            return 0;
        }
        else {
            var radlat1 = Math.PI * lat1/180;
            var radlat2 = Math.PI * lat2/180;
            var theta = lon1-lon2;
            var radtheta = Math.PI * theta/180;
            var dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
            if (dist > 1) {
                dist = 1;
            }
            dist = Math.acos(dist);
            dist = dist * 180/Math.PI;
            dist = dist * 60 * 1.1515;
            if (unit=="K") { dist = dist * 1.609344 }
            if (unit=="N") { dist = dist * 0.8684 }
            var rounded = Math.round(dist * 10) / 10
            return rounded;
        }
    }

    static asCurrency(n: number) {
        n = n || 0.00;
        return Number(n.toFixed(2));
    }

    static isToday(date): boolean {
        return (Helper.Now().toDateString() === date.toDateString());
    }

    static Yesterday(): Date {
        return new Date(Helper.Now().getTime() - 24 * 60 * 60 * 1000)
    }

    static Tomorrow(): Date {
        return new Date(Helper.Now().getTime() + 24 * 60 * 60 * 1000)
    }

    static NextDay(date) {
        return new Date(date.getTime() + 24 * 60 * 60 * 1000)
    }

    static isTomorrow(date): boolean {
        return (this.NextDay(Helper.Now()).toDateString() === date.toDateString());
    }

    static get days() {
        return ShipmentDays;
    }

    static Now() {
        let now = new Date();
        let res = moment(now).add(now.getTimezoneOffset(), 'minutes').add(3, 'hour');
        return res.toDate();
    }

    static newDate(value: string | number) {
        let d = new Date(value);
        let res = moment(d).add(d.getTimezoneOffset(), 'minutes').add(3, 'hour');
        return res.toDate();        
    }

    static newDate2(year: number, month: number, date?: number, hours?: number, minutes?: number, seconds?: number, ms?: number) {
        let d = new Date(year, month, date, hours|| 0, minutes || 0, seconds || 0, ms ||0);
        let res = moment(d).add(d.getTimezoneOffset(), 'minutes').add(3, 'hour');
        return res.toDate();        
    }

    static template(tpl, data) {
        return tpl.replace(/\$\(([^\)]+)?\)/g, function($1, $2) { return data[$2]; });
    }
      



    static shuffle(array) {
        var currentIndex = array.length, temporaryValue, randomIndex;

        // While there remain elements to shuffle...
        while (0 !== currentIndex) {

            // Pick a remaining element...
            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex -= 1;

            // And swap it with the current element.
            temporaryValue = array[currentIndex];
            array[currentIndex] = array[randomIndex];
            array[randomIndex] = temporaryValue;
        }

        return array;
    }


    static boolStr(val: boolean) {
        return val ? 'Evet' : 'Hayır'
    }


    


    static formatDate(date: Date, useTime: boolean = false, useYear: boolean=true) {
        if (date) {
        const options: Intl.DateTimeFormatOptions = { weekday: "long", year:  useYear ? 'numeric': 'numeric', month: 'long', day: 'numeric' };
        return date.toLocaleDateString('tr-TR', options) + (useTime ? ` ${date.getHours()}:${date.getMinutes()}`:'');
        } else return ''
    }

    static UtcNow() {
        return moment.utc().toDate();
    }

    static splitCurrency(n: number) {
        let absn = Math.abs(n)
        return {
            val: Math.trunc(n),
            krs: (Number(absn.toFixed(2)) - Math.trunc(absn)) * 100
        }
    }

    static formatCurrency(n: number) {
        let split = Helper.splitCurrency(n)
        return {
            val: numeral(split.val).format('0,0'),
            krs: numeral(split.krs).format('00')
        }
    }


    static formattedCurrency(n: number, symbol: string = 'TL') {
        let parts = Helper.splitCurrency(Helper.asCurrency(n));
        if (parts.krs <= 0) return numeral(parts.val).format('0,0') + symbol
        else return numeral(parts.val).format('0,0') + '.' + numeral(parts.krs).format('0,0') + symbol
    }

    static isValidPhone(num: string) {
        let phone = parsePhoneNumber(num, 'TR')
        return phone.isValid();
    }

    static getPhoneNumber(num: string) {
        let phone = parsePhoneNumber(num, 'TR');
        return (phone && phone.number) ?  phone.number.toString() :num;

    }

     


    static ResourcePaths = {
        "butcher-google-photos": "kasap-resimleri",
        "product-photos": "urun-resimleri",
        "category-photos": "kategori-resimleri"
    }

    static getRandomInt(max) {
        return Math.floor(Math.random() * Math.floor(max));
    }

    static toLower(s: string) {
        var letters = { "İ": "i", "I": "ı", "Ş": "ş", "Ğ": "ğ", "Ü": "ü", "Ö": "ö", "Ç": "ç" };
        s = s.replace(/(([İIŞĞÜÇÖ]))/g, function (letter) { return letters[letter]; })
        return s.toLowerCase();
        //return s.toLocaleLowerCase().replace(new RegExp("i", 'g'), "ı").replace(new RegExp("i̇", 'g'), "i");
    }

    static capitlize(text: string) {
        return this.toLower(text)
            .split(' ')
            .map((s) => s.charAt(0).toUpperCase() + s.substring(1))
            .join(' ');
    }

    static canBeOrderedByPhone() {
        return true;
    }

    static mapValues(value: number, x1, y1, x2=0, y2=100) {
        return (value - x1) * (y2 - x2) / (y1 - x1) + x2;
    } 


    static normalizePhoto(url: string, thumbnail?: string) {
        return Jimp2.read(path.resolve(url))
            .then(image => {
                let _img = image.resize(1440, Jimp2.AUTO);
                
                return new Promise((resolve, reject) => {
                    _img.write(path.resolve(url), (err) => {
                        if (thumbnail) {
                            let _timg =image.clone().cover(360, 360);

                            _timg.write(path.resolve(thumbnail), (err) => {
                                err ? reject(err) : resolve(_img);
                            })
                        }
                        else err ? reject(err) : resolve(_img);
                    })
                })

                // return _img.getBufferAsync("image/jpeg").then(buff => {
                //     this.res.set("jpeg")
                //     this.res.send(new Buffer(buff))
                // })  
            })
    }


    static generateToken(size: number) {
        const buffer = Buffer.alloc(size);
        crypto.randomFillSync(buffer);
        return buffer.toString('base64');
    }

    static slugify(string) {
        const a = 'ıàáâäæãåāăąçćčđďèéêëēėęěğǵḧîïíīįìłḿñńǹňôöòóœøōõṕŕřßśšşșťțûüùúūǘůűųẃẍÿýžźż·/_,:;'
        const b = 'iaaaaaaaaaacccddeeeeeeeegghiiiiiilmnnnnooooooooprrsssssttuuuuuuuuuwxyyzzz------'
        const p = new RegExp(a.split('').join('|'), 'g')

        return string.toString().toLowerCase()
            .replace(/\s+/g, '-') // Replace spaces with -
            .replace(p, c => b.charAt(a.indexOf(c))) // Replace special characters
            .replace(/&/g, '-') // Replace & with 'and'
            .replace(/[^\w\-]+/g, '') // Remove all non-word characters
            .replace(/\-\-+/g, '-') // Replace multiple - with single -
            .replace(/^-+/, '') // Trim - from start of text
            .replace(/-+$/, '') // Trim - from end of text
    }
}