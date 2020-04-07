const cron = require("node-cron")

export class BaseTask {

    _task: any;

    get interval() {
        return '* * * * *';

    }

    async run(): Promise<any> {
        return null;
    }

    async _internalRun() {
        try {
            await this.run();

        } catch (err){
            console.log(err);
        }
    }

    async init() {
        console.log('Running@' + this.interval);        
        this._internalRun().finally(()=> {
            this._task = cron.schedule(this.interval, async () =>  {
                this._internalRun();
            });
        })
    }

    stop() {
        if (this._task) {
            console.log('task destroyed')
            this._task.destroy();
        }
    }

    constructor(public config: any= {}) {

    }
}