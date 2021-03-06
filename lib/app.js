var flatiron = require('flatiron'),
    app = flatiron.app,
    path = require('path'),
    mongoose = require('mongoose');

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
require('./models/extension')(app, mongoose);
require('./models/welcomeDid')(app, mongoose);
require('./models/voicemail')(app, mongoose);
require('./models/region')(app, mongoose);
require('./models/did_blacklist')(app, mongoose);
require('./models/blacklist')(app, mongoose);
require('./models/whitelist')(app, mongoose);
require('./models/stickyAgent')(app, mongoose);
require('./models/missedcall')(app, mongoose);

app.db.models.region.find({to : {$lte : 83778},from : {$gte : 83778}}).lean().exec(function (err, region){
    if(!err)
       console.log("region : "+ JSON.stringify(region));
});

/*
  app.db.models.did.find().lean().exec(function (err, did) {
console.log(did);
});
 app.db.models.call_detail.find({flag : '0'}).lean().limit("2").exec(function (err, cdr) {
 console.log(cdr);
 app.db.models.call_detail.update({_id: cdr[1]._id}, {$set: {flag:"1"}}, {upsert: true}).exec(function (err, userobj) {
   console.log(err);
   console.log(userobj);
   });
});*/
app.use(flatiron.plugins.http);


require('./routes')(app);
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
        { 
	 console.log(data[i][1]);
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

    socket.on('create blackWhiteList', function (data) {
    app.db.models.didBlacklist.create(data, function (err, userobj) {
       if(!err){
        console.log(data);
       }
      else{
          console.log(err);
         }
    });
  });

    socket.on('add blackWhiteList', function (data) {
    app.db.models.blacklist.create(data, function (err, userobj) {
       if(!err){
        console.log(data);
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

    
    socket.on('edit extension', function (data) {
        app.db.models.extension.update({_id :  data['_id']}, {$set: {did : data['did'], extension : data['extension'], number : data['number'] }}, {upsert: true}).exec(function (err, userobj)
	{
	      if(!err){
		console.log(userobj);
		socket.emit('extension edited', {msg : 'DONE'});
	      }
	      else{
		socket.emit('extension not edited', {msg : 'ERROR'});
	      }
       });
       });
 
    socket.on('add extension', function (data) {
        app.db.models.extension.create({_id :  data['_id'], did : data['did'], extension : data['extension'], number : data['number'], region : data['region'] },function (err, userobj)
	{
	      if(!err){
		console.log(userobj);
		socket.emit('extension added', {msg : 'DONE'});
	      }
	      else{
		socket.emit('extension not added', {msg : 'ERROR'});
	      }
       });
       });

    socket.on('add welcomeMsg', function (data) {
        app.db.models.welcomeDid.create({_id :  data['_id'], did : data['did'], type : data['type'], response : data['response'] },function (err, userobj)
	{
	      if(!err){
		console.log(userobj);
		socket.emit('welcomeMsg added', {msg : 'DONE'});
	      }
	      else{
		socket.emit('welcomeMsg not added', {msg : 'ERROR'});
	      }
       });
       });
    socket.on('update did missedCall', function (data) {
		console.log(data);
       app.db.models.did.update({did_number : data['did_number']},{$set : {app_name : "missedCall" }} , function (err, didobj) {
	    if(!err){
		console.log(didobj);
             }
            });

       });

    socket.on('add stickyAgent', function (data) {
    app.db.models.stickyAgent.create(data, function (err, userobj) {
       if(!err){
        console.log(data);
        socket.emit('stickyAgent added', {msg : 'DONE'});
          }
         });
      });
    socket.on('save stickyAgent', function (data) {
    app.db.models.stickyAgent.update({incoming_phone_number: data['hosting'], did_number: data['did_number']}, {$set: {incoming_phone_number: data['incoming_phone_number'], forwarding_phone_number: data['forwarding_phone_number']}}, {upsert: true}).exec(function (err, userobj) {
       if(!err){
        console.log(data);
        socket.emit('stickyAgent added', {msg : 'DONE'});
          }
         });
      });
    });


  
  var connect = 0;
  var socket_client = io_client.connect('http://localhost:9040', {'force new connection': true});

   socket_client.on('connect', function(socket_client) {
                                         console.log('shivaya namah connected');
                                         connect = 1;
   });
   
    setInterval(function() {
    if(connect == 1){
    app.db.models.call_detail.find({flag : '0'}).lean().limit(1).exec(function (err, cdr) {
       if(!err && cdr.length > 0){
        //console.log(cdr[0]._id);
        socket_client.emit('cdr', cdr);
        //socket_client.emit('cdr', {name : 'nms', company : 'infinite'});
        app.db.models.call_detail.update({_id: cdr[0]._id}, {$set: {flag:"1"}}, {upsert: true}).exec(function (err, userobj) {
        });
       }
     }); 
    app.db.models.voicemail.find({flag : 0}).lean().limit(1).exec(function (err, cdr) {
       if(!err && cdr.length > 0){
        //console.log(cdr[0]._id);
        socket_client.emit('voicemail', cdr);
        //socket_client.emit('cdr', {name : 'nms', company : 'infinite'});
        app.db.models.voicemail.update({_id: cdr[0]._id}, {$set: {flag:1}}, {upsert: true}).exec(function (err, userobj) {
        });
       }
     }); 
    app.db.models.account_detail.find({flag : 0}).lean().limit(1).exec(function (err, account) {
       if(!err && account.length > 0){
        //console.log(account[0]._id);
        socket_client.emit('account', account);
        //socket_client.emit('cdr', {name : 'nms', company : 'infinite'});
        app.db.models.account_detail.update({_id: account[0]._id}, {$set: {flag:1}}, {upsert: true}).exec(function (err, userobj) {
        });
       }
     }); 
    app.db.models.missedcall.find({flag : 0}).lean().limit(1).exec(function (err, cdr) {
       if(!err && cdr.length > 0){
        console.log(cdr[0]._id);
        socket_client.emit('missedcall', cdr);
        //socket_client.emit('cdr', {name : 'nms', company : 'infinite'});
        app.db.models.missedcall.update({_id: cdr[0]._id}, {$set: {flag:1}}, {upsert: true}).exec(function (err, userobj) {
        });
       }
     }); 
    app.db.models.account_detail.find({credit_balance : 0}).lean().limit(1).exec(function (err, acnt) {
       if(!err && acnt.length > 0){
        var detail = acnt[0].client_id.split(":");
        var username = detail[0];
        var did = detail[1];
        console.log(detail[0]+"---"+detail[1]);
        app.db.models.user.find({username: username}).lean().limit(1).exec(function (err, user) {
             if(!err && user.length > 0 && user[0].accountType == 'demo'){
                 app.db.models.extension.find({did : did}).remove().exec(function (err, extobj) {
                     if(!err) {
                         console.log("EXTENSION DELETED");
                     }
                 });  
                 app.db.models.account_detail.find({client_id : acnt[0].client_id}).remove().exec(function (err, extobj) {
                     if(!err) {
                         console.log("ACCOUNT DELETED");
                     }
                 });  
                 app.db.models.user.find({username : username}).remove().exec(function (err, extobj) {
                     if(!err) {
                         console.log("USER DELETED");
                     }
                 });  
                 socket_client.emit('delete demo account', {username : username, did : did});
                /* app.db.models.did.find({did_number : did}).remove().exec(function (err, extobj) {
                     if(!err) {
                         console.log("DID DELETED");
                         app.db.models.did.create({"did_number": did, "client_name": ""}, function (err, virtualr) {
                            console.log("DID CREATED");
                      });

                     }
                 });*/  
            }
        });
       }
    });
   }
   }, 5000);
    
   
  var addr = app.server.address();
  app.log.info('Server started http://' + addr.address + ':' + addr.port);

});
