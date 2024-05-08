/* eslint no-console: 0 */
const _ = require('lodash');
const chalk = require('chalk');
const cheerio = require('cheerio');
const fs = require('fs-extra');
const path = require('path');
const Promise = require('bluebird');
const loadFiles = require('./loadFiles');
const svgMin = require('./svgMin');

/**
 *
 * @param   {Object} config
 * @returns {Promise}
 */
module.exports = async function (config) {
  console.log(`Building JS font: ${chalk.cyan(config.name)}`);

  const {
    build: {concat = true, idTransform = (id) => id}
  } = config;

  const srcFiles = await loadFiles(config.src);

  const files = await Promise.mapSeries(srcFiles, (file) => {
    // Minify SVG.
    return Promise.props(_.assign(file, {data: svgMin(file.data)}));
  });

  const map = Object.fromEntries(
    files
      .map((file) => {
        const basename = idTransform(
          path.basename(file.path, path.extname(file.path))
        );
        const {data} = file;

        const $svg = cheerio.load(data, {
          xmlMode: true
        })('svg');

        if ($svg.length) {
          return [
            basename,
            {
              viewBox: $svg.attr('viewBox'),
              data: $svg.contents().toString()
            }
          ];
        }
      })
      .filter(Boolean)
  );

  if (concat) {
    const distPath = path.resolve(config.build.dist, config.name + '.js');
    const distDir = path.dirname(distPath);

    await fs.mkdirp(distDir);

    const data =
      config.build.prepend + JSON.stringify(map, null, 2) + config.build.append;

    return fs.writeFile(distPath, data, 'utf-8');
  } else {
    const distDir = path.resolve(config.build.dist, config.name);

    await fs.mkdirp(distDir);

    return Promise.mapSeries(Object.entries(map), ([basename, iconData]) => {
      const data =
        config.build.prepend +
        JSON.stringify(iconData, null, 2) +
        config.build.append;

      return fs.writeFile(path.join(distDir, basename + '.js'), data, 'utf-8');
    });
  }
};
