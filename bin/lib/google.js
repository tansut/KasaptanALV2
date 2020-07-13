"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Google = void 0;
const axios_1 = require("axios");
class Google {
    static convertLocationResult(results) {
        let res = [];
        results && results.forEach(r => {
            let geo = {
                locationType: r.geometry.location_type,
                location: {
                    type: 'Point',
                    coordinates: [r.geometry.location.lat, r.geometry.location.lng]
                },
                placeid: r.place_id,
                viewport: {
                    northeast: {
                        type: 'Point',
                        coordinates: [r.geometry.viewport.northeast.lat, r.geometry.viewport.northeast.lng]
                    },
                    southwest: {
                        type: 'Point',
                        coordinates: [r.geometry.viewport.southwest.lat, r.geometry.viewport.southwest.lng]
                    }
                },
            };
            res.push(geo);
        });
        return res;
    }
    static getLocation(adres) {
        return __awaiter(this, void 0, void 0, function* () {
            let results = yield Google.getLocationResult(adres);
            return Google.convertLocationResult(results);
        });
    }
    static reverse(lat, lng) {
        return __awaiter(this, void 0, void 0, function* () {
            let url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=AIzaSyBFqn2GNAhwbJnpga-3S3xQGBc0EcdAgH8`;
            let resp;
            resp = yield axios_1.default.get(url);
            return resp.data.results;
        });
    }
    static getLocationResult(adres) {
        return __awaiter(this, void 0, void 0, function* () {
            let url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURI(adres)}&key=AIzaSyBFqn2GNAhwbJnpga-3S3xQGBc0EcdAgH8`;
            let resp;
            resp = yield axios_1.default.get(url);
            return resp.data.results;
        });
    }
}
exports.Google = Google;
