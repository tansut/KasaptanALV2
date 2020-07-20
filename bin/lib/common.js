"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Auth = exports.IntegrationInfo = exports.UserRoles = exports.ProductTypeFactory = exports.KurbanProductManager = exports.AdakProductManager = exports.GenericProductManager = exports.ProductTypeManager = void 0;
require("reflect-metadata");
class ProductTypeManager {
    saveToOrderItem(o) {
    }
    loadFromOrderItem(o) {
    }
}
exports.ProductTypeManager = ProductTypeManager;
class GenericProductManager extends ProductTypeManager {
}
exports.GenericProductManager = GenericProductManager;
class AdakProductManager extends ProductTypeManager {
    constructor() {
        super(...arguments);
        this.vekalet = 'online';
        this.video = 'yes';
        this.hisse = '4';
    }
    saveToOrderItem(o) {
        o.custom1 = this.vekalet;
        o.custom2 = this.video;
        o.custom3 = this.hisse;
    }
    loadFromOrderItem(o) {
        this.vekalet = o.custom1;
        this.video = o.custom2;
        this.hisse = o.custom3;
    }
}
exports.AdakProductManager = AdakProductManager;
AdakProductManager.vekaletData = {
    'online': 'Sipariş vererek vekâletimi de veriyorum',
    'callme': 'Vekâlet için beni arayın',
};
AdakProductManager.videoData = {
    'yes': 'Kesim videosu gönderin',
    'no': 'Kesim videosu istemiyorum',
};
AdakProductManager.hisseData = {
    '1': 'Tek parça tanzim edin',
    '2': 'İki hisse tanzim edin',
    '3': 'Üç hisse tanzim edin',
    '4': 'Dört hisse tanzim edin',
    '5': 'Beş hisse tanzim edin',
    '6': 'Altı hisse tanzim edin',
    '7': 'Yedi hisse tanzim edin',
    '8': 'Sekiz hisse tanzim edin',
    '9': 'Dokuz hisse tanzim edin',
    '10': 'On hisse tanzim edin',
    '11': 'Onbir hisse tanzim edin',
    '12': 'Oniki hisse tanzim edin',
    '13': 'Onüç hisse tanzim edin',
    '14': 'Ondört hisse tanzim edin',
    '15': 'Onbeş hisse tanzim edin',
    '15+': 'Onbeş ve üzeri hisse tanzim edin'
};
class KurbanProductManager extends ProductTypeManager {
    constructor() {
        super(...arguments);
        this.kiminadina = '';
        this.vekalet = 'online';
        this.video = 'no';
        this.teslimat = '0';
        this.bagisTarget = '2';
        this.bagis = false;
        this.bagisNote = '';
    }
    saveToOrderItem(o) {
        o.custom1 = this.vekalet;
        o.custom2 = this.video;
        o.custom3 = this.teslimat;
        o.custom4 = this.kiminadina;
        o.custom5 = this.bagisTarget;
        o.custom6 = this.bagis ? 'yes' : 'no';
        o.custom7 = this.bagisNote;
    }
    loadFromOrderItem(o) {
        this.vekalet = o.custom1;
        this.video = o.custom2;
        this.teslimat = o.custom3;
        this.kiminadina = o.custom4;
        this.bagisTarget = o.custom5;
        this.bagis = o.custom6 == 'yes' ? true : false;
        this.bagisNote = o.custom7;
    }
}
exports.KurbanProductManager = KurbanProductManager;
KurbanProductManager.vekaletData = {
    'online': 'Sipariş vererek vekâletimi de veriyorum',
    'callme': 'Vekâlet için beni arayın',
};
KurbanProductManager.videoData = {
    'yes': 'Kesim videosu gönderin',
    'no': 'Kesim videosu istemiyorum',
};
KurbanProductManager.teslimatData = {
    '0': 'Haberleşelim, bayramın 2. günü gelip alırım',
    '1': 'Haberleşelim, bayramın 3. günü gelip alırım',
    '2': 'Haberleşelim, bayramın 4. günü gelip alırım',
    '10': 'Bayramın 2. günü adresime getirin',
    '11': 'Bayramın 3. günü adresime getirin',
    '12': 'Bayramın 4. günü adresime getirin',
};
KurbanProductManager.bagisTarget = {
    '1': 'İhtiyaç sahibi aileye bağışlayın',
    '2': 'Kurban kabul eden aşevi/dernek/vakfa bağışlayın',
};
class ProductTypeFactory {
    static register(key, cls) {
        ProductTypeFactory.items[key] = cls;
    }
    static registerAll() {
        ProductTypeFactory.register('adak', AdakProductManager);
        ProductTypeFactory.register('kurban', KurbanProductManager);
        ProductTypeFactory.register('generic', GenericProductManager);
    }
    static create(key, params) {
        const cls = ProductTypeFactory.items[key] || ProductTypeFactory.items["generic"];
        return Object.assign(new cls(), params);
    }
}
exports.ProductTypeFactory = ProductTypeFactory;
ProductTypeFactory.items = {};
exports.UserRoles = {
    admin: 'admin',
    user: 'user',
    editor: 'editor'
};
class IntegrationInfo {
    constructor(remoteId) {
        this.remoteId = remoteId;
    }
    toClient() {
        return {};
    }
}
exports.IntegrationInfo = IntegrationInfo;
class Auth {
    static Anonymous() {
        var fn = () => {
            return (target, propertyKey, descriptor) => {
                Reflect.defineMetadata('auth:anonymous', {}, descriptor.value);
            };
        };
        return fn();
    }
    static GetAnonymous(target) {
        return Reflect.getMetadata('auth:anonymous', target);
    }
}
exports.Auth = Auth;
ProductTypeFactory.registerAll();
