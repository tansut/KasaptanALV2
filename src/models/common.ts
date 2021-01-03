export interface PriceView {
    unit: string;
    unitTitle: string;
    price: number;
}


export type FatValueItemType = 'fat' | 'fat:saturated' | 'fat:polyunsaturated' | 'fat:monounsaturated';
export type CarbValueItemType = 'carb' | 'carb:fiber' | 'carb:sugar';
export type ProteinValueItemType = 'protein';
export type GeneralValueItemType = 'cholesterol' | 'sodium' | 'potassium'



export let NutritionValueTitles = {
    'fat': 'Toplam yağ',
    'fat:saturated': 'Doymuş yağ',
    'fat:polyunsaturated': 'Yarı doymuş yağ',
    'fat:monounsaturated': 'Doymamış yağ',
    'carb': 'Toplam karbonhidrat',
    'carb:fiber': 'Lif',
    'carb:sugar': 'Şeker',
    'protein': 'Protein',
    'cholesterol': 'Kolestrol',
    'sodium': 'Sodyum',
    'potassium': 'Potasyum'
}

export let NutritionValueOrders = {
    'fat': 0,
    'fat:saturated': 1,
    'fat:polyunsaturated': 2,
    'fat:monounsaturated': 3,
    'cholesterol': 10,
    'sodium': 20,
    'potassium': 30,
    'carb': 40,
    'carb:sugar': 41,
    'carb:fiber': 42,
    'protein': 50,
}

export type NutritionValueItemType = FatValueItemType | CarbValueItemType | ProteinValueItemType;

export interface NutitionValueItemView {
    type: NutritionValueItemType;
    title: string;
    amount: number;
    unit: string;
}

export interface NutritionView {
    dailyValues:  {[key: string]: number};
    values: NutritionValueView [];
}

export interface NutritionValueView {
    name: string;
    amount: number;
    unit: string;
    calories: number;
    source: string;
    sourceUrl: string;
    values: NutitionValueItemView [];
}