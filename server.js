'use strict';

var express = require('express'),
    exphbs  = require('express-handlebars'),
    firebase = require('firebase'),
    nodemailer = require('nodemailer'),
    bodyParser = require('body-parser');

var port = process.env.PORT || 3000;
var app = express();
app.set('view engine', '.hbs');
app.set('views', __dirname +'/app/views/layouts');
app.set('layoutsDir', __dirname +'/app/views/layouts');
app.set('partialsDir', __dirname +'/app/views/partials');
app.use('/app/', express.static(__dirname + '/app'));
app.engine('.hbs', exphbs({partialsDir:__dirname +'/app/views/partials', layoutsDir: __dirname +'/app/views/' , defaultLayout: 'main.hbs', extname: '.hbs'}));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.get('/', function (req, res) {
    res.render('index');
});
app.get(/^(.+)$/, function (req, res) {
    if (req.url != '/favicon.ico' && req.url != '/contact') {
        var trailName = decodeURI(req.url).replace("/", "");
        var ref = new Firebase("https://shasta-bike-map.firebaseio.com/"+trailName+"/details/");
        ref.once("value", function(snapshot) {
            var trailDetails = snapshot.val();
            res.render('single', {
                trailName: trailName,
                rating: trailDetails.rating,
                length: trailDetails['length'],
                description: trailDetails.description,
                difficulty: trailDetails.difficulty,
                trailhead: trailDetails.trailhead
            });
        });
    }
});

app.post('/contact', function (req, res) {
    var mailOpts, smtpTrans;
console.log(req.body);
    var transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: "mccabj0210@gmail.com",
                pass: "bR1@n84#"
            }
        });
    //Mail options
    var name = req.body.first_name + " " + req.body.last_name;
    var mailOptions = {
        from: name +' <'+req.body.email+'>',
        to: 'mccabj0210@gmail.com',
        subject: 'Shasta Bike Trails contact form',
        text: req.body.comments
    };
    transporter.sendMail(mailOptions, function(error, info){
        if(error){
           res.send(error);
        }
        res.end('{"success" : "Email Sent Successfully", "status" : 200}');
    });
});



app.listen(port, function () {
    console.log('express-handlebars example server listening on: 3000');
});
