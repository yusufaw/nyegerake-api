const express = require('express');
var cron = require('node-cron');
const { Telegraf } = require('telegraf');
const SentencesService = require('./service/SentencesService');
const ArrayUtils = require("./utils/ArrayUtils");
const FileUtils = require("./utils/FileUtils.js");
require('dotenv').config();

var complimentsBank = [];
const generalErrorMessage = "Ups, something has gone wrong";

FileUtils.getCompliments(compliments => {
  complimentsBank = compliments
  console.log(complimentsBank);
});

var app = express();
const bot = new Telegraf(process.env.MBOT_TOKEN)
bot.command('quiz', ctx => {
  SentencesService.getOneSentence()
    .then(result => {
      SentencesService.getSentencesExcept(result[0])
        .then(hasil => {
          const inKey = [[{
            text: result[0].indonesian,
            callback_data: result[0].indonesian
          }],
          [{
            text: hasil[0].indonesian,
            callback_data: hasil[0].indonesian
          }],
          [{
            text: hasil[1].indonesian,
            callback_data: hasil[1].indonesian
          }],
          [{
            text: hasil[2].indonesian,
            callback_data: hasil[2].indonesian
          }]]

          const opts = {
            parse_mode: "Markdown",
            reply_markup: JSON.stringify({
              inline_keyboard: ArrayUtils.shuffle(inKey)
            })
          };
          ctx.reply("What's the meaning of this phrase?\n\n*" + result[0].phrase + "*", opts)
        }
        )
    })
    .catch(err => {
      console.log(generalErrorMessage)
    });
})

bot.command('add', ctx => {
  const content = ctx.message.text.replace('/add ', '');
  const sentence = content.split(" - ")
  if (sentence.length < 2) {
    ctx.reply("Please send new sentence with this format\n\n/add [Phrase] - [Meaning in Indonesian]")
  } else {
    SentencesService.addNewSentence({
      phrase: sentence[0],
      indonesian: sentence[1],
      created_at: Date()
    })
      .then(result => {
        console.log(result)
        ctx.reply("Successfuly add new phrase!")
        ctx.reply("*" + result.phrase + "*\n\n_" + result.indonesian + '_', { parse_mode: "Markdown" })
      })
      .catch(err => {
        ctx.reply(generalErrorMessage)
      })
  }
})

bot.command('bulk', ctx => {
  const listOfPhrases = ctx.message.text.split("\n").map(phrase => {
    const sentence = phrase.split(" - ")
    return {
      phrase: sentence[0],
      indonesian: sentence[1],
      created_at: Date()
    }
  })
  SentencesService.addBulkSentences(listOfPhrases)
});

bot.on('callback_query', async (ctx) => {
  const phraseQuestion = ctx.callbackQuery.message.text.split("\n\n")[1]
  console.log(phraseQuestion);
  SentencesService.getOneSentencByPhrase(phraseQuestion)
    .then(result => {
      console.log(result)
      if (ctx.callbackQuery.data == result.indonesian) {
        const choosenCompliments = complimentsBank[between(0, complimentsBank.length - 1)]
        ctx.editMessageText(choosenCompliments)
        ctx.reply("*" + result.phrase + "*\n\n_" + result.indonesian + '_', { parse_mode: "Markdown" })
      } else {
        ctx.editMessageText("Ups, you chose a wrong answer 🙈")
        ctx.reply("*" + result.phrase + "*\n\n_" + result.indonesian + '_', { parse_mode: "Markdown" })
      }
    })
});

bot.launch()

const portAvailable = process.env.PORT || 3000
app.listen(portAvailable, function () {
  console.log('Listening on port ' + portAvailable);
});

app.get('/', function (req, res) {
  res.send('Hello World!');
});

function between(min, max) {
  return Math.floor(
    Math.random() * (max - min + 1) + min
  )
}

// cron.schedule('* * * * *', () => {
//   console.log('running a task every minute');
// });