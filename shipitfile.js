var pkg = require('./package.json')
    , moment = require('moment')

module.exports = function (shipit) {
    require('shipit-deploy')(shipit);

    shipit.initConfig({
        default: {
            workspace: '/tmp/' + pkg.name,
            deployTo: '/srv/nodejs/' + pkg.name,
            repositoryUrl: pkg.repository.url,
            ignores: ['.git', 'node_modules'],
            keepReleases: 5
        },
        production: {
            servers: ['ec2-user@ec2-18-237-6-120.us-west-2.compute.amazonaws.com'],
            branch: 'master'
        },
        staging: {
            servers: ['ec2-user@ec2-18-237-6-120.us-west-2.compute.amazonaws.com'],
            branch: 'stage'
        }
    });


    shipit.blTask('install', async function () {
        await shipit.remote("nvm use v12.10.0" + "; cd " + this.currentPath + "; npm install --force; npm prune");
        // await shipit.remote();
        // await shipit.remote();
    });


    shipit.blTask('restart', async function () {
        var self = this
            , script = this.currentPath + '/bin/kasapburada.js'
            , startScript = 'source /home/ec2-user/{env}; pm2 start {script}'
            , stopScript = 'pm2 stop kasapburada && pm2 delete kasapburada'
            , env = this.options.environment
            , envFile = (env === 'production') ? 'production.kasapburada.env' : 'production.kasapburada.env'

        try {
            await shipit.remote(stopScript);
        } catch {

        }

        startScript = startScript.replace(/\{log\}/gi, '/var/log/nodejs/' + pkg.name + '.' + moment().format('YYYY-MM-DD') + '.log');
        startScript = startScript.replace(/\{outlog\}/gi, '/var/log/nodejs/' + pkg.name + '.out.' + moment().format('YYYY-MM-DD') + '.log');
        startScript = startScript.replace(/\{errorlog\}/gi, '/var/log/nodejs/' + pkg.name + '.error.' + moment().format('YYYY-MM-DD') + '.log');
        startScript = startScript.replace(/\{script\}/gi, script);
        startScript = startScript.replace(/\{env\}/gi, envFile);

        await shipit.remote(startScript);
    });

    shipit.on('published', function () {
        shipit.start('install', 'restart');
    });
};
