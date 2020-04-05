export interface Puan {
    name: string;
    minSales: number;
    rate: number;
    minPuanForUsage: number;
}


export interface PuanResult {
    type: "butcher" | "kalitte" | "kalitte-by-butcher";
    id: string;
    title: string;
    desc: string;
    earned: number;
    based: Puan;
}