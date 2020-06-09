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
        'online': 'Sipariş vererek size vekâletimi de veriyorum',
        'callme': 'Kesimden önce vekâlet için beni arayın',        
    }

    static videoData = {
        'yes': 'Whatsapp üzerinden kesim videosu gönderin',
        'no': 'Kesim videosu göndermenizi istemiyorum',        
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
        '10': 'On hisse tanzim edin'    
    }       
    
    vekalet: string = 'online';
    video: string = 'yes';
    hisse: string = '4';

    saveToOrderItem(o:OrderItem) {
        o.custom1 = this.vekalet ;
        o.custom2 = this.video ;
        o.custom3 = this.hisse ;
    }

    loadFromOrderItem(o:OrderItem) {
        this.vekalet = o.custom1;
        this.video = o.custom2;
        this.hisse = o.custom3;
    }    
}


export class ProductTypeFactory {

    static items: { [key: string]: typeof ProductTypeManager } = {}

    static register(key: string, cls: typeof ProductTypeManager) {
        ProductTypeFactory.items[key] = cls;
    }

    static registerAll() {
        ProductTypeFactory.register('adak', AdakProductManager);
        ProductTypeFactory.register('generic', AdakProductManager);
    }


    static create(key: string, params: any): ProductTypeManager {
        const cls = ProductTypeFactory.items[key]
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