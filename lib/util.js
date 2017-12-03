var _ = require('lodash');
var cheerio = require('cheerio');
var fs = require('fs-extra');
var globPromise = require('glob-promise');
var path = require('path');
var pngquant = require('pngquant');
var Promise = require('bluebird');
var streamifier = require('streamifier');
var svg2png = require('svg2png');
var SVGOptim = require('svgo');

Promise.promisifyAll(fs);

var svgo = new SVGOptim();

/**
 *
 * @param  {Array} patterns
 * @param  {Object} options
 * @returns {Promise}
 */
function multiGlob(patterns, options) {
  var matches = [];

  return Promise.mapSeries(patterns, function(pattern) {
    return globPromise(pattern, options).then(function(files) {
      matches = matches.concat(files);
    });
  }).then(function() {
    return Promise.resolve(matches);
  });
}

/**
 *
 * @param   {string} data
 * @param   {Object} options
 * @returns {Promise}
 */
function svgMin(data, options) {
  return new Promise(function(resolve, reject) {
    svgo.optimize(data, function(result) {
      if (result.error) {
        reject(result.error);
      } else {
        resolve(result.data);
      }
    });
  });
}

/**
 *
 * @param  {string} src - Soure file path
 * @param  {string} destDir - Destination directory path
 * @param  {number} scale
 * @param  {string} suffix
 * @returns {Promise}
 */
function svg2pngMin(src, destDir, scale, suffix) {
  var extname = path.extname(src);
  var basename = path.basename(src, extname);
  var dest = path.join(
    destDir,
    basename + (_.isUndefined(suffix) ? '' : suffix) + '.png'
  );

  return fs
    .mkdirpAsync(destDir)
    .then(function() {
      return fs.readFileAsync(src, 'utf-8');
    })
    .then(function(data) {
      var resize;

      if (scale) {
        var $svg = cheerio.load(data, {
          xmlMode: true
        })('svg');

        // https://github.com/domenic/svg2png/blob/v3.0.1/lib/converter.js#L90
        var width = $svg.attr('width');
        var height = $svg.attr('height');
        var widthIsPercent = /%\s*$/.test(width);
        var heightIsPercent = /%\s*$/.test(height);
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
      var buffer = Buffer.from(data, 'utf-8');

      return svg2png(buffer, resize);
    })
    .then(function(buffer) {
      return new Promise(function(resolve, reject) {
        var writeStream = fs.createWriteStream(dest);

        writeStream.on('close', function() {
          resolve();
        });

        streamifier
          .createReadStream(buffer)
          // Minify PNG.
          .pipe(new pngquant([256]))
          .pipe(writeStream);
      });
    });
}

module.exports = {
  multiGlob: multiGlob,
  svg2pngMin: svg2pngMin,
  svgMin: svgMin
};
