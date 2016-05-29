#!/path/to/node

var repl = require('repl').start({prompt: 'partition_tinker >> '});

require('dotenv').config();
var mongoose = require('mongoose');

var modules = [
    'mongoose',
    'fs', 
    'path'
];

modules.forEach(function(moduleName) {
    repl.context[moduleName] = require(moduleName);
});

mongoose.connect(process.env.DB_URI);
var model = require('./models/mongoose_schema')(mongoose);
repl.context.db = mongoose.connection;
repl.context.model = model;
repl.context.Post = model.Post;
