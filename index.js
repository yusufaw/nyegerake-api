const express = require('express');

var app = express();

const portAvailable = process.env.PORT || 3000
app.listen(portAvailable, function () {
    console.log('Listening on port ' + portAvailable);
});

app.get('/', function (req, res) {
  res.send('Hello World!');
});
