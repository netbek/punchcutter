const Promise = require('bluebird');
const SVGO = require('svgo');

const svgo = new SVGO();

/**
 *
 * @param   {string} data
 * @param   {Object} options
 * @returns {Promise}
 */
module.exports = (data, options) =>
  svgo.optimize(data).then((result) => Promise.resolve(result.data));
