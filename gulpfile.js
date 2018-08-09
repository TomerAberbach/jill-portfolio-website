const fs = require('fs')
const path = require('path')
const del = require('del')

const gulp = require('gulp')
const favicon = require('gulp-real-favicon')
const frontMatter = require('gulp-front-matter')
const hb = require('gulp-hb')
const helpers = require('handlebars-helpers')
const htmlmin = require('gulp-htmlmin')
const through = require('through2')
const rename = require('gulp-rename')
const postcss = require('gulp-postcss')
const autoprefixer = require('autoprefixer')
const cssnano = require('cssnano')
const imagemin = require('gulp-imagemin')
const webserver = require('gulp-webserver')
const folders = require('gulp-folders')
const titleize = require('titleize')

const clean = () => del(['./dist'])
const index = () =>
  gulp.src('./src/layout/index.hbs')
    .pipe(frontMatter({property: 'data', remove: true}))
    .pipe(rename('index.html'))
    .pipe(hb().helpers(helpers).data({
      sections: fs.readdirSync('./src/img')
        .filter(name => fs.lstatSync(path.join('./src/img', name)).isDirectory())
        .sort((a, b) => a.localeCompare(b))
    }))
    .pipe(through.obj((file, enc, cb) => {
      file.data.body = file.contents
      gulp.src('./src/layout/html.hbs')
        .pipe(frontMatter({property: 'data', remove: true}))
        .pipe(rename('index.html'))
        .pipe(hb().helpers(helpers).data(file.data))
        .pipe(favicon.injectFaviconMarkups(JSON.parse(fs.readFileSync('./favicon.json')).favicon.html_code))
        .pipe(htmlmin({collapseBooleanAttributes: true, collapseWhitespace: true}))
        .pipe(gulp.dest('./dist'))
        .on('end', cb)
    }))

const pages = cb =>
  folders('./src/img', folder =>
    gulp.src('./src/layout/page.hbs')
      .pipe(rename(path.join('pages', `${folder}.html`)))
      .pipe(hb().helpers(helpers).data({
        subtitle: folder,
        images: fs.readdirSync(path.join('./src/img', folder)).map(name => path.join('img', folder, name))
      }))
      .pipe(through.obj((file, enc, cb) => {
        file.data = {
          subtitle: titleize(folder.replace('-', ' ')),
          body: file.contents
        }
        gulp.src('./src/layout/html.hbs')
          .pipe(frontMatter({property: 'data', remove: true}))
          .pipe(rename(path.join('pages', `${folder}.html`)))
          .pipe(hb().helpers(helpers).data(file.data))
          .pipe(favicon.injectFaviconMarkups(JSON.parse(fs.readFileSync('./favicon.json')).favicon.html_code))
          .pipe(htmlmin({collapseBooleanAttributes: true, collapseWhitespace: true}))
          .pipe(gulp.dest('./dist'))
          .on('end', cb)
      }))
  )(cb).on('end', cb)

const css = () =>
  gulp.src('./src/**/*.css')
    .pipe(postcss([
      autoprefixer,
      cssnano
    ]))
    .pipe(gulp.dest('./dist'))

const img = () =>
  gulp.src('./src/**/*.{png,svg,jpg,jpeg,gif}')
    .pipe(imagemin([
      imagemin.gifsicle(),
      imagemin.jpegtran(),
      imagemin.optipng(),
      imagemin.svgo({plugins: [{removeTitle: false}]})
    ]))
    .pipe(gulp.dest('./dist'))

const favicons = cb =>
  favicon.generateFavicon({
    masterPicture: './src/img/icon.png',
    dest: './dist/favicon',
    iconsPath: 'favicon/',
    design: {
      ios: {
        pictureAspect: 'backgroundAndMargin',
        backgroundColor: '#ffffff',
        margin: '14%',
        assets: {
          ios6AndPriorIcons: false,
          ios7AndLaterIcons: false,
          precomposedIcons: false,
          declareOnlyDefaultIcon: true
        }
      },
      desktopBrowser: {},
      windows: {
        pictureAspect: 'noChange',
        backgroundColor: '#da532c',
        onConflict: 'override',
        assets: {
          windows80Ie10Tile: false,
          windows10Ie11EdgeTiles: {
            small: false,
            medium: true,
            big: false,
            rectangle: false
          }
        }
      },
      androidChrome: {
        pictureAspect: 'shadow',
        themeColor: '#ffffff',
        manifest: {
          display: 'standalone',
          orientation: 'notSet',
          onConflict: 'override',
          declared: true
        },
        assets: {
          legacyIcon: false,
          lowResolutionIcons: false
        }
      },
      safariPinnedTab: {
        pictureAspect: 'silhouette',
        themeColor: '#5bbad5'
      }
    },
    settings: {
      scalingAlgorithm: 'Mitchell',
      errorOnImageTooSmall: false,
      readmeFile: false,
      htmlCodeFile: false,
      usePathAsIs: false
    },
    markupFile: './favicon.json'
  }, cb)

const def = gulp.series(clean, gulp.parallel(gulp.series(favicons, gulp.parallel(index, pages)), css, img))
gulp.task('default', def)

const serve = () =>
  gulp.src('./dist')
    .pipe(webserver({
      port: 8888,
      livereload: true
    }))

gulp.task('serve', gulp.series(def, serve))
gulp.task('watch', gulp.series(pages, serve, () => {
  gulp.watch('./src/layout/index.hbs', index)
  gulp.watch('./src/layout/page.hbs', pages)
  gulp.watch('./src/layout/html.hbs', gulp.parallel(index, pages))
  gulp.watch('./src/**.css', css)
  gulp.watch('./src/img/**/*', gulp.parallel(img, favicons))
}))
