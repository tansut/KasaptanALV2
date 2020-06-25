import { Table, Column, DataType, Model, HasMany, CreatedAt, UpdatedAt, DeletedAt, Unique, Default, AllowNull } from 'sequelize-typescript';
import BaseModel from "./basemodel"
import Helper from '../../lib/helper';
import Product from './product';
import ResourceCategory from './resourcecategory';
import config from '../../config';
import { ResourceView } from '../../models/productView';

@Table({
    tableName: "Resources",
    indexes: [{
        name: "type_ref1_idx",
        fields: ["type", "ref1"]
    },
    {
        name: "type_ref2_idx",
        fields: ["type", "ref2"]
    },
    {
        name: "type_ref3_idx",
        fields: ["type", "ref3"]
    },

    {
        name: "type_ref4_idx",
        fields: ["type", "ref4"]
    },

    {
        name: "type_ref5_idx",
        fields: ["type", "ref5"]
    },

    {
        name: "type_ref6_idx",
        fields: ["type", "ref6"]
    },

    {
        name: "slug_idx",
        fields: ["slug"],
        unique: true
    },
    {
        name: "type_content_idx",
        fields: ["type", "contentUrl"]
    },
    
    { type: 'FULLTEXT', name: 'resource_fts', fields: ['title', 'description', 'slug', 'keywords'] }]


})
class Resource extends BaseModel<Resource> {

    product: Product;

    otherProducts: Product[] = [];

    @Column
    keywords: string;    

    @HasMany(() => ResourceCategory, {
        sourceKey: "id",
        foreignKey: "resourceid"
    })
    categories: ResourceCategory[];

    @Column({
        allowNull: false,
    })
    type: string;

    @Column({
        allowNull: true
    })
    slug: string;

    @Column({
        allowNull: false,
        defaultValue: true
    })
    list: boolean;

    @Column({
        allowNull: true,
        type: DataType.TEXT
    })
    mddesc: string;    


    @Column({
        allowNull: true
    })
    w: string;    

    @Column({
        allowNull: true
    })
    h: string;     

    @Column({
        allowNull: false,
    })
    ref1: number;

    @Column
    ref2: number;

    @Column
    ref3: number;

    @Column
    ref4: number;

    @Column
    ref5: number;

    @Column
    ref6: number;    

    @Column
    contentType: string;

    @Column
    contentLength: number

    @Column
    title: string;

    @Column
    contentUrl: string;

    @Column
    thumbnailUrl: string;

    @Column
    isdefault: boolean

    @Column
    displayOrder: number

    @Column
    folder: string;

    @Column
    tag1: string;

    @Column
    tag1Desc: string;

    @Column
    tag2: string;

    @Column
    tag2Desc: string;

    @Column
    tag3: string;

    @Column
    tag3Desc: string;

    @Column
    badge: string;

    @Column
    description: string;

    // get note() {
    //     let note = this.tag2;
    //     if (this.tag1 && this.tag1.includes('tarif')) {
    //         note = this.tag2 || (`${this.title} yapacağım, lütfen uygun hazırlayın.`);
    //     } else if (this.tag1 == 'hazirlama-sekli') {
    //         note = this.tag2 ? (this.tag2) : (this.title + " olarak hazırlayın.")
    //     } else if (this.tag1 && this.tag1.includes('yemek')) {
    //         note = this.tag2 || (`${this.title} yapacağım, lütfen uygun hazırlayın.`);
    //     }


    //     return note
    // }

    @Column({
        type: DataType.TEXT
    })
    settingsjson: string

    get settings(): any {
        return this.settingsjson ? JSON.parse(this.getDataValue('settingsjson')) : null
    }

    set settings(value: any) {
        this.setDataValue('settingsjson', JSON.stringify(value));
    }

    asView(): ResourceView {
        return {
            id: this.id,
            title: this.title,
            tag1: this.tag1,
            // thumbnailUrl: (this.thumbnailUrl ? this.thumbnailFileUrl: null) ||  `${Helper.imgUrl('product-photos', this.product.slug)}` ,
            thumbnailUrl: this.thumbnailFileUrl,
            settings: this.settingsByRef
        }
    }

     getRef(id: number): number {
        if (this.product) {
            if (this.ref1 == id) return 1;
            if (this.ref2 == id) return 2;
            if (this.ref3 == id) return 3;
            if (this.ref4 == id) return 4;
            if (this.ref5 == id) return 5;
            if (this.ref6 == id) return 6;
        } else return 0;
    }

    getSettingsByRefId(id: number) {
            let settings = this.settings || {};
            return settings[`ref${this.getRef(id)}`]
    }

    get settingsByRef(): any {
        if (this.product) {
            return this.getSettingsByRefId(this.product.id) || this.settings || {}
        } else return {};
    }

    get fileUrl() {
        return this.getFileUrl()
    }

    get thumbnailFileUrl() {
        return this.getThumbnailFileUrl();
    }

    getFileUrl() {
        if (this.contentType == 'image/jpeg')
            return `${config.staticDomain}/${this.folder}/${this.contentUrl}`
        else return `https://www.youtube.com/watch?v=${this.contentUrl}`;
    }

    getThumbnailFileUrl(ignoreThumbnail: boolean = false) {
        if (this.contentType == 'image/jpeg') {
            return `${config.staticDomain}/${this.folder}/${this.thumbnailUrl}`
        } else if (this.thumbnailUrl && !ignoreThumbnail) {
            return `${config.staticDomain}${this.thumbnailUrl}`
        } else return `https://img.youtube.com/vi/${this.contentUrl}/maxresdefault.jpg`
    }
}

export default Resource;