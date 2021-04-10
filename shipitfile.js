var pkg = require('./package.json')
    , moment = require('moment')

module.exports = function (shipit) {
    require('shipit-deploy')(shipit);

    shipit.initConfig({
        default: {
            workspace: '/tmp/' + pkg.name,
            deployTo: '/home/ec2-user/apps/' + pkg.name,
            repositoryUrl: pkg.repository.url,
            ignores: ['.git', 'node_modules'],
            keepReleases: 3
        },
        production: {
            //db: 'ec2-user@ec2-52-42-18-118.us-west-2.compute.amazonaws.com'
            servers: ['ec2-user@ec2-54-187-204-66.us-west-2.compute.amazonaws.com', 'ec2-user@ec2-52-10-68-146.us-west-2.compute.amazonaws.com'],
            //servers: ['ec2-user@ec2-54-187-204-66.us-west-2.compute.amazonaws.com', 'ec2-user@ec2-52-10-68-146.us-west-2.compute.amazonaws.com'],

            branch: 'master'
        },
        staging: {
            servers: ['ec2-user@ec2-18-237-6-120.us-west-2.compute.amazonaws.com'],
            branch: 'stage'
        }
    });


    shipit.blTask('install', async function () {
        try {
            //await shipit.remote("nvm use v12.18.1");
            //await shipit.remote("pm2 stop kasaptanal && pm2 delete kasaptanal");
        } catch {

        }

        await shipit.remote("nvm use v14.16.0" + "; export NODE_OPTIONS=--max-old-space-size=4096; cd " + shipit.releasePath + "; npm install --force; npm prune");




    });

    shipit.blTask('aws', async function () {

        await shipit.remote("nvm use v14.16.0; cd " + shipit.releasePath + "; ./node_modules/gulp/bin/gulp.js aws.deploy");

    });


    shipit.blTask('restart', async function () {
        // var self = this
        //     , script1 = `${shipit.releasePath}/bin/kasaptanal.js --node-args="--icu-data-dir=${shipit.releasePath}/node_modules/full-icu"`
        //     , script2 = `${shipit.releasePath}/bin/kasaptanaltasks.js --node-args="--icu-data-dir=${shipit.releasePath}/node_modules/full-icu"`
        //     , startScript = 'nvm use v14.16.0 && source /home/ec2-user/{env} && /home/ec2-user/runkasap2.sh && pm2 start {script2}'
        //     , stopScript = 'nvm use v14.16.0 && pm2 stop kasaptanal && pm2 delete kasaptanal && pm2 stop kasaptanaltasks && pm2 delete kasaptanaltasks'
        //     , env = this.options.environment
        //     , envFile = (env === 'production') ? 'production.kasaptanal.env' : 'production.kasaptanal.env'

        // try {
        //     await shipit.remote(stopScript);
        // } catch {

        // }

        // try {
        //     //await shipit.remote(`mv ${this.currentPath}/bin_ ${this.currentPath}/bin`);
        // } catch {

        // }


        // startScript = startScript.replace(/\{log\}/gi, '/var/log/nodejs/' + pkg.name + '.' + moment().format('YYYY-MM-DD') + '.log');
        // startScript = startScript.replace(/\{outlog\}/gi, '/var/log/nodejs/' + pkg.name + '.out.' + moment().format('YYYY-MM-DD') + '.log');
        // startScript = startScript.replace(/\{errorlog\}/gi, '/var/log/nodejs/' + pkg.name + '.error.' + moment().format('YYYY-MM-DD') + '.log');
        // startScript = startScript.replace(/\{script1\}/gi, script1);
        // startScript = startScript.replace(/\{script2\}/gi, script2);
        // startScript = startScript.replace(/\{env\}/gi, envFile);

        await shipit.remote(`/home/ec2-user/runapp.sh`);

        shipit.on('deployed', () => {
            shipit.start('install', 'restart', 'aws');
        });
    });

    shipit.on('deployed',  () => {
        shipit.start('install', 'restart', 'aws');
    });
};


