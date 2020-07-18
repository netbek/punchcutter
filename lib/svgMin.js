const Promise = require('bluebird');
const SVGO = require('svgo');

const svgo = new SVGO({
  plugins: [
    {
      removeViewBox: false
    }
  ]
});

/**
 *
 * @param   {string} data
 * @returns {Promise}
 */
module.exports = (data) =>
  svgo.optimize(data).then((result) => Promise.resolve(result.data));
