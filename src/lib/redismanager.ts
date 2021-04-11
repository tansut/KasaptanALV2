import * as common from './common';
import config from '../config';
import * as nodemailer from 'nodemailer';
import * as smtpTransport from 'nodemailer-smtp-transport';
import * as ejs from 'ejs';
import * as http from './http'
import * as path from 'path';
import Helper from './helper';
import * as redis from "redis"




class RedisManager {
    static client: any;

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


     async get(key) {
        return new Promise<any>((resolve, reject) => {
            RedisManager.client.get(key, (err, reply) => {
                if (err) return reject(err);
                resolve(JSON.parse(reply))
            })
        })
    }

     async del(key) {
        return new Promise<any>((resolve, reject) => {
            RedisManager.client.del(key, (err, response) => {
                if (err) return reject(err);
                resolve(key)
            })
        })
    }

     async put(key, val, expireSeconds?: number) {
        return new Promise<any>((resolve, reject) => {
            if (expireSeconds) {
                RedisManager.client.set(key, JSON.stringify(val), 'EX', expireSeconds, (err) => {
                    resolve(val)
                })
            } else {
                RedisManager.client.set(key, JSON.stringify(val), (err) => {
                    resolve(val)
                })                
            }

        })
    }


}

RedisManager.initTransport();

export default (new RedisManager());