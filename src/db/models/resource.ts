import { Table, Column, DataType, Model, HasMany, CreatedAt, UpdatedAt, DeletedAt, Unique, Default, AllowNull } from 'sequelize-typescript';
import BaseModel from "./basemodel"
import Helper from '../../lib/helper';
import Product from './product';
import ResourceCategory from './resourcecategory';
import config from '../../config';

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
        name: "type_content_idx",
        fields: ["type", "contentUrl"]
    },
    { type: 'FULLTEXT', name: 'resource_fts', fields: ['title', 'description'] }]


})
class Resource extends BaseModel<Resource> {


    product: Product;

    otherProducts: Product[] = [];

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

    get note() {
        let note = this.tag2;
        if (this.tag1 && this.tag1.includes('tarif')) {
            note = this.tag2 || (`${this.title} yapacağım, lütfen uygun hazırlayın.`);
        } else if (this.tag1 == 'hazirlama-sekli') {
            note = this.tag2 ? (this.tag2) : (this.title + " olarak hazırlayın.")
        } else if (this.tag1 && this.tag1.includes('yemek')) {
            note = this.tag2 || (`${this.title} yapacağım, lütfen uygun hazırlayın.`);
        }


        return note
    }

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


    getFileUrl() {
        config.staticDomain
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