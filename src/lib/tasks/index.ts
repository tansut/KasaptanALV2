import * as express from "express";
import { BaseTask } from "./basetask";

let appRoutes = [
    './butcherstats',
];

export default class TaskLoader {

    static tasks: BaseTask[] = []
    static async start() {

        process.on('exit', (code) => {
            console.log(`About to exit with code: ${code}`);
            TaskLoader.tasks.forEach(t=> {
                t.stop();
            })            
        });  


        var routings = [];
        appRoutes.forEach((file) => {
            var type = require(file).default;
            let instance: BaseTask = new type();
            TaskLoader.tasks.push(instance);            
        });
        TaskLoader.tasks.forEach(async t=> {
            t.init();
        })
        return routings;
    }
}
