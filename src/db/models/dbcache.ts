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
        return new Promise((resolve, reject) => {
            lock.acquire(key, function() {
                DBCache.findOne({
                    where: {
                        key: key
                    }
                }).then(found=> {
                    if (found) {
                        let oh = moment(Helper.Now()).add(-minutes, 'minutes').toDate();
                        if (found.creationDate > oh) resolve(JSON.parse(found.data))
                        else resolve(null);
                    } else resolve(null)

                }).catch(err=> {
                    resolve(null)
                })
            }).catch(function(err) {
                resolve(null)
            });
        })
    }

    static async put(key: string, val: any) {
        return new Promise((resolve, reject) => {
            lock.acquire(key, function() {
                DBCache.destroy({
                    where: {
                        key: key
                    }
                }).then(()=> {
                    let item = new DBCache({
                        key: key,
                        data: JSON.stringify(val)
                    });
                    item.save().then(saved=>resolve(saved)).catch(err=>reject(err));
                }).catch(err=> {
                    resolve(null);
                })
            }).catch(function(err) {
                resolve(null)
            });
        })
    }

}

export default DBCache;