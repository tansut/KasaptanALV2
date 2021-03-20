
export interface Puan {
    name: string;
    minSales: number;
    platforms: string;
    rate?: number;
    fixed?: number;
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