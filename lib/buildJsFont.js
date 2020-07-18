/* eslint no-console: 0 */
const _ = require('lodash');
const chalk = require('chalk');
const cheerio = require('cheerio');
const fs = require('fs-extra');
const path = require('path');
const Promise = require('bluebird');
const loadFiles = require('./loadFiles');
const svgMin = require('./svgMin');

Promise.promisifyAll(fs);

/**
 *
 * @param   {Object} config
 * @returns {Promise}
 */
module.exports = function (config) {
  console.log(`Building JS font: ${chalk.cyan(config.name)}`);

  return loadFiles(config.src)
    .then(function (files) {
      return Promise.mapSeries(files, function (file) {
        // Minify SVG.
        return Promise.props(_.assign(file, {data: svgMin(file.data)}));
      });
    })
    .then(function (files) {
      const map = {};

      _.forEach(files, function (file) {
        const extname = path.extname(file.path);
        const basename = path.basename(file.path, extname);
        const {data} = file;

        map[basename] = {
          viewBox: '',
          data: ''
        };

        const $svg = cheerio.load(data, {
          xmlMode: true
        })('svg');

        if ($svg.length) {
          map[basename].viewBox = $svg.attr('viewBox');
          map[basename].data = $svg.contents().toString();
        }
      });

      const data =
        config.build.prepend +
        JSON.stringify(map, null, 2) +
        config.build.append;
      const distPath = path.resolve(config.build.dist, config.name + '.js');
      const distDir = path.dirname(distPath);

      return fs.mkdirpAsync(distDir).then(function () {
        return fs.writeFileAsync(distPath, data, 'utf-8');
      });
    });
};
