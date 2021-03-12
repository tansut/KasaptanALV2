const cron = require("node-cron")

export class BaseTask {

    _task: any;

    url = 'https://www.kasaptanal.com';

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
        await this._internalRun().finally(()=> {
            this._task =  cron.schedule(this.interval, async () =>  {
                await this._internalRun();
            });
        })
    }

    async stop() {
        if (this._task) {
            console.log('task destroyed')
            this._task.destroy();
        }
    }

    constructor(public config: any= {}) {

    }
}