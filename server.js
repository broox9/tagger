var fs  = require('fs');
var express = require('express');
var app = express();
var tagData = require('./fakeData.js');

app.use(express.static('public'));

app.get('/', function (req, res) {
  console.log("requested index.html")
  res.send('index.html');
});


app.get('/tagger', function (req, res) {
  var searchData = {};
  var searchText = req.query.q;
  searchData.items = tagData.items.filter(function (item, index) {
    var name = item.name.toLowerCase();
    return name.indexOf(searchText) > -1;
  })

  //console.log("found:", searchData.items);
  var timing = Math.random() * 3000;
  console.log("Timing: ", timing);
  setTimeout(function () { res.json(searchData); }, timing);
});


app.listen(3005);


// var static = require('node-static');
// var file = new static.Server('./public', {cache: false});
//
// require('http').createServer(function (request, response) {
//   console.log("Static server running on 3005");
//     request.addListener('end', function () {
//       file.serve(request, response);
//     }).resume();
// }).listen(3005);
