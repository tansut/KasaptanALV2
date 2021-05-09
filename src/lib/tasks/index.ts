import * as express from "express";
import Helper from "../helper";
import { BaseTask } from "./basetask";

let appRoutes = [
    //'./butcherstats',
    //'./productstats',
    //'./reviewstask',
    //'./rutins',
    //'./areatask',
    './orderbutcherremainers',
    './ordercustomerremainers'
];

export default class TaskLoader {

    static tasks: BaseTask[] = []

    static async stop() {
        console.log("Stopping tasks ...");
        for(let i = 0; i < TaskLoader.tasks.length;i++) {
            try {
                console.log(`waiting for task to stop: ${i}`);
                await TaskLoader.tasks[i].stop();
                console.log(`task stopped: ${TaskLoader.tasks[i].name}`);
            } catch(err) {
                Helper.logError(err, {
                    method: 'TaskLoader.stop',
                    task: TaskLoader.tasks[i].name
                })
            }
            
        }
        console.log("Stoppoed all tasks ...");
    }

    static async start() {

        // process.on('exit', (code) => {
        //     console.log(`About to exit with code: ${code}`);

        // });  


        var routings = [];
        appRoutes.forEach((file) => {
            var type = require(file).default;
            let instance: BaseTask = new type(file);
            TaskLoader.tasks.push(instance);
        });
        for(let i= 0; i < TaskLoader.tasks.length; i++) {
            let t = TaskLoader.tasks[i]
            await t.init();
        }
        return routings;
    }
}
