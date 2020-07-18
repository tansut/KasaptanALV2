import * as Jimp2 from 'jimp'
import * as path from "path"
import * as numeral from 'numeral';
import moment = require('moment');
import { AppRequest } from './http';
import config from '../config';
import { GeoLocation } from '../models/geo';

export default class Helper {

    static foodCategories = [{
        slug: 'yemekler',
        name: 'Yemekler'
    }, {
        slug: 'tarifler',
        name: 'Tarifler'
    }]

    static nvl(val, def = 0) {
        return parseInt(val) == NaN ? def: parseInt(val);
    }

    static parseFloat(val) {
        return parseFloat(val.replace(/,/g, ''));
    }


    static distance(p1: GeoLocation, p2: GeoLocation) {
        return Helper._distance(p1.coordinates[0], p1.coordinates[1], p2.coordinates[0], p2.coordinates[1], 'K')
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
        return Number(n.toFixed(2));
    }

    static isToday(date): boolean {
        return (Helper.Now().toDateString() === date.toDateString());
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

    static Now() {
        let now = new Date();
        let res = moment(now).add('minutes', now.getTimezoneOffset()).add('hour', 3);
        return res.toDate();
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


    static formatDate(date: Date, useTime: boolean = false) {
        if (date) {
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        return date.toLocaleDateString('tr-TR', options);
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
        if (parts.krs <= 0) return numeral(parts.val).format('0,0') + 'TL'
        else return numeral(parts.val).format('0,0') + '.' + numeral(parts.krs).format('0,0') + 'TL'
    }

    static getPhoneNumber(phone: string) {
        //05326274151
        let f = phone.replace(' ', '');
        if (f.length == 11 && f[0] == '0')
            f = f.slice(1);
        return f;
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

    


    static normalizePhoto(url: string, thumbnail?: string) {
        return Jimp2.read(path.resolve(url))
            .then(image => {
                let _img = image.resize(1080, Jimp2.AUTO);
                
                return new Promise((resolve, reject) => {
                    _img.write(path.resolve(url), (err) => {
                        if (thumbnail) {
                            let _timg =_img.clone().cover(300, 300);

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