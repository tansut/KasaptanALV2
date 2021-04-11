"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("../config");
const helper_1 = require("./helper");
const redis = require("redis");
class RedisManager {
    static initTransport() {
        this.client = redis.createClient({
            host: config_1.default.redis,
            port: config_1.default.redisPort,
            user: config_1.default.redisUser,
            password: config_1.default.redisPwd
        });
        this.client.on('error', function (err) {
            helper_1.default.logError(err, {
                method: "Redis"
            });
        });
    }
    get(key) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                RedisManager.client.get(key, (err, reply) => {
                    if (err) {
                        helper_1.default.logError(err, {
                            method: 'Redis.Get'
                        });
                        resolve(null);
                    }
                    else
                        resolve(reply ? JSON.parse(reply) : undefined);
                });
            });
        });
    }
    flushAll() {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                RedisManager.client.flushdb(function (err, succeeded) {
                    resolve(null);
                });
            });
        });
    }
    del(key) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                RedisManager.client.del(key, (err, response) => {
                    if (err)
                        return reject(err);
                    resolve(key);
                });
            });
        });
    }
    set(key, val, expireSeconds) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                if (expireSeconds) {
                    RedisManager.client.set(key, JSON.stringify(val), 'EX', expireSeconds, (err) => {
                        if (err) {
                            helper_1.default.logError(err, {
                                method: 'Redis.Put'
                            });
                        }
                        resolve(val);
                    });
                }
                else {
                    RedisManager.client.set(key, JSON.stringify(val), (err) => {
                        if (err) {
                            helper_1.default.logError(err, {
                                method: 'Redis.Put'
                            });
                        }
                        resolve(val);
                    });
                }
            });
        });
    }
}
RedisManager.initTransport();
exports.default = (new RedisManager());
