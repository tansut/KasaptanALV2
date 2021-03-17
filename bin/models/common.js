"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppPlatform = exports.Platform = exports.NutritionValueOrders = exports.NutritionValueUnits = exports.NutritionValueTitles = void 0;
exports.NutritionValueTitles = {
    'fat': 'Yağ',
    'fat:saturated': 'Doymuş yağ',
    'fat:polyunsaturated': 'Yarı doymuş yağ',
    'fat:monounsaturated': 'Doymamış yağ',
    'carb': 'Karbonhidrat',
    'carb:fiber': 'Lif',
    'carb:sugar': 'Şeker',
    'protein': 'Protein',
    'cholesterol': 'Kolestrol',
    'sodium': 'Sodyum',
    'potassium': 'Potasyum',
    'vitamin:a': 'Vitamin A',
    'vitamin:c': 'Vitamin C',
    'vitamin:d': 'Vitamin D',
    'vitamin:e': 'Vitamin E',
    'vitamin:b6': 'Vitamin B-6',
    'vitamin:iron': 'Demir',
    'vitamin:magnesium': 'Magnezyum',
    'vitamin:cobalamin': 'B12',
    'vitamin:calcium': 'Kalsiyum'
};
exports.NutritionValueUnits = {
    'fat': ['gr'],
    'fat:saturated': ['gr'],
    'fat:polyunsaturated': ['gr'],
    'fat:monounsaturated': ['gr'],
    'carb': ['gr'],
    'carb:fiber': ['gr'],
    'carb:sugar': ['gr'],
    'protein': ['gr'],
    'cholesterol': ['mg'],
    'sodium': ['mg'],
    'potassium': ['mg'],
    'vitamin:a': ['IU', '%'],
    'vitamin:c': ['mg', '%'],
    'vitamin:d': ['IU', '%'],
    'vitamin:e': ['mg', '%'],
    'vitamin:b6': ['mg', '%'],
    'vitamin:iron': ['mg', '%'],
    'vitamin:magnesium': ['mg', '%'],
    'vitamin:cobalamin': ['µg', '%'],
    'vitamin:calcium': ['mg', '%'],
};
exports.NutritionValueOrders = {
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
    'vitamin:c': 106,
    'vitamin:d': 107,
    'vitamin:e': 108,
    'vitamin:b6': 109,
    'vitamin:iron': 110,
    'vitamin:magnesium': 111,
    'vitamin:cobalamin': 112,
    'vitamin:calcium': 113
};
var Platform;
(function (Platform) {
    Platform["web"] = "web";
    Platform["app"] = "app";
})(Platform = exports.Platform || (exports.Platform = {}));
var AppPlatform;
(function (AppPlatform) {
    AppPlatform["android"] = "android";
    AppPlatform["ios"] = "ios";
})(AppPlatform = exports.AppPlatform || (exports.AppPlatform = {}));
