import axios, { AxiosResponse } from "axios";
import { GeoLocation, LocationType } from "../models/geo";
import * as _ from "lodash";

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

    static async distanceMatrix(source: GeoLocation, dest: GeoLocation) {
        let url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${source.coordinates[0]},${source.coordinates[1]}&destinations=${dest.coordinates[0]},${dest.coordinates[1]}&language=tr-TR&key=AIzaSyBFqn2GNAhwbJnpga-3S3xQGBc0EcdAgH8`;
        let resp: AxiosResponse;
        resp = await axios.get(url);
        return resp.data;        
    }

    static async distanceInKM(data: any) {
        if (data && data['status'] == 'OK') {
            let rows = (data['rows'] as []).filter(p=> {
                return (p['elements'] as []).filter(e=>e['status'] == 'OK')
            });
            let max = _.maxBy(rows[0]['elements'], 'distance.value');
            let min = _.minBy(rows[0]['elements'], 'distance.value');
            let val = min;
            return {
                val: val ? (<any>val).distance.value:0,
                min: min ? (<any>min).distance.value:0,
                max: max ? (<any>max).distance.value:0
            }
        } else {
            return {
                val: 0,
                min: 0,
                max: 0,                
            };
        }
    }

}