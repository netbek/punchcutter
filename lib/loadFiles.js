const _ = require('lodash');
const fs = require('fs-extra');
const Promise = require('bluebird');
const multiGlob = require('./multiGlob');

Promise.promisifyAll(fs);

/**
 *
 * @param   {Array} src
 * @returns {Promise}
 */
module.exports = function(src) {
  return multiGlob(src).then(function(matches) {
    const files = _.map(matches, function(file) {
      return {path: file};
    });

    return Promise.mapSeries(files, function(file) {
      return Promise.props(
        _.assign(file, {data: fs.readFileAsync(file.path, 'utf-8')})
      );
    });
  });
};
