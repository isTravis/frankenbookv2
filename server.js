#!/usr/bin/env node
var connect = require('connect'),
	colors = require('colors'),
	argv = require('optimist').argv,
	portfinder = require('portfinder');

var port = argv.p,
	logger = argv.l,
	log = console.log;

if (!argv.p) {
	portfinder.basePort = 8080;
	portfinder.getPort(function (err, port) {
	if (err) throw err;
	//listen(port);
	});
} else {
	//listen(port);
}



function listen(port) {
	var server = connect();
		server.use(connect.static(__dirname+ "/public"))
		
		if(!logger) server.use(connect.logger(logger))
		
		server.listen(port);
	
	log('Starting up Server, serving '.yellow
		+ __dirname.green
		+ ' on port: '.yellow
		+ port.toString().cyan);
	log('Hit CTRL-C to stop the server');
	
}
	 
	

process.on('SIGINT', function () {
	log('http-server stopped.'.red);
	process.exit();
});

var fs = require('fs');
var AWS = require('aws-sdk');
AWS.config.loadFromPath('./credentials.json');
var s3 = new AWS.S3();

var express = require("express");
var app = express();
var bodyParser = require('body-parser');

var errorHandler = require('errorhandler');
var methodOverride = require('method-override');
var hostname = process.env.HOSTNAME || 'localhost';
var port = 8080;

var extract = require('extract-zip')

app.use(methodOverride());
//app.use(bodyParser());
app.use(require('connect').bodyParser());

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))

// parse application/json
app.use(bodyParser.json())

app.use(express.static(__dirname + '/public'));
app.use(errorHandler());

app.get("/", function (req, res) {
      res.redirect("/index.html");
});

app.post('/uploadFile', function(req, res){
      //console.log(req.body);
        var intname = req.body.fileInput;
        var filename = req.files.input.name;
        var fileType =  req.files.input.type;
        var tmpPath = req.files.input.path;
        var s3Path = '/' + intname;
        
        fs.readFile(tmpPath, function (err, data) {
            var params = {
                Bucket:'ame570lemos',
                ACL:'public-read',
                Key:intname,
                Body: data,
                ServerSideEncryption : 'AES256'
            };
            s3.putObject(params, function(err, data) {
                console.log(err);
                res.end("success");
            });
        });
  });
  
  app.get('/loadBook', function(req, res){    
    var info = req.query;
    var s3Params = {
        Bucket: 'ame570lemos',
        Key: info.book
    };
    s3.getObject(s3Params, function(err, data) {
        if (err === null) {
            //console.log("Saving file...")          
            fs = require('fs');
            fs.writeFile('./public/books/' + info.book, data.Body, function(err) {
                //console.log("Extracting file...")
                
                var filename = info.book;
                var bookName = filename.split(".");
                bookName = bookName[0];
                
                extract('./public/books/' + info.book, {dir: './public/books/'+ bookName}, function (err) {
                    // extraction is complete. make sure to handle the error
                    //res.redirect("/single.html");
                })
            })
        } else {
            res.status(500).send(err);
        }
    });
});


console.log("Simple static server listening at http://" + hostname + ":" + port);
app.listen(port);