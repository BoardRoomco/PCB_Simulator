var gulp = require('gulp');
var sourcemaps = require('gulp-sourcemaps');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var browserify = require('browserify');
var watchify = require('watchify');
var babel = require('babelify');
var jade = require('gulp-jade');
var connect = require('gulp-connect');
var uglify = require('gulp-uglify');
var envify = require('envify/custom');
var fs = require('fs');
var path = require('path');

var buildDir = 'build';
var devBuildDir = 'dev_build';

function handleError(err) {
  console.error(err);
  this.emit('end');
}

function templates(outDir) {
  return function() {
    // Process Jade files
    gulp.src('public/*.jade')
      .pipe(jade({
        pretty: true
      }))
      .pipe(gulp.dest(outDir))
      .pipe(connect.reload());
    
    // Copy HTML files directly
    return gulp.src('public/*.html')
      .pipe(gulp.dest(outDir))
      .pipe(connect.reload());
  };
}

function styles(outDir) {
  return function() {
    return gulp.src('public/*.css')
      .pipe(gulp.dest(outDir))
      .pipe(connect.reload());
  };
}

function vendor(outDir) {
  return function() {
    return gulp.src('public/vendor/**/*')
      .pipe(gulp.dest(outDir + '/vendor'));
  };
}

function icons(outDir) {
  return function() {
    return gulp.src('public/icons/**/*')
      .pipe(gulp.dest(outDir + '/icons'));
  };
}

function staticFiles(outDir) {
  return function() {
    // Copy JSON files only, exclude MD files
    gulp.src(['public/*.json'])
      .pipe(gulp.dest(outDir));
    
    // Copy .nojekyll file
    return gulp.src('.nojekyll')
      .pipe(gulp.dest(outDir));
  };
}

gulp.task('templates', templates(devBuildDir));
gulp.task('styles', styles(devBuildDir));
gulp.task('vendor', vendor(devBuildDir));
gulp.task('icons', icons(devBuildDir));
gulp.task('static', staticFiles(devBuildDir));

function compile(opts) {
  var bundler = watchify(
    browserify('./public/main.js', { debug: true })
      .transform(babel.configure({
        presets: ['es2015', 'react', 'stage-2'],
        plugins: []
      }))
      .transform(envify({
        NODE_ENV: 'development'
      }), {global: true})
  );

  function rebundle() {
    return bundler.bundle()
      .on('error', function(err) {
        console.error(err.toString());
        this.emit('end');
      })
      .pipe(source('main.js'))
      .pipe(buffer())
      .pipe(sourcemaps.init({ loadMaps: true }))
      .pipe(sourcemaps.write('./'))
      .pipe(gulp.dest(devBuildDir))
      .on('end', function() {
        connect.reload();
      });
  }

  if (opts.watch) {
    bundler.on('update', function() {
      console.log('-> bundling...');
      rebundle();
    });
  }

  return rebundle();
}

gulp.task('connect', function(done) {
  connect.server({
    root: devBuildDir,
    livereload: true,
    fallback: path.join(devBuildDir, 'index.html'),
    port: 3000,
    middleware: function(connect, opt) {
      return [
        function(req, res, next) {
          res.setHeader('Access-Control-Allow-Origin', '*');
          next();
        }
      ];
    }
  });
  done();
});

gulp.task('watch', function(done) {
  gulp.watch('public/*.jade', gulp.series('templates'));
  gulp.watch('public/*.html', gulp.series('templates'));
  gulp.watch('public/*.css', gulp.series('styles'));
  gulp.watch('public/vendor/**/*', gulp.series('vendor'));
  gulp.watch('public/icons/**/*', gulp.series('icons'));
  gulp.watch(['public/*.json', 'public/*.md'], gulp.series('static'));
  
  compile({watch: true});
  done();
});

function buildJs() {
  return new Promise((resolve, reject) => {
    browserify('./public/main.js')
      .transform(envify({
        NODE_ENV: 'production'
      }), {global: true})
      .transform(babel.configure({
        presets: ['es2015', 'react', 'stage-2'],
        plugins: []
      }))
      .bundle()
      .on('error', reject)
      .pipe(source('main.js'))
      .pipe(buffer())
      .pipe(uglify())
      .pipe(gulp.dest(buildDir))
      .on('end', resolve);
  });
}

gulp.task('build', gulp.series(function(done) {
  // Create build directory if it doesn't exist
  if (!fs.existsSync(buildDir)) {
    fs.mkdirSync(buildDir);
  }
  
  // Create .nojekyll file in build directory
  fs.writeFileSync(path.join(buildDir, '.nojekyll'), '');
  
  // Run all build tasks in parallel
  Promise.all([
    templates(buildDir)(),
    styles(buildDir)(),
    vendor(buildDir)(),
    icons(buildDir)(),
    staticFiles(buildDir)(),
    buildJs()
  ]).then(() => {
    // Copy index.html directly if it exists
    if (fs.existsSync('public/index.html')) {
      fs.copyFileSync('public/index.html', path.join(buildDir, 'index.html'));
    }
    done();
  }).catch((err) => {
    console.error('Build error:', err);
    done(err);
  });
}));

gulp.task('default', gulp.series(
  gulp.parallel('templates', 'styles', 'vendor', 'icons', 'static'),
  'connect',
  'watch'
));

