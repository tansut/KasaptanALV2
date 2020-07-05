


export interface GeoLocation {
    type: string;
    coordinates: number[]
}

export type LocationType = "UNKNOWN" | "ROOFTOP" | "RANGE_INTERPOLATED" | "GEOMETRIC_CENTER" | "APPROXIMATE";

export type LocationSource = "GEOCODE" | "GPS"

export let LocationTypeDesc = {
    "UNKNOWN": 'Bilinmiyor',
    "ROOFTOP": 'Tam Noktasal',
    "RANGE_INTERPOLATED": 'Arasında',
    "GEOMETRIC_CENTER": 'Ortalama',
    "APPROXIMATE": 'Yaklaşık'
}