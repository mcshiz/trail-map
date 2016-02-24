'use strict';

var express = require('express'),
    exphbs  = require('express-handlebars'); // "express-handlebars"

var app = express();
app.set('view engine', '.hbs');
app.set('views', __dirname +'/app/views/layouts');
app.use('/app/', express.static(__dirname + '/app'));
app.engine('.hbs', exphbs({layoutsDir: __dirname +'/app/views' , defaultLayout: 'main.hbs', extname: '.hbs'}));



app.get('/', function (req, res) {
    res.render('index');
});
app.get(/^\/trail\/(.+)$/, function (req, res) {
    res.render('single');
});

app.listen(3000, function () {
    console.log('express-handlebars example server listening on: 3000');
});
