import 'reflect-metadata';
import Product from '../db/models/product';
import { OrderItem } from '../db/models/order';

export class ProductTypeManager {
    product: Product;

    saveToOrderItem(o:OrderItem) {

    }

    loadFromOrderItem(o:OrderItem) {

    }    
}

export class GenericProductManager extends ProductTypeManager {
}

export class AdakProductManager extends ProductTypeManager {

    static vekaletData = {
        'online': 'Sipariş vererek vekâletimi de veriyorum',
        'callme': 'Vekâlet için beni arayın',        
    }

    static videoData = {
        'yes': 'Kesim videosu gönderin',
        'no': 'Kesim videosu istemiyorum',        
    } 

    static hisseData = {
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
        '14': 'Ondört hisse tanzim edin' ,   
        '15': 'Onbeş hisse tanzim edin',    
        '15+': 'Onbeş ve üzeri hisse tanzim edin'    
    }       
    
    vekalet: string = 'online';
    video: string = 'yes';
    hisse: string = '4';
    kiminadina: string = '';

    saveToOrderItem(o:OrderItem) {
        o.custom1 = this.vekalet ;
        o.custom2 = this.video ;
        o.custom3 = this.hisse ;
        o.custom4 = this.kiminadina;        
    }

    loadFromOrderItem(o:OrderItem) {
        this.vekalet = o.custom1;
        this.video = o.custom2;
        this.hisse = o.custom3;
        this.kiminadina = o.custom4;
    }    
}

export class KurbanProductManager extends ProductTypeManager {

    static vekaletData = {
        'online': 'Sipariş vererek vekâletimi de veriyorum',
        'callme': 'Vekâlet için beni arayın',        
    }

    static videoData = {
        'yes': 'Kesim videosu gönderin',
        'no': 'Kesim videosu istemiyorum',        
    } 

    static teslimatData = {
        '0': 'Haberleşelim, bayramın 2. günü gelip alırım',
        '1': 'Haberleşelim, bayramın 3. günü gelip alırım',
        '2': 'Haberleşelim, bayramın 4. günü gelip alırım',
        '10': 'Bayramın 2. günü adresime getirin',       
        '11': 'Bayramın 3. günü adresime getirin',       
        '12': 'Bayramın 4. günü adresime getirin',          
    }   
    
    static bagisTarget = {
        '1': 'İhtiyaç sahibi aileye bağışlayın',
        '2': 'Kurban kabul eden aşevi/dernek/vakfa bağışlayın',
    }     
    kiminadina: string = '';
    vekalet: string = 'online';
    video: string = 'no';
    teslimat: string = '0';
    bagisTarget: string = '2';
    bagis: boolean = false;
    bagisNote: string = '';

    saveToOrderItem(o:OrderItem) {
        o.custom1 = this.vekalet ;
        o.custom2 = this.video ;
        o.custom3 = this.teslimat ;
        o.custom4 = this.kiminadina;
        o.custom5 = this.bagisTarget;
        o.custom6 = this.bagis ? 'yes': 'no';
        o.custom7 = this.bagisNote;
    }

    loadFromOrderItem(o:OrderItem) {
        this.vekalet = o.custom1;
        this.video = o.custom2;
        this.teslimat = o.custom3;

        this.kiminadina = o.custom4;
        this.bagisTarget= o.custom5;
        this.bagis = o.custom6 == 'yes' ? true: false;
        this.bagisNote = o.custom7       
    }    
}

export class KurbanDigerProductManager extends ProductTypeManager {

    static vekaletData = {
        'online': 'Sipariş vererek vekâletimi de veriyorum',
        'callme': 'Vekâlet için beni arayın',        
    }

    static videoData = {
        'yes': 'Kesim videosu gönderin',
        'no': 'Kesim videosu istemiyorum',        
    } 

    
    vekalet: string = 'online';
    video: string = 'yes';
    kiminadina: string = '';

    saveToOrderItem(o:OrderItem) {
        o.custom1 = this.vekalet ;
        o.custom2 = this.video ;
        o.custom3 = '' ;
        o.custom4 = this.kiminadina;        
    }

    loadFromOrderItem(o:OrderItem) {
        this.vekalet = o.custom1;
        this.video = o.custom2;
        this.kiminadina = o.custom4;
    }    
}

export class ProductTypeFactory {

    static items: { [key: string]: typeof ProductTypeManager } = {}

    static register(key: string, cls: typeof ProductTypeManager) {
        ProductTypeFactory.items[key] = cls;
    }

    static registerAll() {
        ProductTypeFactory.register('adak', AdakProductManager);
        ProductTypeFactory.register('kurban', KurbanProductManager);
        ProductTypeFactory.register('kurbandiger', KurbanDigerProductManager);
        ProductTypeFactory.register('generic', GenericProductManager);
    }


    static create(key: string, params: any): ProductTypeManager {
        const cls = ProductTypeFactory.items[key] || ProductTypeFactory.items["generic"]
        return Object.assign(new cls(), params);
    }
}


export const UserRoles = {
    admin: 'admin',
    user: 'user',
    editor: 'editor'
}

export class IntegrationInfo<T> {
    public data?: T;

    toClient(): any {
        return {};
    }

    constructor(public remoteId: string) {

    }
}


export class Auth {
    static Anonymous() {
        var fn = () => {
            return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
                Reflect.defineMetadata('auth:anonymous', {}, descriptor.value);
            }
        }
        return fn();
    }

    static GetAnonymous(target: any) {
        return Reflect.getMetadata('auth:anonymous', target);
    }
}

ProductTypeFactory.registerAll();