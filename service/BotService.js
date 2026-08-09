
const { Telegraf } = require('telegraf');
const SentencesService = require('./SentencesService');
const ArrayUtils = require("../utils/ArrayUtils");
const FileUtils = require("../utils/FileUtils.js");
require('dotenv').config();

const bot = new Telegraf(process.env.MBOT_TOKEN)
var complimentsBank = [];
const generalErrorMessage = "Ups, something has gone wrong";
const pendingFillBlanks = new Map();
const STOPWORDS = new Set([
    'a', 'an', 'the', 'is', 'am', 'are', 'was', 'were', 'be', 'been', 'being',
    'to', 'of', 'in', 'on', 'at', 'for', 'and', 'or', 'but', 'with', 'as',
    'by', 'from', 'it', 'this', 'that', 'your', 'you', 'my', 'i', 'me'
]);

FileUtils.getCompliments(compliments => {
    complimentsBank = compliments;
});

bot.command('quiz', ctx => {
    getOneRandomQuestion(function (message, opts) {
        ctx.reply(message, opts)
    });
})

bot.command('add', ctx => {
    const senderId = ctx.message.from.id
    if (senderId != process.env.ADMIN_SENDER_ID) {
        ctx.reply("Sorry, you don't have access to add new expression. Please contact admin of this bot.")
        return;
    }
    console.log("Great, you are the admin.");

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

const revealButtonOpts = {
    reply_markup: JSON.stringify({
        inline_keyboard: [[{ text: "Reveal answer", callback_data: "reveal_fillblank" }]]
    })
};

bot.command('fillblank', ctx => {
    SentencesService.getOneSentence()
        .then(result => {
            const sentence = result[0];
            const { blanked, answer } = buildBlankedPhrase(sentence.phrase);
            pendingFillBlanks.set(ctx.chat.id, {
                answer: answer,
                phrase: sentence.phrase,
                indonesian: sentence.indonesian
            });
            ctx.reply(
                "Fill in the missing word!\n\n*" + blanked + "*\n\n_" + sentence.indonesian + "_",
                Object.assign({ parse_mode: "Markdown" }, revealButtonOpts)
            );
        })
        .catch(err => {
            ctx.reply(generalErrorMessage);
        });
});

bot.on('text', ctx => {
    const text = ctx.message.text;
    if (text.startsWith('/')) {
        return;
    }

    const pending = pendingFillBlanks.get(ctx.chat.id);
    if (!pending) {
        return;
    }

    const normalize = str => str.trim().toLowerCase().replace(/[.,!?;:]+$/, '');
    const isCorrect = normalize(text) === normalize(pending.answer);

    if (isCorrect) {
        pendingFillBlanks.delete(ctx.chat.id);
        const choosenCompliments = complimentsBank[between(0, complimentsBank.length - 1)]
        ctx.reply(choosenCompliments)
        ctx.reply("*" + pending.phrase + "*\n\n_" + pending.indonesian + '_', { parse_mode: "Markdown" })
    } else {
        ctx.reply("Ups, that's not it. Try again!", revealButtonOpts)
    }
});

bot.on('callback_query', async (ctx) => {
    if (ctx.callbackQuery.data === 'reveal_fillblank') {
        const pending = pendingFillBlanks.get(ctx.chat.id);
        if (!pending) {
            return;
        }
        pendingFillBlanks.delete(ctx.chat.id);
        ctx.editMessageText("The missing word was *" + pending.answer + "*", { parse_mode: "Markdown" });
        ctx.reply("*" + pending.phrase + "*\n\n_" + pending.indonesian + '_', { parse_mode: "Markdown" });
        return;
    }

    const separatorIndex = ctx.callbackQuery.data.indexOf('|');
    const direction = ctx.callbackQuery.data.slice(0, separatorIndex);
    const answer = ctx.callbackQuery.data.slice(separatorIndex + 1);
    const isReverse = direction === 'id2en';

    const questionText = ctx.callbackQuery.message.text.split("\n\n")[1]
    console.log(questionText);

    const lookup = isReverse
        ? SentencesService.getOneSentenceByIndonesian(questionText)
        : SentencesService.getOneSentencByPhrase(questionText);

    lookup.then(result => {
            console.log(result)
            const correctAnswer = isReverse ? result.phrase : result.indonesian;
            if (answer == correctAnswer) {
                const choosenCompliments = complimentsBank[between(0, complimentsBank.length - 1)]
                ctx.editMessageText(choosenCompliments)
                ctx.reply("*" + result.phrase + "*\n\n_" + result.indonesian + '_', { parse_mode: "Markdown" })
            } else {
                ctx.editMessageText("Ups, you chose a wrong answer 🙈")
                ctx.reply("*" + result.phrase + "*\n\n_" + result.indonesian + '_', { parse_mode: "Markdown" })
            }
        })
});

function between(min, max) {
    return Math.floor(
        Math.random() * (max - min + 1) + min
    )
}

function pickBlankIndex(words) {
    const eligibleIndexes = words
        .map((word, index) => index)
        .filter(index => !STOPWORDS.has(words[index].toLowerCase()));
    const pool = eligibleIndexes.length > 0 ? eligibleIndexes : words.map((word, index) => index);
    return pool[between(0, pool.length - 1)];
}

function buildBlankedPhrase(phrase) {
    const words = phrase.split(' ');
    const blankIndex = pickBlankIndex(words);
    const answer = words[blankIndex];
    const placeholder = '_'.repeat(answer.length);
    const blanked = words.map((word, index) => index === blankIndex ? placeholder : word).join(' ');
    return { blanked, answer };
}

function getOneRandomQuestion(callback) {
    SentencesService.getOneSentence()
        .then(result => {
            SentencesService.getSentencesExcept(result[0])
                .then(hasil => {
                    const isReverse = Math.random() < 0.5;
                    const direction = isReverse ? 'id2en' : 'en2id';
                    const answerField = isReverse ? 'phrase' : 'indonesian';
                    const promptField = isReverse ? 'indonesian' : 'phrase';
                    const promptText = isReverse
                        ? "What's the English translation of this?"
                        : "What's the meaning of this phrase?";

                    const answers = [result[0], hasil[0], hasil[1], hasil[2]].map(sentence => sentence[answerField]);

                    const inKey = answers.map(answer => ([{
                        text: answer,
                        callback_data: direction + '|' + answer
                    }]));

                    const opts = {
                        parse_mode: "Markdown",
                        reply_markup: JSON.stringify({
                            inline_keyboard: ArrayUtils.shuffle(inKey)
                        })
                    };
                    callback(promptText + "\n\n*" + result[0][promptField] + "*", opts)
                }
                )
        })
        .catch(err => {
            console.log(generalErrorMessage)
        });
}

exports.sendBotMessage = function (chatId) {
    getOneRandomQuestion(function (message, opts) {
        bot.telegram.sendMessage(chatId, message, opts);
    });
};

bot.launch()