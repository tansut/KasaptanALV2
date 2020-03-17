import { Table, Column, DataType, Model, HasMany, CreatedAt, UpdatedAt, DeletedAt, Unique, Default, AllowNull, ForeignKey, BelongsTo } from 'sequelize-typescript';
import BaseModel from "./basemodel"
import Helper from '../../lib/helper';
import { PreferredAddress } from './user';

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
        fields: ["slug", "level"],
        unique: true
    },
    
        { type: 'FULLTEXT', name: 'area_fts', fields: ['name', 'slug', 'keywords'] }]
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

    static async getBySlug(slug: string) {
        return Area.findOne({
            where: {
                slug: slug
            }
        })
    }

    @Column({
        allowNull: false,
    })
    name: string;

    @Column
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
        allowNull: false
    })
    level: number

    @Column({
        allowNull: true
    })
    @ForeignKey(() => Area)
    parentid: number

    @BelongsTo(() => Area)
    parent: Area;

    async getPreferredAddress() {
        let res: PreferredAddress;
        if (this.level == 1)  {
            res = {
                level1Id: this.id,
                level1Slug: this.slug,
                level1Text: this.name,
                display: this.name
            }
        } else if (this.level == 2) {
            let parent = this.parent || await Area.findByPk(this.parentid);
            res = {
                level1Id: parent.id,
                level1Slug: parent.slug,
                level1Text: parent.name,

                level2Id: this.id,
                level2Slug: this.slug,
                level2Text: this.name,

                display: this.name + '/' + parent.name
            }
        } else {
            let parentOfParent, parent: Area;            
            parentOfParent = this.parent && this.parent.parent;
            if (parentOfParent == null) {
                parent = this.parent || await Area.findByPk(this.parentid);
                parentOfParent = parent.parent || await Area.findByPk(parent.parentid);
            }
            res = {
                level1Id: parentOfParent.id,
                level1Slug: parentOfParent.slug,
                level1Text: parentOfParent.name,

                level2Id: parent.id,
                level2Slug: parent.slug,
                level2Text: parent.name,

                level3Id: this.id,
                level3Slug: this.slug,
                level3Text: this.name           ,
                
                display: this.name + ', ' + parent.name + '/' + parentOfParent.name 
            }            
        }

        return res;
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