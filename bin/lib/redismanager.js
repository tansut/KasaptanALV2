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
class RedisManager {
    static initTransport() {
        // this.client = redis.createClient({
        //     host: config.redis,
        //     port: config.redisPort,
        //     user: config.redisUser,
        //     password: config.redisPwd
        // });
        // this.client.on('error', function (err) {
        //     Helper.logError(err, {
        //         method: "Redis"
        //     })
        // });
    }
    get(key) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                RedisManager.client.get(key, (err, reply) => {
                    if (err)
                        return reject(err);
                    resolve(JSON.parse(reply));
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
    put(key, val, expireSeconds) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                if (expireSeconds) {
                    RedisManager.client.set(key, JSON.stringify(val), 'EX', expireSeconds, (err) => {
                        resolve(val);
                    });
                }
                else {
                    RedisManager.client.set(key, JSON.stringify(val), (err) => {
                        resolve(val);
                    });
                }
            });
        });
    }
}
RedisManager.initTransport();
exports.default = (new RedisManager());
