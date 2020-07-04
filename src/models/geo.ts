


export interface GeoLocation {
    type: string;
    coordinates: number[]
}

export type LocationType = "UNKNOWN" | "ROOFTOP" | "RANGE_INTERPOLATED" | "GEOMETRIC_CENTER" | "APPROXIMATE";

export type LocationSource = "GEOCODE" | "GPS"