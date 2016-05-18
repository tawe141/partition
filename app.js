 var express = require('express');
 var path = require('path');
 var app = express();

 app.use('/css', express.static('dist/css'));
 app.use('/img', express.static('dist/img'));
 app.use('/js', express.static('dist/js'));

 app.get('/test', function(req, res) {
     res.send('this still works!');
 });

 app.get('/dist/:year/:month/:day/:title', function(req, res) {
     // TODO: conditional for partial rendering vs full rendering
     var filename = req.params.title;
     if(!filename.includes('.html')) {
         filename = filename + '.html'
     }
     res.sendFile(path.join(__dirname, 'dist', req.params.year, req.params.month, req.params.day, filename));
 })

 app.listen(3000, function() {
     console.log('Listening on port 3000...');
 })
