"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_typescript_1 = require("sequelize-typescript");
class BaseModel extends sequelize_typescript_1.Model {
    // @DeletedAt
    // deletionDate: Date;
    toClient(c) {
        var result;
        let doc = this;
        if (c) {
            result = new c();
            var docObject = doc.toJSON();
            for (var prop in docObject) {
                if (docObject.hasOwnProperty(prop)) {
                    var propVal = doc[prop];
                    if (typeof propVal != 'undefined' && result.hasOwnProperty(prop))
                        result[prop] = propVal;
                }
            }
        }
        else
            result = doc.toJSON();
        return result;
    }
}
__decorate([
    sequelize_typescript_1.CreatedAt,
    __metadata("design:type", Date)
], BaseModel.prototype, "creationDate", void 0);
__decorate([
    sequelize_typescript_1.UpdatedAt,
    __metadata("design:type", Date)
], BaseModel.prototype, "updatedOn", void 0);
exports.default = BaseModel;

//# sourceMappingURL=basemodel.js.map
