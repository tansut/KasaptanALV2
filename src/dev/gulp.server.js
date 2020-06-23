var gulp = require('gulp');
var ts = require('gulp-typescript');
var sourcemaps = require('gulp-sourcemaps');
var del = require('del');
var buffer = require('gulp-buffer');
var uglify = require('gulp-uglify');
minifyejs = require('gulp-minify-ejs')


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



gulp.task('server.deploy', gulp.series(deployClean, gulp.parallel(deployBin)))