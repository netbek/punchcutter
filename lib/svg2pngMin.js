const _ = require('lodash');
const cheerio = require('cheerio');
const fs = require('fs-extra');
const path = require('path');
const pngquant = require('pngquant');
const Promise = require('bluebird');
const streamifier = require('streamifier');
const svg2png = require('svg2png');

Promise.promisifyAll(fs);

/**
 *
 * @param   {string} src - Soure file path
 * @param   {string} destDir - Destination directory path
 * @param   {number} scale
 * @param   {string} suffix
 * @returns {Promise}
 */
module.exports = function (src, destDir, scale, suffix) {
  const extname = path.extname(src);
  const basename = path.basename(src, extname);
  const dest = path.join(
    destDir,
    basename + (_.isUndefined(suffix) ? '' : suffix) + '.png'
  );

  return fs
    .mkdirpAsync(destDir)
    .then(function () {
      return fs.readFileAsync(src, 'utf-8');
    })
    .then(function (data) {
      let resize;

      if (scale) {
        const $svg = cheerio.load(data, {
          xmlMode: true
        })('svg');

        // https://github.com/domenic/svg2png/blob/v3.0.1/lib/converter.js#L90
        let width = $svg.attr('width');
        let height = $svg.attr('height');
        const widthIsPercent = /%\s*$/.test(width);
        const heightIsPercent = /%\s*$/.test(height);
        width = !widthIsPercent && parseFloat(width);
        height = !heightIsPercent && parseFloat(height);

        if (width && height) {
          resize = {
            width: width * scale,
            height: height * scale
          };
        }
      }

      // Convert SVG to PNG.
      const buffer = Buffer.from(data, 'utf-8');

      return svg2png(buffer, resize);
    })
    .then(function (buffer) {
      return new Promise(function (resolve, reject) {
        const writeStream = fs.createWriteStream(dest);

        writeStream.on('close', function () {
          resolve();
        });

        streamifier
          .createReadStream(buffer)
          // Minify PNG.
          .pipe(new pngquant([256]))
          .pipe(writeStream);
      });
    });
};
