'use strict';

global.$ = {
    package     : require('./package.json'),
    config      : require('./gulp/config'),
    path        : {
        tasks   : [

        ],
        //template: require('./gulp/paths/template.js'),
        //foundation: require('./gulp/paths/foundation.js'),
        //app: require('./gulp/paths/app.js')
    },
    gulp        : require('gulp'),
    rimraf      : require('rimraf'),
    browserSync : require('browser-sync').create(),
    gp          : require('gulp-load-plugins')()
};

// Define base folders
var root = './';
var src  = './app/';
var dest = './build/';

// Include plugins
var gulp            = require('gulp'),
    pug             = require('gulp-pug'),
    gulpif          = require('gulp-if'),
    concat          = require('gulp-concat'),
    plumber         = require('gulp-plumber'),
    sourcemaps      = require('gulp-sourcemaps'),
    autoprefixer    = require('gulp-autoprefixer'),
    uglify          = require('gulp-uglify'),
    rename          = require('gulp-rename'),
    sass            = require('gulp-sass'),
    browserify      = require('gulp-browserify'),
    imagemin        = require('gulp-imagemin'),
    cache           = require('gulp-cache'),
    cssnano         = require('gulp-cssnano'),
    filter          = require('gulp-filter'),
    useref          = require('gulp-useref'),
    rimraf          = require('rimraf'),
    svgSprite       = require('gulp-svg-sprite'),
    svgmin          = require('gulp-svgmin'),
    cheerio         = require('gulp-cheerio'),
    replace         = require('gulp-replace'),
    browserSync     = require('browser-sync').create();

// Svg sprite config
var svgSprite_config = {
    mode : {
        symbol              : {
            example         : true
        }
    },
};


// Paths
var paths = {
    pug : {
        location    : src + 'template/**/*.pug',
        compiled    : src + 'template/_pages/*.pug',
        destination : dest
    },

    scss : {
        location    : src  + 'scss/**/*.scss',
        entryPoint  : src  + 'scss/style.scss',
        destination : dest + 'css'
    },

    js : {
        location    : src  + 'js/**/*.js',
        entryPoint  : src  + 'js/main.js',
        destination : dest + 'js'
    },

    browserSync : {
        baseDir    : root,
        watchPaths : ['build/*.html', 'build/css/*.css', 'build/js/*.js']
    }
};

// ------- pug task ---------
gulp.task('pug', function() {
    return gulp.src(paths.pug.compiled)
        .pipe(plumber())
        .pipe(pug({
            pretty: '\t',
            basedir: root
        }))
        .pipe(gulpif('*.js', uglify()))
        .pipe(gulpif('*.css', cssnano()))
        .pipe(useref())
        .pipe(gulp.dest(paths.pug.destination))
    ;
});


// ------- sass task ---------
gulp.task('sass', function() {
    return gulp.src(paths.scss.entryPoint)
        .pipe(sourcemaps.init())
        .pipe(sass()).on('error', sass.logError)

        .pipe(autoprefixer({browser: ['last 3 version', '> 1%', 'ie 8', 'ie 9', 'Opera 12.1']}))
        .pipe(sourcemaps.write())
        .pipe(gulp.dest(paths.scss.destination))
        .pipe(browserSync.stream())
    ;
});


// ---------- js task ----------
gulp.task('scripts', function(){
    return gulp.src(paths.js.entryPoint)
        .pipe(plumber())
        .pipe(browserify({
            insertGlobals : true,
            debug : true
        }))
        //.pipe(uglify())
        .pipe(rename('main.min.js'))
        .pipe(gulp.dest(paths.js.destination));
});


// --------- images task --------------
gulp.task('images', function() {
    return gulp.src(src + 'images/**/*')
        .pipe(cache(imagemin({ optimizationLevel: 5, progressive: true, interlaced: true })))
        .pipe(gulp.dest(dest + 'img'))
    ;
});


// --------- SVG task --------------
gulp.task('svg', function() {
    return gulp.src(src + '**/*.svg')
        // minify svg
        .pipe(svgmin({
            js2svg: {
                pretty: true
            }
        }))

        // remove all fill and style declarations in out shapes
        .pipe(cheerio({
            run: function ($) {
                $('[fill]').removeAttr('fill');
                $('[style]').removeAttr('style');
            },
            parserOptions: { xmlMode: true }
        }))

        // cheerio plugin create unnecessary string '>', so replace it.
        .pipe(replace('&gt;', '>'))

        // build svg sprite
        .pipe(svgSprite(svgSprite_config))

        .pipe(gulp.dest(dest + 'icons/'))
    ;
});


// --------- fonts task --------------
gulp.task('fonts', function() {
    return gulp.src(src + 'fonts/**/*.{ttf,woff,woff2,eof,svg}')
        .pipe(gulp.dest(dest + 'fonts'))
    ;
});


// Watch for changes in files
gulp.task('watch', function() {
    gulp.watch(paths.pug.location, gulp.series('pug'));
    gulp.watch(paths.scss.location, gulp.series('sass'));
    gulp.watch(paths.js.location, gulp.series('scripts'));
});

gulp.task('serve', function() {
    browserSync.init({
        open: false,
        server: './build/'
    });

    browserSync.watch(['./build' + '/**/*.*', '!**/*.css'], browserSync.reload);
});



// -------- clear-build-folder task -------------
gulp.task('clean', function(cb) {
    return rimraf(dest, cb);
});


// -------- Default Task -----------
gulp.task('default', gulp.series(
    'clean',
    gulp.parallel (
        'pug',
        'sass',
        'scripts',
        'svg',
        'fonts'
    ),
    gulp.parallel(
        'watch',
        'serve'
    )
));
