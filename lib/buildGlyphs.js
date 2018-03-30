/* eslint no-console: 0 */
const _ = require('lodash');
const chalk = require('chalk');
const DirectoryColorfy = require('directory-colorfy');
const fs = require('fs-extra');
const path = require('path');
const Promise = require('bluebird');
const loadFiles = require('./loadFiles');
const {multiGlob, svg2pngMin, svgMin} = require('./util');

Promise.promisifyAll(fs);

/**
 *
 * @param   {Object} config
 * @returns {Promise}
 */
module.exports = function(config) {
  const tempDir1 = path.resolve(config.build.svg.dist, '_temp-1');
  const tempDir2 = path.resolve(config.build.svg.dist, '_temp-2');
  const svgDistDirs = []; // Destination directories of colorized SVG.
  const colors = _.map(config.build.colors, function(value, key) {
    return {
      name: key.replace(/\-/g, '_'),
      hex: value
    };
  });

  let srcFiles;

  // Delete temp directories.
  return (
    Promise.mapSeries([tempDir1, tempDir2], function(file) {
      return fs.removeAsync(file);
    })
      .then(function() {
        const dirs = [
          tempDir1,
          tempDir2,
          config.build.png.dist,
          config.build.svg.dist
        ];

        // Create temp and destination directories.
        return Promise.mapSeries(dirs, function(dir) {
          return fs.mkdirpAsync(dir);
        });
      })
      // Find source files.
      .then(function() {
        return multiGlob(config.src);
      })
      .then(function(files) {
        srcFiles = files;

        // If colorizing.
        if (colors.length) {
          return Promise.mapSeries(colors, function(color) {
            const svgDistDir = path.resolve(
              config.build.svg.dist,
              color.name.replace(/_/g, '-')
            );
            svgDistDirs.push(svgDistDir);

            return fs
              .mkdirpAsync(svgDistDir)
              .then(function() {
                return Promise.mapSeries(srcFiles, function(file) {
                  // Add colors to filename for DirectoryColorfy.
                  const extname = path.extname(file);
                  const basename = path.basename(file, extname);
                  const copy = path.resolve(
                    tempDir1,
                    basename + '.colors-' + color.name + extname
                  );

                  console.log(
                    'Coloring glyph: ' +
                      chalk.cyan(basename) +
                      ' of ' +
                      chalk.cyan(config.name) +
                      ' > ' +
                      chalk.cyan(color.name)
                  );

                  return fs.copyAsync(file, copy);
                });
              })
              .then(function() {
                return loadFiles([path.resolve(tempDir1, '*.svg')]);
              })
              .then(function(files) {
                return Promise.mapSeries(files, function(file) {
                  // Minify SVG.
                  return Promise.props(
                    _.assign(file, {data: svgMin(file.data)})
                  );
                });
              })
              .then(function(files) {
                return Promise.mapSeries(files, function(file) {
                  return fs.writeFileAsync(file.path, file.data, 'utf-8');
                });
              })
              .then(function() {
                // Colorfy directory of SVGs.
                const dc = new DirectoryColorfy(tempDir1, tempDir2, {
                  colors: {[color.name]: color.hex}
                });

                return dc.convert();
              })
              .then(function() {
                // Remove color suffix from SVG and move to color directory.
                return Promise.mapSeries(srcFiles, function(file) {
                  const extname = path.extname(file);
                  const basename = path.basename(file, extname);

                  const srcPath = path.resolve(
                    tempDir2,
                    basename + '-' + color.name + '.svg'
                  );
                  const distPath = path.resolve(svgDistDir, basename + '.svg');

                  return fs.renameAsync(srcPath, distPath);
                });
              });
          });
        }

        // If not colorizing (no colors were defined in config), then create
        // minified SVG without color applied.
        return Promise.mapSeries(files, function(file) {
          const basename = path.basename(file);
          const svgDistPath = path.join(config.build.svg.dist, basename);

          return fs
            .readFileAsync(file, 'utf-8')
            .then(function(data) {
              // Minify SVG.
              return svgMin(data);
            })
            .then(function(data) {
              return fs.writeFileAsync(svgDistPath, data, 'utf-8');
            })
            .then(function() {
              if (_.includes(config.build.types, 'png')) {
                // Convert SVG to PNG.
                return svg2pngMin(
                  svgDistPath,
                  config.build.png.dist,
                  config.build.png.scale
                );
              }

              return Promise.resolve(true);
            });
        });
      })
      .then(function() {
        // If colorizing and generating PNG.
        if (_.includes(config.build.types, 'png') && svgDistDirs.length) {
          const src = _.map(svgDistDirs, function(dir) {
            return path.resolve(dir, '*.svg');
          });
          const base = path.resolve(svgDistDirs[0], '..');

          return multiGlob(src).then(function(files) {
            return Promise.mapSeries(files, function(file) {
              const pngDistDir = path.dirname(
                path.join(config.build.png.dist, file.substring(base.length))
              );

              // Convert SVG to PNG.
              return svg2pngMin(file, pngDistDir, config.build.png.scale);
            });
          });
        }

        return new Promise.resolve(true);
      })
      .then(function() {
        const dirs = [tempDir1, tempDir2];

        // Delete destination directories that weren't used.
        if (!_.includes(config.build.types, 'png')) {
          dirs.push(config.build.png.dist);
        }
        if (!_.includes(config.build.types, 'svg')) {
          dirs.push(config.build.svg.dist);
        }

        // Clean up.
        return Promise.mapSeries(dirs, function(file) {
          return fs.removeAsync(file);
        });
      })
  );
};
