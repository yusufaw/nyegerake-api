'use strict';

const SentencesModel = require('../model/SentencesModel');

const SentencesService = () => {
  const addNewSentence = data => {
    return new Promise((resolve, reject) => {
      let dt = new SentencesModel(data);
      dt.save()
        .then(result => {
          resolve(result);
        })
        .catch(err => {
          reject(err);
        });
    });
  };

  const removeSentence = data => {
    return new Promise((resolve, reject) => {
      SentencesModel.findOneAndRemove({
        phrase: data.phrase
      })
        .then(result => {
          resolve(result);
        })
        .catch(err => {
          reject(err);
        });
    });
  };

  const getOneSentence = () => {
    return new Promise((resolve, reject) => {
      SentencesModel.aggregate(
        [{ $sample: { size: 1 } }]
      )
        .then(result => {
          resolve(result);
        })
        .catch(err => {
          reject(err);
        });
    });
  }

  const addBulkSentences = data => {
    return new Promise((resolve, reject) => {
      SentencesModel.insertMany(data)
        .then(result => {
          resolve(result);
        })
        .catch(err => {
          reject(err);
        });
    });
  };

  const getOneSentenceExcept = (data) => {
    return new Promise((resolve, reject) => {
      SentencesModel.aggregate(
        [{ $sample: { size: 1 } }, { '$match': { "phrase": { $ne: data.phrase } } }]
      )
        .then(result => {
          resolve(result);
        })
        .catch(err => {
          reject(err);
        });
    });
  }

  return {
    addNewSentence: addNewSentence,
    removeSentence: removeSentence,
    getOneSentence: getOneSentence,
    addBulkSentences: addBulkSentences,
    getOneSentenceExcept: getOneSentenceExcept
  }
};

module.exports = SentencesService();
