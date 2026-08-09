# nyegerake-api

A Telegram bot + REST API for learning Indonesian phrases via quizzes. Phrases
("nyegerake") are stored in MongoDB; the bot quizzes users on their meaning
and a scheduled job pushes a daily quiz to a configured chat.

## Features

- **Telegram bot** (`service/BotService.js`, via [Telegraf](https://telegraf.js.org/))
  - `/quiz` — sends a random phrase with 4 multiple-choice answers (one
    correct, three random distractors) as an inline keyboard.
  - `/fillblank` — sends a random phrase with one word blanked out (shown as
    `_` per letter, plus its Indonesian meaning as a hint); reply with the
    missing word as plain text to check it. Matching is case-insensitive and
    ignores surrounding whitespace/trailing punctuation. Wrong guesses can be
    retried as many times as needed; a "Reveal answer" button is always
    attached to give up and see the answer. Starting a new `/fillblank`
    replaces any unanswered one.
  - `/add [Phrase] - [Meaning in Indonesian]` — adds a new phrase (admin only,
    checked against `ADMIN_SENDER_ID`).
  - `/bulk` — adds multiple phrases at once, one `Phrase - Meaning` pair per
    line.
  - On answering a quiz, replies with a random compliment (from
    `compliments.json`) if correct, or a "wrong answer" message otherwise,
    followed by the correct phrase/meaning.
- **REST API** (`index.js`, via [Express](https://expressjs.com/))
  - `GET /` — health check ("nyegerake service is running").
  - `GET /today` — returns a random phrase as JSON: `{ "phrase": ..., "indonesian": ... }`.
- **Scheduled quiz** — a daily [node-cron](https://www.npmjs.com/package/node-cron)
  job (`0 21 * * *`, i.e. 21:00 server time) sends a quiz to `SCHEDULED_CHAT_ID`.

## Project structure

```
index.js                   Express server + cron scheduler (entry point)
service/
  BotService.js             Telegram bot commands and quiz logic
  SentencesService.js        CRUD/query helpers over the sentence collection
model/
  SentencesModel.js          Mongoose schema for phrases (phrase, indonesian, created_at)
lib/
  config.js                  Reads Mongo connection settings from env vars
  db.js                      Connects mongoose to MongoDB
utils/
  ArrayUtils.js               Fisher-Yates shuffle (for quiz answer order)
  FileUtils.js                Loads compliments.json
compliments.json            Pool of "correct answer" compliment messages
deploy.sh                   SSH deploy script (git pull + npm install + pm2 restart)
Dockerfile                  Container build for the app
```

## Prerequisites

- Node.js and npm, or Docker.
- A MongoDB instance (e.g. [MongoDB Atlas](https://www.mongodb.com/atlas)).
- A Telegram bot token from [@BotFather](https://t.me/BotFather).

## Configuration

Copy `example.env` to `.env` and fill in the values:

```
# mongo
MONGO_URL="mongodb+srv://..."       # connection string, without the db name
MONGO_DB_NAME="awesome_db"

# telegram
MBOT_TOKEN="..."                    # bot token from BotFather
ADMIN_SENDER_ID="..."               # Telegram user id allowed to use /add
SCHEDULED_CHAT_ID="..."             # chat id that receives the daily quiz

# optional
PORT=3000                           # defaults to 3000
```

## Running locally

```
npm install
node index.js
```

The API listens on `http://localhost:3000` (or `$PORT`), and the bot starts
polling Telegram immediately.

## Running with Docker

```
docker build . -t nyegerake-api:1.0
docker run --env-file .env -p 3000:3000 -d nyegerake-api:1.0
```

## Deploying

`deploy.sh` SSHes into a remote host, pulls `main`, reinstalls dependencies,
and restarts the app under [pm2](https://pm2.keymetrics.io/) (process name
`nyegerake_bot`). It expects `DIGI_O_USERNAME` and `DIGI_O_IP` to be set in
the calling shell's environment.
