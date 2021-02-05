import { Table, Column, DataType, Model, HasMany, CreatedAt, UpdatedAt, DeletedAt, Unique, Default, AllowNull, ForeignKey, BelongsTo } from 'sequelize-typescript';
import BaseModel from "./basemodel"
import Helper from '../../lib/helper';
import moment = require('moment');


var AsyncLock = require('async-lock');
var lock = new AsyncLock({timeout: 5000});

@Table({
    tableName: "DBCaches",
    indexes: [{
        name: "dbcache_key_idx",
        fields: ["key"],
        unique: true
    }
    ]
})
class DBCache extends BaseModel<DBCache> {

    @Column({
        allowNull: false
    })
    key: string;

    @Column({
        allowNull: true,
        type: DataType.TEXT
    })
    data: string;    

    static async retrieve(key: string, minutes: number): Promise<any> {
        //return lock.acquire(key, function() {
                return DBCache.findOne({
                    where: {
                        key: key
                    }
                }).then(found=> {
                    if (found) {
                        let oh = moment(Helper.Now()).add(-minutes, 'minutes').toDate();
                        if (found.creationDate > oh) return JSON.parse(found.data)
                        else return null;
                    } else return null
                })
            //})
    }

    static async put(key: string, val: any) {
            return lock.acquire(key, function() {
                return DBCache.destroy({
                    where: {
                        key: key
                    }
                }).then(()=> {
                    let item = new DBCache({
                        key: key,
                        data: JSON.stringify(val)
                    });
                    return item.save()
                })
            })
        
    }

}

export default DBCache;