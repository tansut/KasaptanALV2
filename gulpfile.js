var gulp = require('gulp');
var gulpserver = require('./src/dev/gulp.server');
var gulpclient = require('./src/dev/gulp.client');


gulp.task('deploy', gulp.parallel("client.deploy"))
gulp.task('dev', gulp.parallel("server.dev", "client.dev")) 
