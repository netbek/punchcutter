var _ = require('lodash');
var globPromise = require('glob-promise');
var Promise = require('bluebird');

/**
 *
 * @param  {Array} patterns
 * @param  {Object} options
 * @return {Promise}
 */
function multiGlob(patterns, options) {
  var matches = [];

  return Promise.mapSeries(patterns, function (pattern) {
      return globPromise(pattern, options)
        .then(function (files) {
          matches = matches.concat(files);
        });
    })
    .then(function () {
      return Promise.resolve(matches);
    });
}

module.exports = {
  multiGlob: multiGlob
};
