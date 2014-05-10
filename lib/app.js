var flatiron = require('flatiron'),
    app = flatiron.app,
    path = require('path'),
    mongoose = require('mongoose'),
    dl  = require('delivery');

    var io = require('socket.io').listen(9030, { log: false });
    var io_client = require('socket.io-client');
    var fs = require('fs');
    var fstream = require('fstream');

//setup mongoose
app.db = mongoose.createConnection(app.config.get('mongoUri') || 'mongodb://localhost/freeswitch');
app.db.on('error', console.error.bind(console, 'mongoose connection error: '));
app.db.once('open', function () {});
require('./models/did')(app, mongoose);
require('./models/user')(app, mongoose);
require('./models/account_detail')(app, mongoose);
require('./models/call_detail')(app, mongoose);
app.db.models.did.find().lean().exec(function (err, did) {
console.log(did);
});
/* app.db.models.call_detail.find({flag : '0'}).lean().limit("2").exec(function (err, cdr) {
 console.log(cdr);
 app.db.models.call_detail.update({_id: cdr[1]._id}, {$set: {flag:"1"}}, {upsert: true}).exec(function (err, userobj) {
   console.log(err);
   console.log(userobj);
   });
});*/
app.use(flatiron.plugins.http, {buffer: false});

app.start(9011, function (err) {
  if (err) {
    throw err;
  }



  io.sockets.on('connection', function (socket) {
        console.log("Namah Shivaya!!");
    socket.on('File Upload Done', function (data) {
        console.log(data);
        data =JSON.parse(data);
        console.log(data[0][1]);
        console.log(data[1][1]);
        console.log(data.length);
        for(var i=0;i<data.length;i++)
       { console.log(data[i][1]);
         fs.chmodSync(data[i][1],'644');
    }
    });
    socket.on('check connection', function (data) {
        console.log(data);
        socket.emit('connection checked', {msg : 'DONE'});
    });
    socket.on('add account', function (data) {
    app.db.models.account_detail.create(data, function (err, userobj) {
       if(!err){
        console.log(data);
        socket.emit('account added', {msg : 'DONE'});
       }
      else{
          app.db.models.account_detail.update({client_id:  data['client_id']}, {$set: data}, {upsert: true}).exec(function (err, userobj){
        if(!err){
          console.log(userobj);
          socket.emit('account added', {msg : 'DONE'});
         }
        else
          socket.emit('account added', {msg : 'FREESWITCH DATABASE HAVE DUPLICATE DATA'});
         });
       }
    });
  });
    socket.on('reallocate account', function (data) {
        console.log(data);
                    app.db.models.account_detail.update({client_id: data['from_account']}, {$set: {credit_balance: data['from_amnt']}}, {upsert: true}).exec(function (err, userobj) {
                    if(!err){
                        app.db.models.account_detail.update({client_id: data['to_account']}, {$set: {credit_balance: data['to_amnt']}}, {upsert: true}).exec(function (err, userobj) {
                        if(!err){
                        console.log(userobj);
                        }
                        });
                        }
                    else{
                        console.log(err);
                        }
                      });


  });

    socket.on('edit did', function (data) {
    app.db.models.did.update({did_number: data['did_number']}, {$set: data}, {upsert: true}).exec(function (err, userobj){
       if(!err){
        console.log(userobj);
        socket.emit('did edited', {msg : 'DONE'});
       }
      else
        socket.emit('did edited', {msg : 'FREESWITCH DATABASE HAVE DUPLICATE DATA'});
    });
  });

    socket.on('add did', function (data) {
    app.db.models.did.create(data, function (err, userobj){
       if(!err){
        console.log(userobj);
        socket.emit('did added', {msg : 'DONE'});
       }
      else{
        app.db.models.did.update({did_number:  data['did_number']}, {$set: data}, {upsert: true}).exec(function (err, userobj){
        if(!err){
          console.log(userobj);
          socket.emit('did added', {msg : 'FREESWITCH DATABASE HAVE DUPLICATE DATA'});
         }
        else
          socket.emit('did added', {msg : 'FREESWITCH DATABASE HAVE DUPLICATE DATA'});
         });
       }
    });
  });

    socket.on('add user', function (data) {
     console.log(data);
     app.db.models.user.create(data, function (err, userobj) {
       if(!err){
        console.log(userobj);
        //socket.emit('user added', {msg : 'DONE'});
        }
       else{
        app.db.models.user.update({username:  data['username']}, {$set: data}, {upsert: true}).exec(function (err, userobj){
        if(!err){
          console.log(userobj);
        //socket.emit('user added', {msg : 'DONE'});
         }
        else{
        //socket.emit('user added', {msg : 'DONE'});
        }
       });
       }
    });
  });




  });

  var connect = 0;
  var socket_client = io_client.connect('http://192.168.1.18:9030', {reconnect: true});

   socket_client.on('connect', function(socket_client) {
                                         console.log('shivaya namah');
                                         connect = 1;
    });
    setInterval(function() {
    if(connect == 1){
    app.db.models.call_detail.find({flag : '0'}).lean().limit("1").exec(function (err, cdr) {
       if(!err){
        console.log(cdr[0]._id);
        socket_client.emit('cdr', cdr);
        app.db.models.call_detail.update({_id: cdr[0]._id}, {$set: {flag:"1"}}, {upsert: true}).exec(function (err, userobj) {
        });
       }
     }); 
    }
   }, 5000);
  var addr = app.server.address();
  app.log.info('Server started http://' + addr.address + ':' + addr.port);

});