import * as express from "express";
import { BaseTask } from "./basetask";

let appRoutes = [
    './butcherstats',
    './productstats',
    './reviewstask',
    './rutins',
    './areatask',
    './orderbutcherremainers',
    './ordercustomerremainers'
];

export default class TaskLoader {

    static tasks: BaseTask[] = []

    static async stop() {
        TaskLoader.tasks.forEach(t => {
            t.stop();
        })
    }

    static async start() {

        // process.on('exit', (code) => {
        //     console.log(`About to exit with code: ${code}`);

        // });  


        var routings = [];
        appRoutes.forEach((file) => {
            var type = require(file).default;
            let instance: BaseTask = new type();
            TaskLoader.tasks.push(instance);
        });
        await TaskLoader.tasks.forEach(async t => {
            t.init();
        })
        return routings;
    }
}
