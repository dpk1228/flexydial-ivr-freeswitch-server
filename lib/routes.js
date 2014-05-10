var paginate = require('mongoose-paginate');
var formidable = require('formidable');
var fs= require('fs');
exports = module.exports = function(app, plates, passport) {

var alertMsg = '';

app.router.get('/', function () {
  app.log.info('home page');
  if (this.req.isAuthenticated()) {
    app.log.info(this.req.user.username);
    //if(this.req.user.roles === "admin")
      this.res.redirect('/admin');
    //else if(this.req.user.roles === "user"){
      //this.res.redirect('/example');
    //}
       
    //else{
      //this.res.redirect('/logout');
    //}
  }
  else {
    this.res.writeHead(200, { 'Content-Type': 'text/html' })
    this.res.end(Views.index);
  }
});


app.router.get('/example', function () {
  app.log.info('example page');
  if (this.req.isAuthenticated()) {
    this.res.writeHead(200, { 'Content-Type': 'text/html' })
    this.res.end(Views.example);
  }
  else{
    this.res.redirect('/login');
  }
});

app.router.path('/contact', function() {
  this.get(function () {
  app.log.info('contact page');
  this.res.writeHead(200, { 'Content-Type': 'text/html' })
  this.res.end(Views.contactus);
  });
});

app.router.path('/login', function() {
  this.get( function () {
  if (this.req.isAuthenticated()) {
       this.res.redirect('/admin');
  }
  else {
       app.log.info('login page');
       this.res.writeHead(200, { 'Content-Type': 'text/html' })
       this.res.end(Views.login);
  }
  });

  //this.post(passport.authenticate('local', { successRedirect: '/admin?page=1&limit=10&username=&email=&sort=', failureRedirect: '/login'}));
  this.post(passport.authenticate('local', { successRedirect: '/', failureRedirect: '/login'}));

});

app.router.get('/admin', function(skip,limit) {
  limit = this.req.query.limit ? parseInt(this.req.query.limit, null) : 20;
  skip = this.req.query.page ? parseInt(this.req.query.page, null) : 1;
  username = this.req.query.username ? this.req.query.username : '';
  email = this.req.query.email ? this.req.query.email : '';
  sort = this.req.query.sort ? this.req.query.sort : '_id';
  if (!limit) {
      limit = 5;
  }
  if (!skip) {
      skip = 1;
  }
  nxt = skip+1;
  prev = skip - 1;
  if(prev < 1)
    prev = 1;

  app.log.info('admin page');
  var res = this.res;
  if (this.req.isAuthenticated()) {
    var filters = {};
    filters.username = new RegExp('^.*?'+ username +'.*$', 'i');
    filters.email = new RegExp('^.*?'+ email +'.*$', 'i');

    this.res.writeHead(200, { 'Content-Type': 'text/html' });
    app.db.models.user.find(filters,'_id username email').lean().skip((skip-1)*limit).limit(limit).sort(sort).exec(function (err, users) {
      var resultList = '';
      if(skip == 1 ){
         if(users.length !=  limit)
            page ='';
         else
            page = '<li><a href="/admin?page='+nxt+'&limit='+limit+'&username='+username+'&email='+email+'&sort='+sort+'">Next</a></li>';
       }
      else if(users.length !=  limit)
         page = '<li><a href="/admin?page='+prev+'&limit='+limit+'&username='+username+'&email='+email+'&sort='+sort+'">Previous</a></li>';
      else
         page = '<li><a href="/admin?page='+prev+'&limit='+limit+'&username='+username+'&email='+email+'&sort='+sort+'">Previous</a></li><li><a href="/admin?page='+nxt+'&limit='+limit+'&username='+username+'&email='+email+'&sort='+sort+'">Next</a></li>';
      for(var i=0;i<users.length;i++) {
        resultList += '<tr class="clickableRow" href="/admin/user/'
        + users[i]._id +'"><td style="width:22px"><label class="checkbox-inline"><input type="checkbox" name="id" value="'
        + users[i]._id+'"></label></td><td>' 
        + users[i].username + '</td><td>'
        + users[i].email + '</td></a></tr>';
      }
      res.end(plates.bind(Views.admin, {'userlist':resultList, 'alertMsg':alertMsg , 'page':page}));
      alertMsg='';
    });
  }
  else{
    console.log("user is not authenticated");
    res.redirect('/login');
  }
});


app.router.path('/admin/addUser', function() {
  this.get(function() {
  if (this.req.isAuthenticated()) {
    this.res.writeHead(200, { 'Content-Type': 'text/html' });
    this.res.end(plates.bind(Views.addUser, {'alertMsg':alertMsg}));
    alertMsg='';
  }
  else{
    console.log("user is not authenticated");
    this.res.redirect('/');
  }
  });

  this.post(function() {
  console.log("user is added");
  var req = this.req;
  var res = this.res;
  var username = req.body.username;
  var email = req.body.email;
  var pwd = req.body.pwd;
  var role = req.body.role;
  var encryptedPassword = app.db.models.user.encryptPassword(pwd);
  if (this.req.isAuthenticated()) {
    this.res.writeHead(200, { 'Content-Type': 'text/html' });
    app.db.models.user.create({"username" : username, "email" : email, "isActive" : true, "password" : encryptedPassword, "roles" : role}, function (err, userobj) {
       if(!err){
          console.log(userobj);
          alertMsg='<div class="alert alert-success"><strong>Success !</strong> New user:'+username+' is added.</div>';
          res.redirect('/admin');
       }
       else{
          console.log(err);
          alertMsg='<div class="alert alert-danger"><strong>'+username+'</strong> Username is already present, please choose another .</div>';
          res.redirect('/admin/addUser');
       }
    });
   }
  else{
    console.log("user is not authenticated");
    res.redirect('/');
   }
 });
});


app.router.path('/admin/user/:userid', function(userid) {
  this.get(function(userid) {
  var res = this.res;
  if (this.req.isAuthenticated()) {
    this.res.writeHead(200, { 'Content-Type': 'text/html' });
    app.db.models.user.find({_id:userid}).lean().exec(function (err, userobj) {
    var user = "<input type='text' class='form-control'name='username' value='"+userobj[0].username+"' readonly='true'>";
    var email = "<input type=text class='form-control' id='em' name='email' value='"+userobj[0].email+"'>";
    var id = "<input type=hidden name='id' id='uid' value='"+userobj[0]._id+"'</input>";
    res.end(plates.bind(Views.user, {'userName':user, 'eml':email, '_id':id, 'alertMsg':alertMsg}));
    alertMsg='';
    });
   }
  else{
    console.log("user is not authenticated");
    res.redirect('/');
   }
  });
});

app.router.post('/admin/saveUser', function() {
  console.log("user is saved");
  var res = this.res;
  var username = this.req.body.username;
  var emails = this.req.body.email;
  var id = this.req.body.id;
  if (this.req.isAuthenticated()) {
    this.res.writeHead(200, { 'Content-Type': 'text/html' });
    app.db.models.user.update({_id: id}, {$set: {email:emails}}, {upsert: true}).exec(function (err, userobj) {
    if(!err){
        alertMsg = '<div class="alert alert-success"><strong>Success ! </strong> User information changed.</div>';
        var redirectUrl = "/admin/user/"+id;
        res.redirect(redirectUrl);
    }
    });
  }
  else{
    console.log("user is not authenticated");
    res.redirect('/');
  }
});

app.router.post('/admin/deleteUser', function() {
  var ids= [];
  if(this.req.body.id){
    if( typeof this.req.body.id == 'string')
      ids.push(this.req.body.id);
    else
      ids = this.req.body.id;
    var username = this.req.body.username;
    app.db.models.user.find({_id:{ $in:ids}}).remove().exec(function (err, userobj) {
       if(!err) {
          alertMsg='<div class="alert alert-danger"><strong>'+username+'</strong> Username is deleted successfully .</div>';
       }
       else{
          console.log(err);
          alertMsg='<div class="alert alert-danger"><strong>'+username+'</strong>'+JSON.stringify(err)+'</div>';
       }

    });
  }
  else{
      alertMsg='<div class="alert alert-danger"><strong>No Item </strong> is selected</div>';
  }
  this.res.redirect('/admin?page=1&limit=10&username=&email=&sort=');
});

app.router.get('/client', function(skip,limit) {
  limit = this.req.query.limit ? parseInt(this.req.query.limit, null) : 20;
  skip = this.req.query.page ? parseInt(this.req.query.page, null) : 1;
  client_name = this.req.query.client_name ? this.req.query.client_name : '';
  client_email = this.req.query.email ? this.req.query.email : '';
  sort = this.req.query.sort ? this.req.query.sort : '_id';
  client_phone = '';
  if (!limit) {
      limit = 5;
  }
  if (!skip) {
      skip = 1;
  }
  nxt = skip+1;
  prev = skip - 1;
  if(prev < 1)
    prev = 1;

  app.log.info('client page');
  var res = this.res;
  if (this.req.isAuthenticated()) {
    var filters = {};
    filters.client_name = new RegExp('^.*?'+ client_name +'.*$', 'i');
    filters.client_email = new RegExp('^.*?'+ client_email +'.*$', 'i');

    this.res.writeHead(200, { 'Content-Type': 'text/html' });
    app.db.models.client.find(filters,'_id client_name client_email ').lean().skip((skip-1)*limit).limit(limit).sort(sort).exec(function (err, client) {
      var resultList = '';
      if(skip == 1 ){
         if(client.length !=  limit)
            page ='';
         else
            page = '<li><a href="/client?page='+nxt+'&limit='+limit+'&client_name='+client_name+'&email='+client_email+'&sort='+sort+'">Next</a></li>';
       }
      else if(client.length !=  limit)
         page = '<li><a href="/client?page='+prev+'&limit='+limit+'&client_name='+client_name+'&email='+client_email+'&sort='+sort+'">Previous</a></li>';
      else
         page = '<li><a href="/client?page='+prev+'&limit='+limit+'&client_name='+client_name+'&email='+client_email+'&sort='+sort+'">Previous</a></li><li><a href="/client?page='+nxt+'&limit='+limit+'&client_name='+client_name+'&email='+client_email+'&sort='+sort+'">Next</a></li>';
      for(var i=0;i<client.length;i++) {
        console.log(client[i].client_phone_number);
        resultList += '<tr class="clickableRow" href="/client/editClient/'
        + client[i]._id +'"><td style="width:22px"><label class="checkbox-inline"><input type="checkbox" name="id" value="'
        + client[i]._id+'"></label></td><td>' 
        + client[i].client_name + '</td><td>'
        + client[i].client_email + '</td><td>'
        + client[i].client_phone_number + '</td></a></tr>';
      }
      res.end(plates.bind(Views.client, {'clientlist':resultList, 'alertMsg':alertMsg , 'page':page}));
      alertMsg='';
    });
  }
  else{
    console.log("user is not authenticated");
    res.redirect('/login');
  }
});

app.router.path('/client/addClient', function() {
  this.get(function() {
  if (this.req.isAuthenticated()) {
    this.res.writeHead(200, { 'Content-Type': 'text/html' });
    this.res.end(plates.bind(Views.addClient, {'alertMsg':alertMsg}));
    alertMsg='';
  }
  else{
    console.log("user is not authenticated");
    this.res.redirect('/');
  }
  });

  this.post(function() {
  console.log("Client is added");
  var req = this.req;
  var res = this.res;
  var client_name = req.body.client_name;
  var client_address = req.body.address;
  var client_email = req.body.email;
  var client_phone_number = req.body.phone;
  var client_contact_person = req.body.contact_person;
  var client_contact_phone = req.body.contact_phone;
  console.log(client_name + client_address + client_email+client_phone_number+client_contact_person+client_contact_phone);
  if (this.req.isAuthenticated()) {
    this.res.writeHead(200, { 'Content-Type': 'text/html' });
    app.db.models.client.create({"client_name" : client_name, "client_address" : client_address, "client_email" : client_email, "client_phone_number" : client_phone_number, "client_contact_person" : client_contact_person, "client_contact_phone" : client_contact_phone}, function (err, clientobj) {
       if(!err){
          console.log(clientobj);
          alertMsg='<div class="alert alert-success"><strong>Success !</strong> New Client :'+client_name+' is added.</div>';
          res.redirect('/client');
       }
       else{
          console.log(err);
          alertMsg='<div class="alert alert-danger"><strong>'+client_name+'</strong> Client name is already present, please choose another .</div>';
          res.redirect('/client/addClient');
       }
    });
   }
  else{
    console.log("user is not authenticated");
    res.redirect('/');
   }
 });

  });
app.router.path('/client/editClient/:client_id', function(client_id) {
  this.get(function(client_id) {
  var res = this.res;
  if (this.req.isAuthenticated()) {
    this.res.writeHead(200, { 'Content-Type': 'text/html' });
    app.db.models.client.find({_id:client_id}).lean().exec(function (err, clientobj) {
    var client = "<input type='text' class='form-control'name='client_name' value='"+clientobj[0].client_name+"' readonly='true'>";
    var address = "<input type='text' class='form-control'name='address' value='"+clientobj[0].client_address+"' >";
    var email = "<input type=text class='form-control' id='em' name='email' value='"+clientobj[0].client_email+"'>";
    var phone = "<input type='text' class='form-control'name='phone' value='"+clientobj[0].client_phone_number+"' >";
    var contact_person = "<input type='text' class='form-control'name='contact_person' value='"+clientobj[0].client_contact_person+"' >";
    var contact_phone = "<input type='text' class='form-control'name='contact_phone' value='"+clientobj[0].client_contact_phone+"' >";
    var id = "<input type=hidden name='id' id='uid' value='"+clientobj[0]._id+"'</input>";
    res.end(plates.bind(Views.editClient, {'clientName':client,'address':address, 'email':email,'phone' :phone,'contact_person': contact_person,'contact_phone':contact_phone, '_id':id, 'alertMsg':alertMsg}));
    alertMsg='';
    });
   }
  else{
    console.log("user is not authenticated");
    res.redirect('/');
   }
  });
});


app.router.post('/client/saveClient', function() {
  console.log("user is saved");
  var res = this.res;
  var client_address = this.req.body.address;
  var client_email = this.req.body.email;
  var client_phone_number = this.req.body.phone;
  var client_contact_person = this.req.body.contact_person;
  var client_contact_phone = this.req.body.contact_phone;
  var id = this.req.body.id;
  console.log(client_address + client_email+client_phone_number+client_contact_person+client_contact_phone + id);
  if (this.req.isAuthenticated()) {
    this.res.writeHead(200, { 'Content-Type': 'text/html' });
    app.db.models.client.update({_id: id}, {$set: {client_address:client_address, client_email: client_email, client_phone_number : client_phone_number, client_contact_person : client_contact_person, client_contact_phone : client_contact_phone}}, {upsert: true}).exec(function (err, userobj) {
    if(!err){
        alertMsg = '<div class="alert alert-success"><strong>Success ! </strong> User information changed.</div>';
        var redirectUrl = "/client/editClient/"+id;
        res.redirect(redirectUrl);
    }
    });
  }
  else{
    console.log("user is not authenticated");
    res.redirect('/');
  }
 });

app.router.post('/client/deleteClient', function() {
  var ids= [];
  if(this.req.body.id){
    if( typeof this.req.body.id == 'string')
      ids.push(this.req.body.id);
    else
      ids = this.req.body.id;
    var client_name = this.req.body.client_name;
    app.db.models.client.find({_id:{ $in:ids}}).remove().exec(function (err, userobj) {
       if(!err) {
          alertMsg='<div class="alert alert-danger"><strong>'+client_name+'</strong> Username is deleted successfully .</div>';
       }
       else{
          console.log(err);
          alertMsg='<div class="alert alert-danger"><strong>'+client_name+'</strong>'+JSON.stringify(err)+'</div>';
       }

    });
  }
  else{
      alertMsg='<div class="alert alert-danger"><strong>No Item </strong> is selected</div>';
  }
  this.res.redirect('/client?page=1&limit=10&client_name=&email=&sort=');
});


app.router.get('/did', function(skip,limit) {
  limit = this.req.query.limit ? parseInt(this.req.query.limit, null) : 20;
  skip = this.req.query.page ? parseInt(this.req.query.page, null) : 1;
  client_name = this.req.query.client_name ? this.req.query.client_name : '';
  did_number = this.req.query.did_number ? this.req.query.did_number : '';
  sort = this.req.query.sort ? this.req.query.sort : '_id';
  client_phone = '';
  if (!limit) {
      limit = 5;
  }
  if (!skip) {
      skip = 1;
  }
  nxt = skip+1;
  prev = skip - 1;
  if(prev < 1)
    prev = 1;

  app.log.info('did page');
  var res = this.res;
  if (this.req.isAuthenticated()) {
    var filters = {};
    filters.client_name = new RegExp('^.*?'+ client_name +'.*$', 'i');
    filters.did_number = new RegExp('^.*?'+ did_number +'.*$', 'i');

    this.res.writeHead(200, { 'Content-Type': 'text/html' });
    app.db.models.did.find(filters,'_id did_number ip_address client_name ').lean().skip((skip-1)*limit).limit(limit).sort(sort).exec(function (err, did) {
      var resultList = '';
      if(skip == 1 ){
         if(did.length !=  limit)
            page ='';
         else
            page = '<li><a href="/did?page='+nxt+'&limit='+limit+'&client_name='+client_name+'&did_number='+did_number+'&sort='+sort+'">Next</a></li>';
       }
      else if(did.length !=  limit)
         page = '<li><a href="/did?page='+prev+'&limit='+limit+'&client_name='+client_name+'&did_number='+did_number+'&sort='+sort+'">Previous</a></li>';
      else
         page = '<li><a href="/did?page='+prev+'&limit='+limit+'&client_name='+client_name+'&did_number='+did_number+'&sort='+sort+'">Previous</a></li><li><a href="/did?page='+nxt+'&limit='+limit+'&client_name='+client_name+'&did_number='+did_number+'&sort='+sort+'">Next</a></li>';
      for(var i=0;i<did.length;i++) {
        console.log(did[i].did_number);
        resultList += '<tr class="clickableRow" href="/did/editDid/'
        + did[i]._id +'"><td style="width:22px"><label class="checkbox-inline"><input type="checkbox" name="id" value="'
        + did[i]._id+'"></label></td><td>' 
        + did[i].did_number + '</td><td>'
        + did[i].client_name + '</td><td>'
        + did[i].ip_address + '</td></a></tr>';
      }
      res.end(plates.bind(Views.did, {'didlist':resultList, 'alertMsg':alertMsg , 'page':page}));
      alertMsg='';
    });
  }
  else{
    console.log("user is not authenticated");
    res.redirect('/login');
  }
});


app.router.get('/did/addDid', function(){
  if (this.req.isAuthenticated()) {
    this.res.writeHead(200, { 'Content-Type': 'text/html' });
    this.res.end(plates.bind(Views.addDid, {'alertMsg':alertMsg}));
    alertMsg='';
  }
  else{
    console.log("user is not authenticated");
    this.res.redirect('/');
  }
  });

app.router.post('/did/addDid',{ stream: true },function() {
  var req = this.req;
  var res = this.res;
       //console.log(req.files);

  var form = new formidable.IncomingForm({ uploadDir: __dirname+'/upload' });
        files = [],
        fields = [];
   //form.uploadDir = "/home/deepak/flexydial-example-flatiron/upload";

      console.log('Receiving file upload');
 form
      .on('field', function(field, value) {
        console.log(field, value);
        fields.push([field, value]);
      })
      .on('file', function(field, file) {
        //console.log(field, file);
        files.push([field, file]);
      })
      .on('fileBegin', function(name, file) {
        file.name = "NMS";
      })
      .on('progress', function(rec, expected) {
          //console.log("progress: " + rec + " of " +expected);
        })
      .on('end', function() {
           //console.log('-> upload done');
           res.writeHead(200, {'content-type': 'text/plain'});
           //res.write('received fields:\n\n '+util.inspect(fields));
           res.write('\n\n');
           //res.end('received files:\n\n '+util.inspect(files));
           });
         form.parse(req);

  /*var client_name = req.files.client_name;
  var did_number = req.files.did_number;
  var ip_address = req.files.ip_address;
  var script_detail = req.files.script_detail;*/
/////////////////////////////////////////////////

  /*var filename=req.files.file.name;
  var extensionAllowed=[".docx","doc"];
  var maxSizeOfFile=100;
  var msg="";
  var i = filename.lastIndexOf('.');
  // get the temporary location of the file
  var tmp_path = req.files.file.path; 
  // set where the file should actually exists - in this case it is in the "images" directory
  var target_path = __dirname +'/upload/' + req.files.file.name; 
      console.log(target_path);
  var file_extension= (i < 0) ? '' : filename.substr(i); 
  if((file_extension in oc(extensionAllowed))&&((req.files.file.size /1024 )< maxSizeOfFile)){ 
      app.fs.rename(tmp_path, target_path, function(err) {
        if (err) throw err; 
        // delete the temporary file, so that the explicitly set temporary upload dir does not get filled with unwanted files 
        app.fs.unlink(tmp_path, function() {
            if (err) throw err;
        });
      });
      msg="File uploaded sucessfully" 
  }else{
  // delete the temporary file, so that the explicitly set temporary upload dir does not get filled with unwanted files 
      app.fs.unlink(tmp_path, function(err) {
        if (err) throw err;
       });
      msg="File upload failed.File extension not allowed and size must be less than "+maxSizeOfFile; 
      }
      console.log(msg);*/
///////////////////////////////////////////////
 /* console.log(client_name + ip_address + did_number+script_detail);
  if (this.req.isAuthenticated()) {
    this.res.writeHead(200, { 'Content-Type': 'text/html' });
    app.db.models.did.create({"client_name" : client_name, "ip_address" : ip_address, "did_number" : did_number, "script_detail" : script_detail }, function (err, clientobj) {
       if(!err){
          console.log(clientobj);
          alertMsg='<div class="alert alert-success"><strong>Success !</strong> New DID :'+did_number+' is added.</div>';
          res.redirect('/did');
       }
       else{
          console.log(err);
          alertMsg='<div class="alert alert-danger"><strong>'+did_number+'</strong> Client name is already present, please choose another .</div>';
          res.redirect('/did/addDid');
       }
    });
   }
  else{
    console.log("user is not authenticated");
    res.redirect('/');
   } */
  });


app.router.path('/did/editDid/:did_id', function(did_id) {
  this.get(function(did_id) {
  var res = this.res;
  if (this.req.isAuthenticated()) {
    this.res.writeHead(200, { 'Content-Type': 'text/html' });
    app.db.models.did.find({_id:did_id}).lean().exec(function (err, didobj) {
    var client = "<input type='text' class='form-control'name='client_name' value='"+didobj[0].client_name+"' >";
    var ip_address = "<input type='text' class='form-control'name='ip_address' value='"+didobj[0].ip_address+"' >";
    var did_number = "<input type=text class='form-control' id='did_number' name='did_number' value='"+didobj[0].did_number+"'>";
    var script_detail = "<input type='text' class='form-control'name='script_detail' value='"+didobj[0].script_detail+"' >";
    var id = "<input type=hidden name='id' id='uid' value='"+didobj[0]._id+"'</input>";
    res.end(plates.bind(Views.editDid, {'clientName':client,'ip_address':ip_address, 'did_number':did_number,'script_detail' : script_detail, '_id':id, 'alertMsg':alertMsg}));
    alertMsg='';
    });
   }
  else{
    console.log("user is not authenticated");
    res.redirect('/');
   }
  });
});

app.router.post('/did/saveDid', function() {
  console.log("DID is saved");
  var res = this.res;
  var req = this.req;
  var client_name = req.body.client_name;
  var did_number = req.body.did_number;
  var ip_address = req.body.ip_address;
  var script_detail = req.body.script_detail;
  console.log(client_name + ip_address + did_number+script_detail);
  var id = this.req.body.id;
  if (this.req.isAuthenticated()) {
    this.res.writeHead(200, { 'Content-Type': 'text/html' });
    app.db.models.did.update({_id: id}, {$set: {client_name:client_name, did_number: did_number, ip_address : ip_address, script_detail : script_detail}}, {upsert: true}).exec(function (err, userobj) {
    if(!err){
        alertMsg = '<div class="alert alert-success"><strong>Success ! </strong> DID information changed.</div>';
        var redirectUrl = "/did/editDid/"+id;
        res.redirect(redirectUrl);
    }
    });
  }
  else{
    console.log("user is not authenticated");
    res.redirect('/');
  }
 });


app.router.post('/did/deleteDid', function() {
  var ids= [];
  if(this.req.body.id){
    if( typeof this.req.body.id == 'string')
      ids.push(this.req.body.id);
    else
      ids = this.req.body.id;
    var did_number = this.req.body.did_number;
    app.db.models.did.find({_id:{ $in:ids}}).remove().exec(function (err, userobj) {
       if(!err) {
          alertMsg='<div class="alert alert-danger"><strong>'+did_number+'</strong> DID is deleted successfully .</div>';
       }
       else{
          console.log(err);
          alertMsg='<div class="alert alert-danger"><strong>'+did_number+'</strong>'+JSON.stringify(err)+'</div>';
       }

    });
  }
  else{
      alertMsg='<div class="alert alert-danger"><strong>No Item </strong> is selected</div>';
  }
  this.res.redirect('/did?page=1&limit=10&client_name=&email=&sort=');
});


app.router.get('/logout', function(){
  this.req.logout();
  this.res.redirect('/');
});

} //export ends here


