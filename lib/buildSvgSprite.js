/* eslint no-console: 0 */
const _ = require('lodash');
const chalk = require('chalk');
const cheerio = require('cheerio');
const fs = require('fs-extra');
const path = require('path');
const Promise = require('bluebird');
const svgstore = require('svgstore');
const loadFiles = require('./loadFiles');
const svgMin = require('./svgMin');

Promise.promisifyAll(fs);

/**
 *
 * @param   {Object} config
 * @returns {Promise}
 */
module.exports = function (config) {
  return loadFiles(config.src)
    .then(function (files) {
      return Promise.mapSeries(files, function (file) {
        let {data} = file;

        if (config.build.monochrome) {
          // Remove fill attribute.
          const $ = cheerio.load(data, {
            xmlMode: true
          });
          $('[fill]').removeAttr('fill');
          data = $.xml();
        }

        // Minify SVG.
        return Promise.props(_.assign(file, {data: svgMin(data)}));
      });
    })
    .then(function (files) {
      return Promise.mapSeries(config.build.builds, function (build) {
        console.log(`Building SVG sprite: ${chalk.cyan(config.name)}`);

        const store = svgstore();

        files.forEach(function (file) {
          const extname = path.extname(file.path);
          const basename = path.basename(file.path, extname);

          store.add(build.idPrefix + basename, file.data);
        });

        const data = store.toString();
        const distPath = path.resolve(build.dist, config.name + '.svg');
        const distDir = path.dirname(distPath);

        return fs.mkdirpAsync(distDir).then(function () {
          return fs.writeFileAsync(distPath, data, 'utf-8');
        });
      });
    });
};
