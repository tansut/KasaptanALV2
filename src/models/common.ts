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
    'potassium': 'Potasyum',
    'vitamin:a': 'Vitamin A',
    'vitamin:b': 'Vitamin B',
    'vitamin:c': 'Vitamin C',
    'vitamin:d': 'Vitamin D',
    'vitamin:e': 'Vitamin E',
    'vitamin:b6': 'Vitamin B-6',
    'vitamin:iron': 'Demir',
    'vitamin:magnesium': 'Magnezyum',
    'vitamin:cobalamin': 'B12',
    'vitamin:calcium': 'Kalsiyum'


}

export let NutritionValueOrders = {
    'fat': 15,
    'fat:saturated': 16,
    'fat:polyunsaturated': 17,
    'fat:monounsaturated': 18,
    'cholesterol': 40,
    'sodium': 20,
    'potassium': 30,
    'carb': 10,
    'carb:sugar': 11,
    'carb:fiber': 12,
    'protein': 0,

    'vitamin:a': 100,
    'vitamin:b': 105,
    'vitamin:c': 106,
    'vitamin:d': 107,
    'vitamin:e': 108,
    'vitamin:b6': 109,
    'vitamin:iron': 110,
    'vitamin:magnesium': 111,
    'vitamin:cobalamin': 112,
    'vitamin:calcium': 113

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
    description: string;
    unit: string;
    calories: number;
    source: string;
    sourceUrl: string;
    values: NutitionValueItemView [];
}