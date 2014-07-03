var flatiron = require('flatiron');
var util = require('util');
var fs= require('fs');


exports = module.exports = function(app) {

var alertMsg = '';

app.router.get('/', function () {
  app.log.info('home page');
    this.res.writeHead(200, { 'Content-Type': 'text/html' })
    this.res.write("Namah SHivaya");
    this.res.end();
});

app.router.path('/voicemail/:filePath', function(filePath) {
  var res = this.res;
  this.get(function(filePath) {
  filePath = '/usr/share/freeswitch/voicemail/'+filePath+'.wav';
  if (fs.existsSync(filePath))
  { 
    console.log(filePath)
    var stat = fs.statSync(filePath);
    var res = this.res;
    this.res.writeHead(200, {
     'Content-Type': 'audio/mpeg',
      'Content-Length': stat.size
     });
    var readStream = fs.createReadStream(filePath);
    readStream.on('data', function(data) {
    res.write(data);
    });

    readStream.on('end', function() {
    res.end();
    });
  } 
 });
});

app.router.path('/recording/:filePath', function(filePath) {
  var res = this.res;
  this.get(function(filePath) {
  filePath = '/usr/share/freeswitch/recordings/'+filePath+'.wav';
  if (fs.existsSync(filePath))
  { 
    console.log(filePath)
    var stat = fs.statSync(filePath);
    var res = this.res;
    this.res.writeHead(200, {
     'Content-Type': 'audio/mpeg',
      'Content-Length': stat.size
     });
    var readStream = fs.createReadStream(filePath);
    readStream.on('data', function(data) {
    res.write(data);
    });

    readStream.on('end', function() {
    res.end();
    });
  }
  else{
    this.res.writeHead(200);
    this.res.write("Sorry No audio was present !!!");
    this.res.end();
 } 
 });
});


}
