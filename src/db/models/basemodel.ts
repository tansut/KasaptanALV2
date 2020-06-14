import { Model, CreatedAt, UpdatedAt, DeletedAt } from "sequelize-typescript";

export default abstract class BaseModel<T extends Model> extends Model<T> {

    id: number;

    @CreatedAt
    creationDate: Date;

    @UpdatedAt
    updatedOn: Date;

    // @DeletedAt
    // deletionDate: Date;

    
    toClient<T extends Object>(c?: { new(): T; }): any {
        
        var result;
        let doc = this;
        if (c) {
            result = new c();
            var docObject = doc.toJSON();
            for (var prop in docObject) {
                if (docObject.hasOwnProperty(prop)) {
                    var propVal = doc[<string>prop];
                    if (typeof propVal != 'undefined' && result.hasOwnProperty(prop))
                        result[prop] = propVal;
                }
            }
        } else result = doc.toJSON();
        return result;
    }

}