/* eslint no-console: 0 */
const _ = require('lodash');
const chalk = require('chalk');
const DirectoryColorfy = require('directory-colorfy');
const fs = require('fs-extra');
const globby = require('globby');
const path = require('path');
const Promise = require('bluebird');
const loadFiles = require('./loadFiles');
const svg2pngMin = require('./svg2pngMin');
const svgMin = require('./svgMin');
const {PNG, SVG} = require('./constants');

/**
 *
 * @param   {Object} config
 * @returns {Promise}
 */
module.exports = function (config) {
  const svgBuilds = config.build.builds.filter((build) => build.type === SVG);
  const svgBuildsDist = svgBuilds.map((build) => build.dist);

  const pngBuilds = config.build.builds.filter((build) => build.type === PNG);
  const pngBuildsDist = pngBuilds.map((build) => build.dist);

  const colors = _.map(config.build.colors, function (value, key) {
    return {
      name: key.replace(/\-/g, '_'),
      hex: value
    };
  });

  const tempDir1 = path.resolve(svgBuilds[0].dist, '_temp-1');
  const tempDir2 = path.resolve(svgBuilds[0].dist, '_temp-2');
  const svgDistDirs = []; // Destination directories of colorized SVG.

  let srcFiles;

  // Delete temp directories.
  return (
    Promise.mapSeries([tempDir1, tempDir2], function (file) {
      return fs.remove(file);
    })
      .then(function () {
        const dirs = [tempDir1, tempDir2].concat(svgBuildsDist, pngBuildsDist);

        // Create temp and destination directories.
        return Promise.mapSeries(dirs, function (dir) {
          return fs.mkdirp(dir);
        });
      })
      // Find source files.
      .then(() => globby(config.src))
      .then(function (files) {
        srcFiles = files;

        // If colorizing.
        if (colors.length) {
          return Promise.mapSeries(colors, function (color) {
            const svgDistDir = path.resolve(
              svgBuilds[0].dist,
              color.name.replace(/_/g, '-')
            );
            svgDistDirs.push(svgDistDir);

            return fs
              .mkdirp(svgDistDir)
              .then(function () {
                return Promise.mapSeries(srcFiles, function (file) {
                  // Add colors to filename for DirectoryColorfy.
                  const extname = path.extname(file);
                  const basename = path.basename(file, extname);
                  const copy = path.resolve(
                    tempDir1,
                    basename + '.colors-' + color.name + extname
                  );

                  console.log(
                    `Building SVG glyph: ${chalk.cyan(
                      config.name
                    )} > ${chalk.cyan(basename)} > ${chalk.cyan(color.name)}`
                  );

                  return fs.copy(file, copy);
                });
              })
              .then(function () {
                return loadFiles([path.resolve(tempDir1, '*.svg')]);
              })
              .then(function (files) {
                return Promise.mapSeries(files, function (file) {
                  // Minify SVG.
                  return Promise.props(
                    _.assign(file, {data: svgMin(file.data)})
                  );
                });
              })
              .then(function (files) {
                return Promise.mapSeries(files, function (file) {
                  return fs.writeFile(file.path, file.data, 'utf-8');
                });
              })
              .then(function () {
                // Colorfy directory of SVGs.
                const dc = new DirectoryColorfy(tempDir1, tempDir2, {
                  colors: {[color.name]: color.hex}
                });

                return dc.convert();
              })
              .then(function () {
                // Remove color suffix from SVG and move to color directory.
                return Promise.mapSeries(srcFiles, function (file) {
                  const extname = path.extname(file);
                  const basename = path.basename(file, extname);

                  const srcPath = path.resolve(
                    tempDir2,
                    basename + '-' + color.name + '.svg'
                  );
                  const distPath = path.resolve(svgDistDir, basename + '.svg');

                  return fs.rename(srcPath, distPath);
                });
              });
          });
        }

        // If not colorizing (no colors were defined in config), then create
        // minified SVG without color applied.
        return Promise.mapSeries(files, function (file) {
          const extname = path.extname(file);
          const basename = path.basename(file);
          const svgDistPath = path.join(svgBuilds[0].dist, basename);

          console.log(
            `Building PNG glyph: ${chalk.cyan(config.name)} > ${chalk.cyan(
              path.basename(file, extname)
            )}`
          );

          return fs
            .readFile(file, 'utf-8')
            .then(function (data) {
              // Minify SVG.
              return svgMin(data);
            })
            .then(function (data) {
              return fs.writeFile(svgDistPath, data, 'utf-8');
            })
            .then(function () {
              if (pngBuilds.length) {
                return Promise.mapSeries(pngBuilds, function (pngBuild) {
                  // Convert SVG to PNG.
                  return svg2pngMin(svgDistPath, pngBuild.dist, pngBuild.scale);
                });
              }

              return Promise.resolve(true);
            });
        });
      })
      .then(function () {
        // If colorizing and generating PNG.
        if (pngBuilds.length && svgDistDirs.length) {
          const src = _.map(svgDistDirs, function (dir) {
            return path.resolve(dir, '*.svg');
          });
          const base = path.resolve(svgDistDirs[0], '..');

          return globby(src).then(function (files) {
            return Promise.mapSeries(pngBuilds, function (pngBuild, i) {
              console.log(
                `Building PNG glyphs [${i + 1}/${
                  pngBuilds.length
                }]: ${chalk.cyan(config.name)}`
              );

              return Promise.mapSeries(files, function (file) {
                const pngDistDir = path.dirname(
                  path.join(pngBuild.dist, file.substring(base.length))
                );

                // Convert SVG to PNG.
                return svg2pngMin(file, pngDistDir, pngBuild.scale);
              });
            });
          });
        }

        return Promise.resolve(true);
      })
      .then(function () {
        let dirs = [tempDir1, tempDir2];

        // If no PNG builds, then delete PNG dist directories.
        if (!pngBuilds.length) {
          dirs = dirs.concat(pngBuildsDist);
        }

        // If no SVG builds, then delete SVG dist directories.
        if (!svgBuilds.length) {
          dirs = dirs.concat(svgBuildsDist);
        }

        // Clean up.
        return Promise.mapSeries(dirs, function (file) {
          return fs.remove(file);
        });
      })
  );
};
