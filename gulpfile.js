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
    browserSync     = require('browser-sync').create();

// Paths
var paths = {
    pug : {
        location    : src + 'template/**/*.pug',
        compiled    : src + 'template/_pages/*.pug',
        destination : dest
    },

    scss : {
        location    : src + 'scss/**/*.scss',
        entryPoint  : src + 'scss/style.scss',
        destination : dest + 'css'
    },

    js : {
        location    : src + 'js/**/*.js',
        entryPoint  : src + 'js/main.js',
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
        .pipe(gulp.dest(paths.pug.destination));
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
      // .pipe(sass({style: 'compressed'}))
      // .pipe(cssnano())
      // .pipe(rename({suffix: '.min'}))

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
        .pipe(uglify())
        .pipe(rename('main.min.js'))
        .pipe(gulp.dest(paths.js.destination));
});



// --------- images task --------------
gulp.task('images', function() {
    return gulp.src(src + 'images/**/*')
        .pipe(cache(imagemin({ optimizationLevel: 5, progressive: true, interlaced: true })))
        .pipe(gulp.dest(dest + 'img'));
});

///////////
gulp.task('browserSync', function() {
    browserSync.init({
        server: {
            baseDir: root
        }
    })
});


// gulp.task('bower-js', function() {
//     var mainFiles = mainBowerFiles();
//     console.log(mainFiles);
//     return gulp.src(mainFiles)
//         .pipe(filter('**/*.js'))
//         .pipe(gulp.dest(src + 'js'));
// });

// Concatenate & Minify JS
// gulp.task('scripts', function() {
//     return gulp.src(src + 'js/*.js')
//         .pipe(plumber())
//         .pipe(concat('app.js'))
//         .pipe(rename({suffix: '.min'}))
//         .pipe(uglify())
//         .pipe(gulp.dest(dest + 'js'))
//         .pipe(browserSync.reload({
//             stream: true
//         }));
// });

// Watch for changes in files
gulp.task('watch', function() {
    gulp.watch(paths.pug.location, gulp.series('pug'));
    gulp.watch(paths.scss.location, gulp.series('sass'));
    gulp.watch(paths.js.location, gulp.series('scripts'));
    // // Watch bower vendors
    // gulp.watch('../vendor/**/*.js', ['bower-js']);
    //
    // // Watch .html files
    // gulp.watch(root + '*.html', browserSync.reload);
    //
    // // Watch .js files
    // gulp.watch(src + 'js/*.js', ['scripts']);
    //
    // // Watch .scss files
    // gulp.watch(src + 'scss/**/*.scss', ['sass']);
    //
    // // Watch image files
    // gulp.watch(src + 'images/**/*', ['images']);
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
// gulp.task('default', ['pug', 'sass', 'browserSync', 'watch', 'serve']);
gulp.task('default', gulp.series(
    'clean',
    gulp.parallel (
        'pug',
        'sass',
        'scripts'
    ),
    gulp.parallel(
        'watch',
        'serve'
    )
));
