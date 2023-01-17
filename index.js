const express = require('express');
var cron = require('node-cron');
const SentencesService = require('./service/SentencesService');
require('dotenv').config();

var app = express();

const portAvailable = process.env.PORT || 3000
app.listen(portAvailable, function () {
    console.log('Listening on port ' + portAvailable);
});

app.get('/', function (req, res) {
  res.send('Hello World!');
  SentencesService.addNewSentence({
    phrase: "Just in case",
    indonesian: "Untuk berjaga-jaga",
    created_at: Date()
  })
});

app.get('/quiz', function (req, res) {
  res.send('Hello World!');
  SentencesService.getOneSentence()
  .then(result => {
    console.log(result)
  })
  .catch(err => {
    console.log("error")
  });
});

cron.schedule('* * * * *', () => {
  console.log('running a task every minute');
});