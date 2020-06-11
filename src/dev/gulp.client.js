var gulp = require('gulp');
var ts = require('gulp-typescript');
var fs = require('fs');
var cssmin = require('gulp-cssmin');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var sass = require('gulp-sass');
var sass = require('gulp-sass');
var cleanCSS = require('gulp-clean-css');
var merge = require('merge-stream');
var browserify = require('browserify');
var removeCode = require('gulp-remove-code');
var tap = require('gulp-tap');
var log = require('gulplog');
var buffer = require('gulp-buffer');
var sourcemaps = require('gulp-sourcemaps');
var rename = require("gulp-rename");
var del = require('del');
babel = require('gulp-babel');
browserSync = require('browser-sync').create();
reload = browserSync.reload;
autoprefixer = require('gulp-autoprefixer');
var AWS = require("aws-sdk");
var awspublish = require("gulp-awspublish");
 

var baseDist = 'public';

var webRoot = exports.WEBROOT = __dirname + '/';

var path = {
    src: 'www',
    dist: baseDist,
    dist_js: `${baseDist}/js`,
    dist_css: `${baseDist}/css`,
    src_pug: 'www/templates',
    src_scss: 'www/css',
    src_js: 'www/js',
    src_js_vendor: 'www/vendor/js',
    src_css_vendor: 'www/vendor/css',
    src_img: 'www/img',
    src_resource: 'www/downloads',
    src_ts: 'www/src',
    src_font: 'www/fonts',
    src_topublic: 'www/topublic'
}

let config = {
    debug: true
}


gulp.task('sass:expanded', () => {
    const options = {
        outputStyle: 'expanded',
        precision: 10 // rounding of css color values, etc..
    };
    return gulp.src(path.src_scss + '/theme.scss')
        .pipe(sass(options).on('error', sass.logError))
        .pipe(autoprefixer({
            cascade: false
        }))
        .pipe(gulp.dest(path.dist_css))
        .pipe(browserSync.stream()); // Inject css into browser
});

// Minified
gulp.task('sass:minified', () => {
    const options = {
        outputStyle: 'compressed',
        precision: 10 // rounding of css color values, etc..
    };
    return gulp.src(path.src_scss + '/theme.scss')
        .pipe(sourcemaps.init())
        .pipe(sass(options).on('error', sass.logError))
        .pipe(autoprefixer({
            cascade: false
        }))
        .pipe(rename({ suffix: '.min' }))
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest(path.dist_css))
        .pipe(browserSync.stream()); // Inject css into browser
});



// Concatinate various vendor css files

gulp.task('concat:css', () => {
    return gulp.src([
        path.src_css_vendor + '/*.css',
        '!' + path.src_css_vendor + '/prism.min.css',
    ])
        .pipe(concat('vendor.min.css'))
        .pipe(gulp.dest(path.dist_css))
        .pipe(browserSync.stream()); // Injects css into browser
});


// Concatinate various vendor js files

gulp.task('concat:js', () => {
    return gulp.src([
        path.src_js_vendor + '/jquery.min.js',
        path.src_js_vendor + '/popper.min.js',
        path.src_js_vendor + '/lightgallery.min.js',
        path.src_js_vendor + '/*.js'
    ])
        .pipe(concat('vendor.min.js'))
        .pipe(gulp.dest(path.dist_js))
        .on('end', () => {
            //reload(); // One time browser reload at end of concatination
        });
});


// Move some vendor css files to dist/css folder

gulp.task('move:css', () => {
    return gulp.src([
        path.src_css_vendor + '/prism.min.css'
    ])
        .pipe(gulp.dest(path.dist_css));
});


// Move some vendor js files to dist/js folder

gulp.task('move:js', () => {
    return Promise.resolve();
    // return gulp.src([
    //     path.src_js_vendor + '/card.min.js',
    //     path.src_js_vendor + '/prism.min.js'
    // ])
    //     .pipe(gulp.dest(path.dist_js));
});


// Uglify (minify) + polyfill (Babel) theme core scripts.js file

gulp.task('uglify:js', () => {
    let result = gulp.src(path.src_js + '/**/*.js')
        .pipe(concat('site.min.js'))
        .pipe(babel({
            presets: ['@babel/env']
        }));
    result = config.debug ? result : result.pipe(uglify())

    return result.pipe(gulp.dest(path.dist_js))
        .on('end', () => {
            //reload(); // One time browser reload at end of uglification (minification)
        });
});


// Clean certain files/folders from dist directory. Runs before compilation of new files. See 'default' task at the most bottom of this file

gulp.task('clean', () => {
    return del([
        path.dist_css,
        path.dist + '/img',
        path.dist_js,
        path.dist + '/components',
        path.dist + '/docs',
        path.dist + '/fonts'
    ], {
        force: true
    });
});


// Watcher

gulp.task('watch', () => {
    global.watch = true; // Let the pug task know that we are running in "watch" mode
    gulp.watch(path.src_css_vendor + '/*.css', gulp.series('concat:css'));
    gulp.watch(path.src_scss + '/**/*.scss', gulp.series('sass:minified', 'sass:expanded'));
    gulp.watch(path.src_js_vendor + '/*.js', gulp.series('concat:js'));
    gulp.watch(path.src_js + '/*.js', gulp.series('uglify:js'));

    gulp.watch(path.src_ts + "/**/*.ts*", gulp.parallel('compile:tsc:app', 'compile:tsc:admin'));
    gulp.watch(path.src_img + '/**/*', gulp.series('copy:images'));
    gulp.watch(path.src_font + '/**/*', gulp.series('copy:fonts'));
    gulp.watch(path.src_resource + "/**/*", gulp.series('copy:resources'));
});


gulp.task("compile:tsc:admin", () => {
    let admin = () => tsc(path.src_ts + "/**/admin.run.ts", `${path.dist_js}`, 'admin');
    return admin()
})

gulp.task("compile:tsc:app", () => {
    let app = () => tsc(path.src_ts + "/**/app.run.ts", `${path.dist_js}`, 'app');
    return app()
})

gulp.task("copy:images", () => {
    return gulp.src([path.src_img + '/**/*'])
        .pipe(gulp.dest(`${path.dist}/img`))
})

gulp.task("copy:topublic", () => {
    return gulp.src([path.src_topublic + '/**/*'])
        .pipe(gulp.dest(`${path.dist}`))
})

gulp.task("copy:fonts", () => {
    return gulp.src([path.src_font + '/**/*'])
        .pipe(gulp.dest(`${path.dist}/fonts`))
})

gulp.task("copy:resources", () => {
    return gulp.src([path.src_resource + "/**/*"])
        .pipe(gulp.dest(`${path.dist}/downloads`))
})



let tsc = (file, dest, desFile) => {
    let pipe = gulp.src(file, { read: false })
        .pipe(tap(function (file) {
            //log.info('bundling ' + file.path);
            let bundler = new browserify(file.path, { debug: config.debug });

            bundler.plugin('tsify', {
                target: 'ES5',
                module: 'commonjs',
                project: 'tsconfig.client.json',
                typescript: require('typescript')
            });
            file.contents = bundler.bundle();

        }))
        .pipe(rename(function (path) {
            path.basename = desFile;
            path.extname = ".js";
        }));

    if (config.debug) {
        pipe = pipe.pipe(buffer()).pipe(sourcemaps.init({ loadMaps: true })).pipe(sourcemaps.write('./'))
    } else pipe = pipe.pipe(buffer()).pipe(uglify())
    return pipe.pipe(gulp.dest(dest));
};

gulp.task("set:env", () => {
    config.debug = false;
    return Promise.resolve();
})


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
    

      var headers = {

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
})




let tasks = ['copy:topublic', 'compile:tsc:admin', 'compile:tsc:app', 'copy:images', 'copy:fonts', 'copy:resources', 'concat:js', 'move:js', 'concat:css', 'uglify:js', 'sass:minified', 'sass:expanded'];

gulp.task(
    'client.deploy',
    gulp.series('set:env', 'clean', gulp.parallel(tasks))
);



gulp.task(
    'client.dev',
    gulp.series('clean', gulp.parallel(tasks),
        'watch')
);
