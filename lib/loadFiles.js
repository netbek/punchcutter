const _ = require('lodash');
const fs = require('fs-extra');
const globby = require('globby');
const Promise = require('bluebird');

/**
 *
 * @param   {Array} src
 * @returns {Promise}
 */
module.exports = function (src) {
  return globby(src).then(function (matches) {
    const files = _.map(matches, function (file) {
      return {path: file};
    });

    return Promise.mapSeries(files, function (file) {
      return Promise.props(
        _.assign(file, {data: fs.readFile(file.path, 'utf-8')})
      );
    });
  });
};
