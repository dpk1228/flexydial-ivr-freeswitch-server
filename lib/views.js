var Views = module.exports;
var fs = require('fs')

Views.viewsDir = __dirname + '/../views'

Views.index = ''
indexPage = fs.readFile(Views.viewsDir + '/index.html', 'utf8',
  function (err, data) {
    Views.index += data
  });

Views.login = ''
loginPage = fs.readFile(Views.viewsDir  + '/login.html', 'utf8',
  function (err, data) {
    Views.login += data
  });

Views.admin = ''
adminPage = fs.readFile(Views.viewsDir  + '/admin.html', 'utf8',
  function (err, data) {
    Views.admin += data
  });

Views.user = ''
userPage = fs.readFile(Views.viewsDir  + '/user.html', 'utf8',
  function (err, data) {
    Views.user += data
  });

Views.addUser = ''
adduserPage = fs.readFile(Views.viewsDir  + '/addUser.html', 'utf8',
  function (err, data) {
    Views.addUser += data
  });

Views.client = ''
adminPage = fs.readFile(Views.viewsDir  + '/client.html', 'utf8',
  function (err, data) {
    Views.client += data
  });

Views.addClient = ''
addClientPage = fs.readFile(Views.viewsDir  + '/addClient.html', 'utf8',
  function (err, data) {
    Views.addClient += data
  });

Views.editClient = ''
editClientPage = fs.readFile(Views.viewsDir  + '/editClient.html', 'utf8',
  function (err, data) {
    Views.editClient += data
  });

Views.did = ''
didPage = fs.readFile(Views.viewsDir  + '/did.html', 'utf8',
  function (err, data) {
    Views.did += data
  });

Views.addDid = ''
addDidtPage = fs.readFile(Views.viewsDir  + '/addDid.html', 'utf8',
  function (err, data) {
    Views.addDid += data
  });


Views.editDId = ''
editDidPage = fs.readFile(Views.viewsDir  + '/editDid.html', 'utf8',
  function (err, data) {
    Views.editDid += data
  });

Views.example = ''
examplePage = fs.readFile(Views.viewsDir  + '/example.html', 'utf8',
  function (err, data) {
    Views.example += data
  });

Views.contactus = ''
contactus = fs.readFile(Views.viewsDir  + '/contact.html', 'utf8',
  function (err, data) {
    Views.contactus += data
  });
