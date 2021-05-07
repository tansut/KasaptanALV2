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
            keepReleases: 1,
            keepWorkspace: false, 
            deleteOnRollback: false,
            shallowClone: true
        },
        production: {
            servers: ['ec2-user@ec2-54-187-204-66.us-west-2.compute.amazonaws.com', 'ec2-user@ec2-52-10-68-146.us-west-2.compute.amazonaws.com'],
            //servers: ['ec2-user@ec2-54-187-204-66.us-west-2.compute.amazonaws.com'],
            branch: 'master'
        },
        staging: {
            servers: ['ec2-user@ec2-18-237-6-120.us-west-2.compute.amazonaws.com'],
            branch: 'stage'
        }
    });

    shipit.blTask('npm-install', async () => {
        await shipit.remote("nvm use v14.16.0" + "; export NODE_OPTIONS=--max-old-space-size=4096; cd " + shipit.releasePath + "; npm install;"); 
    });

    shipit.blTask('aws', async () => {
        await shipit.remote("nvm use v14.16.0; cd " + shipit.releasePath + "; ./node_modules/gulp/bin/gulp.js aws.deploy");
    });


    shipit.blTask('pm2', async () => {
        await shipit.remote(`/home/ec2-user/runapp.sh`);
    });

    shipit.on('updated',  () => {
        shipit.start('npm-install');
    });

    shipit.on('published',  () => {
        shipit.start('pm2');
    });

    shipit.on('deployed',  () => {
        shipit.start('aws');
    });
};


