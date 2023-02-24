const express = require('express');
var cron = require('node-cron');
const SentencesService = require('./service/SentencesService');
const BotService = require('./service/BotService');
require('dotenv').config();

var app = express();

const portAvailable = process.env.PORT || 3000
app.listen(portAvailable, function () {
  console.log('Listening on port ' + portAvailable);
});

app.get('/', function (req, res) {
  res.send('Hello World!');
});

app.get('/today', function (req, res) {
  SentencesService.getOneSentence()
    .then(result => {
      const response = {
        "phrase": result[0].phrase,
        "indonesian": result[0].indonesian
      }
      res.send(response);
    })
    .catch(error => {
      res.send(error)
    })
});

// cron.schedule('* * * * *', () => {
//   console.log('running a task every minute');
// });