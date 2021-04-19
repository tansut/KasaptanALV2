"use strict";
// import { IUserDocument } from '../db/models/user';
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidationError = exports.NotFoundError = exports.PermissionError = exports.HttpError = exports.TehnicalError = exports.BusinessError = exports.ApplicationError = void 0;
class ApplicationError extends Error {
    constructor(message) {
        super(message);
    }
}
exports.ApplicationError = ApplicationError;
class BusinessError extends ApplicationError {
    constructor(message) {
        super(message);
    }
}
exports.BusinessError = BusinessError;
class TehnicalError extends ApplicationError {
    constructor(message) {
        super(message);
    }
}
exports.TehnicalError = TehnicalError;
class HttpError extends ApplicationError {
    constructor(statusCode, message) {
        super(message);
        this.statusCode = statusCode;
    }
    static createFromDbError(err, overides) {
        var code = err.code, errorText = overides[code] || this.dbErrorCodes[code] || 'Unknown database error';
        return new HttpError(500, errorText);
    }
}
exports.HttpError = HttpError;
HttpError.dbErrorCodes = {
    11000: 'It seems there already exists a record with this id'
};
class PermissionError extends HttpError {
    constructor(msg, code = 401) {
        super(code, msg || 'unauthorized');
    }
}
exports.PermissionError = PermissionError;
class NotFoundError extends HttpError {
    constructor(msg) {
        super(404, msg || 'notfound');
    }
}
exports.NotFoundError = NotFoundError;
class ValidationError extends HttpError {
    constructor(msg, code = 422) {
        super(code, msg || 'invaliddata');
    }
}
exports.ValidationError = ValidationError;
