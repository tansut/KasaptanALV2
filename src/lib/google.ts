import axios, { AxiosResponse } from "axios";
import { GeoLocation, LocationType } from "../models/geo";

export interface GeocodeResult {
    location: GeoLocation;
    locationType: LocationType;
    placeid: string;
    viewport: {
        northeast: GeoLocation;
        southwest: GeoLocation;
    }
}

export class Google  {

    static convertLocationResult(results: any []): GeocodeResult [] {
       let res: GeocodeResult [] = [];
       results && results.forEach(r=> {
           let geo: GeocodeResult = {
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
               }
            res.push(geo);
           })
           return res;
    }

    static async getLocation(adres: string): Promise<GeocodeResult []> {
        let results = await Google.getLocationResult(adres);
        return Google.convertLocationResult(results)
    }    




    static async reverse(lat: number, lng: number) {
       let url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=AIzaSyBFqn2GNAhwbJnpga-3S3xQGBc0EcdAgH8`
        let resp: AxiosResponse;
        resp = await axios.get(url);
        return resp.data.results;
    }

    static async getLocationResult(adres: string) {
        let url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURI(adres)}&key=AIzaSyBFqn2GNAhwbJnpga-3S3xQGBc0EcdAgH8`;       
        let resp: AxiosResponse;
        resp = await axios.get(url);
        return resp.data.results;
    }
}