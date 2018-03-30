const Promise = require('bluebird');
const SVGOptim = require('svgo');

const svgo = new SVGOptim();

/**
 *
 * @param   {string} data
 * @param   {Object} options
 * @returns {Promise}
 */
module.exports = function(data, options) {
  return new Promise(function(resolve, reject) {
    svgo.optimize(data, function(result) {
      if (result.error) {
        reject(result.error);
      } else {
        resolve(result.data);
      }
    });
  });
};
