 var express = require('express');
 var app = express();

 app.use(express.static('dist'));

 app.get('/test', function(req, res) {
     res.send('this still works!');
 })

 app.listen(3000, function() {
     console.log('Listening on port 3000...');
 })
