'use strict';

const fs = require('fs');

const COMPLIMENT_PATH = 'compliments.json';

exports.getCompliments = function (callback) {
    fs.readFile(COMPLIMENT_PATH, (err, content) => {
        if (err) return console.log('Error loading compliments file:', err);
        callback(JSON.parse(content));
    });
}