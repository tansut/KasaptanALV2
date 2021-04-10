import Helper from "../helper";

const cron = require("node-cron")

export class BaseTask {

    _task: any;
    _runningJob: Promise<void> = null;

    url = 'https://www.kasaptanal.com';

    get interval() {
        return '* * * * *';

    }

    async run(): Promise<any> {
        return null;
    }

    async _internalRun() {
        try {
            console.log(`Running task ${this.name}`)
            this._runningJob = this.run();
            await this._runningJob;
        } catch (err){
            Helper.logError(err, {
                method: `RunJob`,
                task: this.name
            })
        } finally {
            this._runningJob = null;
            console.log(`Completed task ${this.name}`)
        }
    }

    async init() {
        console.log('Starting@' + this.name + this.interval);        
        await this._internalRun().finally(()=> {
            this._task =  cron.schedule(this.interval, async () =>  {
                await this._internalRun();
            });
        })
    }

    async stop() {
        if (this._runningJob) {
            console.log('waiting for task to finish..' + this.name);
            await Promise.all([this._runningJob]);
            console.log('task finished.' + this.name);
        }
        if (this._task) {
            console.log('crontask destroying..' +  this.name);
            this._task.destroy();
        }
    }

    constructor(public name: string) {

    }
}