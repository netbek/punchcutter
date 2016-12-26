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

/**
 *
 * @see https://github.com/petkaantonov/bluebird/issues/332#issuecomment-229833058
 * @param  {Stream} stream
 * @return {Promise}
 */
function streamToPromise(stream) {
  return new Promise(function (resolve, reject) {
    stream.on('end', resolve);
    stream.on('error', reject);
    stream.resume();
  });
}

module.exports = {
  multiGlob: multiGlob,
  streamToPromise: streamToPromise
};
