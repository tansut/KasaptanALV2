import { Table, Column, DataType, Model, HasMany, CreatedAt, UpdatedAt, DeletedAt, Unique, Default, AllowNull, ForeignKey, BelongsTo } from 'sequelize-typescript';
import BaseModel from "./basemodel"
import Helper from '../../lib/helper';
import { PreferredAddress } from './user';
import { GeoLocation } from '../../models/geo';
import { Google } from '../../lib/google';
import { add } from 'lodash';
import email from '../../lib/email';
import { ButcherProperty } from '../../routes/api/product';

interface AreaDict {
    [key: number]: Area;
}

export interface AreaLevels {
    level1Id?: number;
    level2Id?: number;
    level3Id?: number;
}

@Table({
    tableName: "Areas",
    indexes: [{
        name: "lowerName_idx",
        fields: ["lowerName"]
    },
    {
        name: "slug_level_idx",
        fields: ["slug"],
        unique: true
    },

    { type: 'FULLTEXT', name: 'area_fts', fields: ['name', 'slug', 'keywords', 'display'] }]
})
class Area extends BaseModel<Area> {
    static async NormalizeNames() {
        let areas = await Area.findAll();
        for (let i = 0; i < areas.length; i++) {
            const el = areas[i];
            el.name = Helper.capitlize(Helper.toLower(el.name))
            let r = await el.save();
        }
        return areas;
    }

    @Column({
        allowNull: true,
        type: DataType.GEOMETRY('POINT')
    })
    location: GeoLocation;

    @Column
    locationType: string;

    @Column({
        allowNull: true,
        type: DataType.GEOMETRY('POINT')
    })
    northeast: GeoLocation;


    @Column({
        allowNull: true,
        type: DataType.GEOMETRY('POINT')
    })
    southwest: GeoLocation;

    @Column
    placeid: string;

    @Column
    dispatchTag: string;

    @Column({
        allowNull: true,
        type: DataType.TEXT
    })
    locationData: string;


    static async getBySlug(slug: string) {
        return Area.findOne({
            where: {
                slug: slug
            }
        })
    }

    getLevel(level: number) {
        if (this.level == level) return this;
        else if (level == this.level-1) return this.parent;
        else if (level == this.level-2) return this.parent.parent;
        else if (level == this.level-3) return this.parent.parent.parent;
        else return null;
    }

    getDisplay() {
        let l1 = this.getLevel(1);
        let l2 = this.getLevel(2);
        let l3 = this.getLevel(3);
        let l4 = this.getLevel(4);        
        if (l4) {
            return `${l4.name}, ${l2.name}/${l1.name}`
        } else if (l3) {
            return `${l3.name}, ${l2.name}/${l1.name}`
        } else if (l2) {
            return `${l2.name}/${l1.name}`
        } else if (l1) {
            return `${l1.name}`
        }
    }

    async ensureLocation() {
        if (!this.locationData) {
            try {
                let addres = await this.getPreferredAddress();
                let data = await Google.getLocationResult(addres.display);
                this.locationData = JSON.stringify(data);
                let geo = Google.convertLocationResult(data);
                if (geo.length > 0) {
                    this.location = geo[0].location;
                    this.placeid = geo[0].placeid;
                    this.locationType = geo[0].locationType;
                    this.northeast = geo[0].viewport.northeast;
                    this.southwest = geo[0].viewport.southwest;
                    await this.save();
                }

            } catch (err) {
                Helper.logError(err, {
                    method: 'EnsureLocation Error',
                    id: this.id,
                    name: this.name
                })
            }

        }
    }

    @Column({
        allowNull: false,
    })
    name: string;

    @Column({
        type: DataType.TEXT
    })
    keywords: string;

    @Column({
        allowNull: false,
        defaultValue: 0
    })
    displayOrder: number;

    @Column({
        allowNull: false,
        defaultValue: 'generic'
    })
    status: string;

    @Column({
        allowNull: true,
    })
    code: string;

    @Column({
        allowNull: false,
    })
    slug: string;

    @Column({
        allowNull: false,
    })
    lowerName: string;

    @Column({
        allowNull: true
    })
    display: string;


    @Column({
        allowNull: false
    })
    level: number

    @Column({
        allowNull: true
    })
    selectionRadius: number;

    @Column({
        allowNull: false,
        type: DataType.DECIMAL(13, 2),
        defaultValue: 0.00
    })
    butcherWeightOrder: number;

    @Column({})
    butcherweightsjson: string

    get butcherWeights(): {[key in ButcherProperty]: number} {
        return this.butcherweightsjson ? JSON.parse(this.getDataValue('butcherweightsjson')) : null
    }

    set butcherWeights(value: {[key in ButcherProperty]: number}) {
        this.setDataValue('butcherweightsjson', JSON.stringify(value));
    }



    //{[key in ButcherProperty]: number}

    @Column({
        allowNull: true
    })
    @ForeignKey(() => Area)
    parentid: number

    @BelongsTo(() => Area)
    parent: Area;


    async loadRelatedAreas() {
        if (this.level == 4) {
            let l3 = this.parent = await Area.findByPk(this.parentid, {include: [{all: true}]});
            let l2 = l3.parent || await Area.findByPk(l3.parentid, {include: [{all: true}]});
            let l1 = l2.parent || await Area.findByPk(l2.parentid, {include: [{all: true}]});
            this.parent = this.parent ||  l3;
            this.parent.parent = this.parent.parent || l2;
            this.parent.parent.parent = l1;
        }  else if (this.level == 3) {
            let l2 = this.parent = await Area.findByPk(this.parentid, {include: [{all: true}]});
            let l1 = l2.parent || await Area.findByPk(l2.parentid, {include: [{all: true}]});
            this.parent = this.parent || l2;
            this.parent.parent = this.parent.parent || l1;
        } else if (this.level == 2) {
            let l1 = this.parent = await Area.findByPk(this.parentid, {include: [{all: true}]});
            this.parent = this.parent || l1
        }
    }

    async getPreferredAddress(): Promise<PreferredAddress> {
        let adr: PreferredAddress = {
            based: this
        };
        await this.loadRelatedAreas();
        let l1 = this.getLevel(1);
        let l2 = this.getLevel(2);
        let l3 = this.getLevel(3);
        let l4 = this.getLevel(4);

        adr.level1 = l1;
        adr.level2 = l2;
        adr.level3 = l3;
        adr.level4 = l4;

        adr.level1Id = l1 ? l1.id: null;
        adr.level2Id = l2 ? l2.id: null;
        adr.level3Id = l3 ? l3.id: null;
        adr.level4Id = l4 ? l4.id: null;

        adr.level1Text = l1.name;
        adr.level2Text = l2 ? l2.name: null;
        adr.level3Text = l3 ? l3.name: null;
        adr.level4Text = l4 ? l4.name: null;


        adr.level1Slug = l1 ? l1.slug: null;
        adr.level2Slug = l2 ? l2.slug: null;
        adr.level3Slug = l3 ? l3.slug: null;        
        adr.level4Slug = l4 ? l4.slug: null;


        adr.level1Status = l1 ? l1.status: null;
        adr.level2Status = l2 ? l2.status: null;
        adr.level3Status = l3 ? l3.status: null;
        adr.level4Status = l4 ? l4.status: null;

        adr.lat = adr.lat || this.location ? this.location.coordinates[0]: null;
        adr.lng = adr.lng || this.location ? this.location.coordinates[1]: null;

        adr.display = this.display || this.getDisplay();

        return adr;


        // if (this.level == 1) {
        //     res = {
        //         level1Id: this.id,
        //         level1Slug: this.slug,
        //         level1Text: this.name,
        //         display: this.name,
        //         level1Status: this.status
        //     }
        // } else if (this.level == 2) {
        //     let parent = this.parent || (this.parent  = await Area.findByPk(this.parentid));
        //     res = {
        //         level1Id: parent.id,
        //         level1Slug: parent.slug,
        //         level1Text: parent.name,
        //         level1Status: parent.status,

        //         level2Id: this.id,
        //         level2Slug: this.slug,
        //         level2Text: this.name,
        //         level2Status: this.status,
        //         display: this.name + '/' + parent.name
        //     }
        // } else if (this.level == 3) {
        //     let parentOfParent, parent: Area;
        //     parentOfParent = this.parent && this.parent.parent;
        //     if (parentOfParent == null) {
        //         parent = this.parent || (this.parent =  await Area.findByPk(this.parentid));
        //         parentOfParent = parent.parent || (parent.parent = await Area.findByPk(parent.parentid));
        //     }
        //     res = {
        //         level1Id: parentOfParent.id,
        //         level1Slug: parentOfParent.slug,
        //         level1Text: parentOfParent.name,
        //         level1Status: parentOfParent.status,

        //         level2Id: parent.id,
        //         level2Slug: parent.slug,
        //         level2Text: parent.name,
        //         level2Status: parent.status,

        //         level3Id: this.id,
        //         level3Slug: this.slug,
        //         level3Text: this.name,
        //         level3Status: this.status,

        //         display: this.name + ', ' + parent.name + '/' + parentOfParent.name
        //     }
        // } else {
        //     let parentOfParent2, parentOfParent, parent: Area;
        //     parentOfParent = this.parent && this.parent.parent;
        //     if (parentOfParent == null) {
        //         parent = this.parent || await Area.findByPk(this.parentid);
        //         parentOfParent = parent.parent || await Area.findByPk(parent.parentid);
        //         parentOfParent2 = parentOfParent.parent || await Area.findByPk(parentOfParent.parentid);

        //     }
        //     res = {

        //         level1Id: parentOfParent2.id,
        //         level1Slug: parentOfParent2.slug,
        //         level1Text: parentOfParent2.name,
        //         level1Status: parentOfParent2.status,

        //         level2Id: parentOfParent.id,
        //         level2Slug: parentOfParent.slug,
        //         level2Text: parentOfParent.name,
        //         level2Status: parentOfParent.status,

        //         level3Id: parent.id,
        //         level3Slug: parent.slug,
        //         level3Text: parent.name,
        //         level3Status: parent.status,

        //         level4Id: this.id,
        //         level4Slug: this.slug,
        //         level4Text: this.name,
        //         level4Status: this.status,

        //         display: this.name + ', ' + parent.name + ', ' + parentOfParent.name + '/' + parentOfParent2.name
        //     }
        // }

    }

    // static async fillCities() {
    //     await Area.findAll({
    //         where: {
    //             level: 1
    //         },

    //         raw: true
    //     }).then(data => {
    //         for (let i = 0; i < data.length; i++) {
    //             Area.Cities[data[i].id] = data[i]
    //         }
    //     })
    // }

}

export default Area;