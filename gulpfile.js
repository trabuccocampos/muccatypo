// modified by aat—c
/**
*
* npm install gulp
* npm install --save-dev browser-sync gulp-plumber gulp-sass gulp-sourcemaps gulp-autoprefixer gulp-util gulp-rename gulp-shell gulp-concat gulp-filter gulp-flatten gulp-watch gulp-size minimist
*
* Navigate to your project directory and run: gulp --url "https://your-shop.myshopify.com/?key=xxx"
*
*/

var gulp          = require('gulp');
var browserSync   = require('browser-sync').create();
var plumber       = require('gulp-plumber');
var sass          = require('gulp-sass');
var autoprefixer  = require('gulp-autoprefixer');
var sourcemaps    = require('gulp-sourcemaps');
var gutil         = require('gulp-util');
var shell         = require('gulp-shell');
var filter        = require('gulp-filter');
var concat        = require('gulp-concat');
var rename        = require('gulp-rename');
var watch         = require('gulp-watch');
var flatten       = require('gulp-flatten');
var size          = require('gulp-size');

var minimist    = require('minimist');

var knownOptions = {
  string: 'url',
  default: { url: process.env.NODE_ENV }
};

var options = minimist(process.argv.slice(2), knownOptions);

function isChanged(file) {
    return file.event === 'change';
}

var filterChanged = filter(isChanged);

gulp.task('serve', function() {
  browserSync.init({
    proxy: options.url,
    browser: "safari",
    injectChanges: false, // cause of css being served from cdn
  });
;
  gulp.watch([
    './sass/**/*.scss',
    './assets/timber.scss.liquid'
  ], ['sass']);
});

// Compile sass into CSS & auto-inject into browsers
gulp.task('sass-pre', function() {
  return gulp.src("./dev/sass/*.scss")
    .pipe(plumber(function(error) {
        gutil.log(gutil.colors.red(error.message));
        gutil.beep();
        this.emit('end');
    }))
    .pipe(sass())
    .pipe(autoprefixer(({
        browsers: ['last 2 versions'],
        cascade: false
    })))
    .pipe(rename('style.scss.liquid'))
    .pipe(gulp.dest('assets/'));
});

gulp.task('sass', ['sass-pre'], function() {
  return gulp.src(['./assets/timber.scss.liquid','./assets/style.scss.liquid'])
    // .pipe(sourcemap.init())
    .pipe(concat('all.scss.liquid'))
    // .pipe(sourcemap.write())
    .pipe(gulp.dest('assets/'))
    .pipe(size())
    .pipe(shell([
        'theme upload <%= f(file.path) %>'
    ], {
      templateData: {
        f: function (s) {
          // cut away absolute path of working dir for 'theme' cmd to work
          return s.replace(process.cwd() + '/', '')
        }
      }
    }))
    .pipe(browserSync.stream());
});


gulp.task('copy-fonts', function () {
  return gulp.src('./dev/fonts/**/*')
      .pipe(flatten())
      .pipe(gulp.dest('./assets'))
      .pipe(size())
      .pipe(shell([
          'theme upload <%= f(file.path) %>'
      ], {
        templateData: {
          f: function (s) {
            // cut away absolute path of working dir for 'theme' cmd to work
            return s.replace(process.cwd() + '/', '')
          }
        }
      }))
      .pipe(browserSync.stream());
});

gulp.task('liquid', function() {
  return gulp.src('**/*.liquid')
    .pipe(watch('**/*.liquid'))
    .pipe(filterChanged)
    .pipe(shell([
      'theme upload <%= f(file.path) %>'
    ], {
      templateData: {
        f: function (s) {
          // cut away absolute path of working dir for 'theme' cmd to work
          return s.replace(process.cwd() + '/', '')
        }
      }
    }))
    .pipe(browserSync.stream());
});

gulp.task('default', ['serve', 'liquid']);
