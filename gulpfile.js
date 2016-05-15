var gulp = require('gulp');
var gutil = require('gulp-util');
var tap = require('gulp-tap');
var wrap = require('gulp-wrap');
var markdown = require('gulp-markdown');
var frontMatter = require('gulp-front-matter');
var MarkdownIt = require('markdown-it');
var alerts = require('markdown-it-alerts');
var path = require('path');
var fs = require('fs');
var mkdirp = require('mkdirp');
var sass = require('gulp-sass');

var md = new MarkdownIt();

// TODO: use gulp pump if you get useless errors

md.use(alerts);
// md.renderer.rules.extension = function()

function markdownToHtml(file) {
    var result = md.render(file.contents.toString());
    file.contents = new Buffer(result);
    file.path = gutil.replaceExtension(file.path, '.html');
    return;
}

function handleDest(file) {
    pathName = path.join(__dirname, 'dist', file.frontMatter.year.toString(), file.frontMatter.month.toString(), file.frontMatter.day.toString());
    // console.log(file);
    if(!fs.existsSync(pathName)) {
        mkdirp(pathName);
    }
    filename = file.frontMatter.title.toLowerCase().replace(/ /g, "_") + ".html";
    fs.writeFile(path.join(pathName, filename), file.contents, function(err, data) {
        if (err) throw err;
    })
    return;
}

gulp.task('default', function() {
    gulp.src('./src/md/*')
        .pipe(frontMatter())
        .pipe(tap(markdownToHtml))
        .pipe(wrap(function(data) {
            // gutil.log(data.file);
            return fs.readFileSync('./layouts/' + data.file.frontMatter.layout).toString()
        }, null, {engine: 'nunjucks'}))
        .pipe(tap(handleDest));
});

gulp.task('copy', function() {
    gulp.src('./node_modules/bootstrap/dist/js/bootstrap.min.js')
        .pipe(gulp.dest('./dist/js'));
    gulp.src('./node_modules/tether/dist/js/tether.min.js')
        .pipe(gulp.dest('./dist/js'));
    gulp.src('./node_modules/bootstrap/dist/css/bootstrap.min.css')
        .pipe(gulp.dest('./dist/css'));
    gulp.src('./node_modules/bootstrap/dist/css/bootstrap.min.css.map')
        .pipe(gulp.dest('./dist/css'));
    gulp.src('./node_modules/tether/dist/css/tether.min.css')
        .pipe(gulp.dest('./dist/css'));
});

gulp.task('sass', function() {
    gulp.src('./styles/main.scss')
        .pipe(sass().on('error', sass.logError))
        .pipe(gulp.dest('./dist/css'));
});

gulp.task('scripts', function() {
    gulp.src('./scripts/*.js')
        .pipe(gulp.dest('./dist/js'));
})
