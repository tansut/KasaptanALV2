var gulp = require('gulp');
var ts = require('gulp-typescript');
var sourcemaps = require('gulp-sourcemaps');
var del = require('del');
var buffer = require('gulp-buffer');
var uglify = require('gulp-uglify');
minifyejs = require('gulp-minify-ejs')
var AWS = require("aws-sdk");
var awspublish = require("gulp-awspublish");
 


const deployDir = "";

let tsc = (dest, debug) => {
    var tsProject = ts.createProject('tsconfig.json', {
        watch: false
    });
    var tsResult = tsProject.src();
    if (debug) {
        tsResult = tsResult.pipe(sourcemaps.init())
    }
    tsResult = tsResult.pipe(tsProject());
    if (debug)
        tsResult = tsResult.js.pipe(sourcemaps.write(".", { sourceRoot: "../src/" }));
    //else tsResult = tsResult.pipe(buffer()).pipe(uglify())

    tsResult = tsResult.pipe(gulp.dest(dest))
    return tsResult;
}



function cleanBin() {
    return del("bin")
}

let tsh = () => tsc("bin", true)

gulp.task('minify-html', function() {
         return gulp.src('./src/views/**/*')
         .pipe(minifyejs())
         .pipe(gulp.dest("hhh/src/views"));

    return gulp.src('src/**/*.*')
      
      //.pipe(rename({suffix:".min"}))
      .pipe(gulp.dest('./distxxx'))
  })

gulp.task('server.dev', () => {
    let tsh = () => tsc("bin", true)
    return gulp.series(cleanBin, tsh)(function () {
        console.log("SERVER:watching files")
        gulp.watch('./src/**/*.ts', tsh);
    });
})

gulp.task('server.tsc', tsh);

function deployClean() {
    return del([deployDir + "bin"])
}

// function deployViews() {
//     return gulp.src('./src/views/**/*')
//         .pipe(gulp.dest(deployDir + "src/views"));
// }

function deployBin() {
    return tsc(deployDir + "bin", false);
}

// function deployRemaning() {
//     return gulp.src(['./package.json'])
//         .pipe(gulp.dest("deploy"));
// }


gulp.task('aws.deploy', () => {
    AWS.config.loadFromPath('./awsconfig.json');


    var publisher = awspublish.create(
        {
          params: {
            Bucket: "static.kasaptanal.com/resource"
          }
        },
        {
          cacheFileName: "./cacheaws"
        }
      );
    
      // define custom headers
      var headers = {
        //"Cache-Control": "max-age=315360000, no-transform, public"
        // ...
      };
    
      return (
        gulp
          .src("./public/**/*.*")
          // gzip, Set Content-Encoding headers and add .gz extension
          .pipe(awspublish.gzip())
    
          // publisher will add Content-Length, Content-Type and headers specified above
          // If not specified it will set x-amz-acl to public-read by default
          .pipe(publisher.publish(headers))
    
          // create a cache file to speed up consecutive uploads
          .pipe(publisher.cache())

    
          // print upload updates to console
          .pipe(awspublish.reporter())
      );

    return new Promise((resolve, reject) => {

        resolve()
    })
})


gulp.task('server.deploy', gulp.series(deployClean, gulp.parallel(deployBin, "aws.deploy")))