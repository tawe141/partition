var marked = require('marked');
var path = require('path');
var renderer = new marked.Renderer();

module.exports({
    entry: './src/entry.js',

    output: {
        filename: 'bundle.js',
        path: path.join(__dirname, 'dist')
    },

    markdownLoader: {
        renderer: renderer
    },

    module: {
        loaders: [
            { test: /\.md$/, loader: 'html!markdown'}
        ]
    }
})
