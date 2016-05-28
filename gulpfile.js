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

var md = new MarkdownIt();

gutil.log(__dirname);

// TODO: use gulp pump if you get useless errors

md.use(alerts);

// open a mongo connection
mongoose.connect(process.env.DB_URI);

var db = mongoose.connection;

db.on('error', console.error.bind(console, 'connection error: '));
db.once('open', function() {
    gutil.log('MongoDB connection successful');
})

// import schema
var model = require('./models/mongoose_schema')(mongoose);

// ---

function markdownToHtml(file) {
    var result = md.render(file.contents.toString());
    file.contents = new Buffer(result);
    file.path = gutil.replaceExtension(file.path, '.html');
    return;
}

function handleDestForPost(file) {
    var date = new Date(Date.parse(file.frontMatter.date));
    var pathName = path.join(__dirname, 'dist', date.getFullYear().toString(), date.getMonth().toString(), date.getDate().toString());
    
    // if(!fs.existsSync(pathName)) {
    //     mkdirp(pathName);
    // }
    
    mkdirp(pathName);
    var filename = file.frontMatter.title.toLowerCase().replace(/ /g, "_") + ".html";
    fs.writeFile(path.join(pathName, filename), file.contents, function(err, data) {
        if (err) throw err;
    })
    return;
}

function handleDestForStatic(file) {
    var pathName = path.join(__dirname, 'dist');
    if(!fs.existsSync(pathName)) {
        mkdirp(pathName);
    }
    fs.writeFile(path.join(pathName, file.name), file.contents, function(err, data) {
        if (err) throw err;
    })
    return;
}

function storeInDB(file) {
    // gutil.log(file.frontMatter);

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

    if(Post.findOne({ 'title' : new_post.title }, function(err, result) {
        if(result === null) {
            new_post.save(function(err) {
                if(err) return console.error(err);
            })
            gutil.log('Saved post named "' + new_post.title + '"');
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
                gutil.log('Updated post named "' + new_post.title + '"');
            }
            else {
                gutil.log('Post named "' + new_post.title + '" already exists');
            }
        }
    }))

    return;
}

gulp.task('default', function() {
    // Post.collection.remove();
    return gulp.src('./src/md/*.md')
        .pipe(frontMatter())
        .pipe(tap(markdownToHtml))
        .pipe(tap(storeInDB))
        .pipe(wrap(function(data) {
            return fs.readFileSync('./layouts/' + data.file.frontMatter.layout).toString()
        }, null, {engine: 'nunjucks'}))
        .pipe(tap(handleDestForPost));
});

gulp.task('static', function() {
    return gulp.src('./src/static/*.html')
        .pipe(nunjucksRender({
            path: './layouts'
        }))
        .pipe(gulp.dest('./dist'));
})

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
    gulp.src('./img/*')
        .pipe(gulp.dest('./dist/img'));
});

gulp.task('sass', function() {
    gulp.src('./styles/main.scss')
        .pipe(sass().on('error', sass.logError))
        .pipe(gulp.dest('./dist/css'));
});

gulp.task('scripts', function() {
    gulp.src('./scripts/*.js')
        .pipe(gulp.dest('./dist/js'));
});


gulp. task('watch', function() {
    gulp.watch('./layouts/*', ['default', 'static']);
    gulp.watch('./scripts/*', ['scripts']);
    gulp.watch('./src/md/*', ['default']);
    gulp.watch('./src/static/*', ['static']);
    gulp.watch('./styles/*.scss', ['sass']);
})
