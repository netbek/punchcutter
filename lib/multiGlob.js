const fs = require('fs-extra');
const globPromise = require('glob-promise');
const Promise = require('bluebird');

Promise.promisifyAll(fs);

/**
 *
 * @param   {Array} patterns
 * @param   {Object} options
 * @returns {Promise}
 */
module.exports = function(patterns, options) {
  let matches = [];

  return Promise.mapSeries(patterns, function(pattern) {
    return globPromise(pattern, options).then(function(files) {
      matches = matches.concat(files);
    });
  }).then(function() {
    return Promise.resolve(matches);
  });
};
