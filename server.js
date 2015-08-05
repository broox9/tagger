var static = require('node-static');
var file = new static.Server('./public', {cache: false});

require('http').createServer(function (request, response) {
  console.log("Static server running on 3005");
    request.addListener('end', function () {
      file.serve(request, response);
    }).resume();
}).listen(3005);


// var http = require('http');
//
// var server = http.createServer(function (req, res) {
//
// });
