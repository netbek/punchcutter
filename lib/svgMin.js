const Promise = require('bluebird');
const {optimize} = require('svgo');

/**
 *
 * @param   {string} data
 * @returns {Promise}
 */
module.exports = (data) =>
  new Promise((resolve) => {
    const result = optimize(data, {
      plugins: [
        {
          name: 'preset-default',
          params: {
            overrides: {
              removeViewBox: false
            }
          }
        }
      ]
    });

    resolve(result.data);
  });
