// import environment vars
require('dotenv').config();

var gulp = require('gulp');
var gutil = require('gulp-util');
var tap = require('gulp-tap');
var wrap = require('gulp-wrap');
var markdown = require('gulp-markdown');
var frontMatter = require('gulp-front-matter');
var MarkdownIt = require('markdown-it');
var alerts = require('markdown-it-alerts');
var path = require('path');
var fs = require('graceful-fs');
var mkdirp = require('mkdirp');
var sass = require('gulp-sass');
var nunjucksRender = require('gulp-nunjucks-render');
var mongoose = require('mongoose');
var hash = require('string-hash');
var model = require('./models/mongoose_schema')(mongoose);

var md = new MarkdownIt();

// TODO: use gulp pump if you get useless errors

md.use(alerts);


function dbconnect(cb) {
    mongoose.connect(process.env.DB_URI);

    var db = mongoose.connection;

    db.on('error', console.error.bind(console, 'connection error: '));
    db.once('open', function() {
        gutil.log('MongoDB connection successful');
        return cb();
    });
    return cb();
};

function markdownToHtml(file) {
    var result = md.render(file.contents.toString());
    file.contents = new Buffer(result);
    file.path = gutil.replaceExtension(file.path, '.html');
    return;
}

function handleDestForPost(file) {
    var name = file.relative.split('\\');

    name.splice(-1, 1);

    var catpath = '';
    if(name) {
        name.forEach(function(val) {
            catpath = path.join(catpath, val);
        });
    }

    var date = new Date(Date.parse(file.frontMatter.date));
    var localpath = path.join('/dist', catpath, date.getFullYear().toString(), date.getMonth().toString(), date.getDate().toString());
    var pathName = path.join(__dirname, localpath);

    mkdirp.sync(pathName);

    var filename = file.frontMatter.title.toLowerCase().replace(/ /g, "_") + ".html";
    fs.writeFile(path.join(pathName, filename), file.contents, function(err, data) {
        if (err) throw err;
    })
    return;
}

function handleDestForStatic(file) {
    var pathName = path.join(__dirname, 'dist');
    if(!fs.existsSync(pathName)) {
        mkdirp.sync(pathName);
    }
    fs.writeFile(path.join(pathName, file.name), file.contents, function(err, data) {
        if (err) throw err;
    })
    return;
}

function storeInDB(file) {

    var Post = model.Post;

    if(file.frontMatter.hidden) {
        var new_post = new Post(
            {
                author: file.frontMatter.author,
                title: file.frontMatter.title,
                date: Date.parse(file.frontMatter.date),
                markdown: file.contents,
                tags: file.frontMatter.tags,
                series: file.frontMatter.series,
                hash: hash(file.contents.toString()),
                hidden: true
            }
        )
    }

    else {
        var new_post = new Post(
            {
                author: file.frontMatter.author,
                title: file.frontMatter.title,
                date: Date.parse(file.frontMatter.date),
                markdown: file.contents,
                tags: file.frontMatter.tags,
                series: file.frontMatter.series,
                hash: hash(file.contents.toString())
            }
        )
    }

    Post.findOne({ 'title' : new_post.title }, function(err, result) {
        if (err) {
            throw err;
        }

        if(result === null) {
            new_post.save(function(err) {
                if(err) return console.error(err);
            })
            gutil.log('Saved post named "' + new_post.title + '" in database');
        }
        else {
            // gutil.log(result.hash);
            if(result.hash !== new_post.hash) {
                result.update(
                    {
                        author: file.frontMatter.author,
                        title: file.frontMatter.title,
                        date: Date.parse(file.frontMatter.date),
                        markdown: file.contents,
                        tags: file.frontMatter.tags,
                        series: file.frontMatter.series,
                        hash: hash(file.contents.toString())
                    }
                );
                gutil.log('Updated post named "' + new_post.title + '" in database');
            }
            else {
                gutil.log('Post named "' + new_post.title + '" already exists in database');
            }
        }
    })

    return;
};

function handle_mds(cb) {
    gulp.src('./src/md/**/*.md')
        .pipe(frontMatter())
        .pipe(tap(markdownToHtml))
        .pipe(tap(storeInDB))
        .pipe(wrap(function(data) {
            return fs.readFileSync('./layouts/' + data.file.frontMatter.layout).toString()
        }, null, {engine: 'nunjucks'}))
        .pipe(tap(handleDestForPost));
    return cb();
};

function copy_static() {
    return gulp.src(['./src/static/*.nunjucks', './src/static/*.html'])
        .pipe(nunjucksRender({
            path: './layouts'
        }))
        .pipe(gulp.dest('./dist'));
};

function copy(cb) {
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
    gulp.src('./img/*')
        .pipe(gulp.dest('./dist/img'));
    return cb();
};

function compile_sass() {
    return gulp.src('./styles/main.scss')
        .pipe(sass().on('error', sass.logError))
        .pipe(gulp.dest('./dist/css'));
};

function scripts() {
    return gulp.src('./scripts/*.js')
        .pipe(gulp.dest('./dist/js'));
};

exports.dbconnect = dbconnect;
exports.handle_mds = handle_mds;
exports.copy_static = copy_static;
exports.copy = copy;
exports.compile_sass = compile_sass;
exports.scripts = scripts;

var build = gulp.parallel(gulp.series(dbconnect, handle_mds), copy_static, copy, compile_sass, scripts)

gulp.task('build', build);

gulp.task('default', build);
