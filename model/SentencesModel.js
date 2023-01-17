const mongoose = require('../lib/db');

module.exports = mongoose.model('sentence', {
  phrase: String,
  indonesian: String,
  created_at: Date
});
