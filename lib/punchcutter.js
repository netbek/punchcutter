var _ = require('lodash');
var chalk = require('chalk');
var cheerio = require('cheerio');
var del = require('del');
var DirectoryColorfy = require('directory-colorfy');
var fs = require('fs-extra');
var multiGlob = require('./util').multiGlob;
var path = require('path');
var Promise = require('bluebird');
var svg2pngMin = require('./util').svg2pngMin;
var svgMin = require('./util').svgMin;
var svgstore = require('svgstore');
var webfont = require('grunt-webfont');

Promise.promisifyAll(fs);

/**
 *
 * @returns {Punchcutter}
 */
function Punchcutter() {}

Punchcutter.prototype = {
  constructor: Punchcutter,
  /**
   *
   * @param  {Array} src
   * @returns {Promise}
   */
  loadFiles: function (src) {
    return multiGlob(src)
      .then(function (matched) {
        var files = [];

        _.forEach(matched, function (file) {
          files.push({
            path: file
          });
        });

        return Promise.mapSeries(files, function (file) {
          file.data = fs.readFileAsync(file.path, 'utf-8');

          return Promise.props(file);
        });
      });
  },
  /**
   *
   * @param  {Object} config
   * @returns {Promise}
   */
  buildWebfonts: function (config) {
    console.log('Building web font: ' + chalk.cyan(config.name));

    return multiGlob(config.src)
      .then(function (files) {
        return new Promise(function (resolve, reject) {
          var tasks = {};

          webfont({
            registerMultiTask: function (name, desc, fn) {
              tasks[name] = fn.bind({
                async: function () {
                  return function () {
                    resolve();
                  };
                },
                requiresConfig: function () {
                  return true;
                },
                data: {
                  src: config.src,
                  dest: config.font.font.dist,
                  destCss: config.font.css.dist
                },
                options: function () {
                  // https://github.com/sapegin/grunt-webfont#options
                  var options = _.pick(config.font, [
                    'codepoints',
                    'codepointsFile',
                    'embed',
                    'htmlDemo',
                    'order',
                    'relativeFontPath',
                    'stylesheets',
                    'syntax',
                    'templateOptions',
                    'types'
                  ]);

                  options.font = config.name;

                  options.logger = {
                    warn: function () {
                      reject();
                    },
                    error: function () {
                      reject();
                    },
                    log: _.noop,
                    verbose: _.noop
                  };

                  return options;
                },
                name: name,
                target: config.font.font.dist,
                filesSrc: files
              });
            }
          });

          tasks.webfont();
        });
      });
  },
  /**
   *
   * @param  {Object} config
   * @returns {Promise}
   */
  buildSprite: function (config) {
    console.log('Building sprite: ' + chalk.cyan(config.name));

    return this.loadFiles(config.src)
      .then(function (files) {
        return Promise.mapSeries(files, function (file) {
          var data = file.data;

          if (config.sprite.monochrome) {
            // Remove fill attribute.
            var $ = cheerio.load(data, {
              xmlMode: true
            });
            $('[fill]').removeAttr('fill');
            data = $.xml();
          }

          // Minify SVG.
          file.data = svgMin(data);

          return Promise.props(file);
        });
      })
      .then(function (files) {
        var store = svgstore();

        _.forEach(files, function (file) {
          var extname = path.extname(file.path);
          var basename = path.basename(file.path, extname);

          store.add(config.sprite.svg.idPrefix + basename, file.data);
        });

        var data = store.toString();
        var distPath = path.resolve(config.sprite.svg.dist, config.name + '.svg');
        var distDir = path.dirname(distPath);

        return fs.mkdirpAsync(distDir)
          .then(function () {
            return fs.writeFileAsync(distPath, data, 'utf-8');
          });
      });
  },
  /**
   *
   * @param  {Object} config
   * @returns {Promise}
   */
  buildGlyphs: function (config) {
    var loadFiles = this.loadFiles;
    var tempDir1 = path.resolve(config.glyph.svg.dist, '_temp-1');
    var tempDir2 = path.resolve(config.glyph.svg.dist, '_temp-2');
    var srcFiles;
    var svgDistDirs = []; // Destination directories of colorized SVG.

    var colors = _.map(config.glyph.colors, function (value, key) {
      return {
        name: key.replace(/\-/g, '_'),
        hex: value
      };
    });

    // Delete temp directories.
    return del([
        tempDir1,
        tempDir2
      ])
      .then(function () {
        var dirs = [
          tempDir1,
          tempDir2,
          config.glyph.png.dist,
          config.glyph.svg.dist
        ];

        // Create temp and destination directories.
        return Promise.mapSeries(dirs, function (dir) {
          return fs.mkdirpAsync(dir);
        });
      })
      // Find source files.
      .then(function () {
        return multiGlob(config.src);
      })
      .then(function (files) {
        srcFiles = files;

        // If colorizing.
        if (colors.length) {
          return Promise.mapSeries(colors, function (color) {
            var svgDistDir = path.resolve(config.glyph.svg.dist, color.name.replace(/_/g, '-'));
            svgDistDirs.push(svgDistDir);

            return fs.mkdirpAsync(svgDistDir)
              .then(function () {
                return Promise.mapSeries(srcFiles, function (file) {
                  // Add colors to filename for DirectoryColorfy.
                  var extname = path.extname(file);
                  var basename = path.basename(file, extname);
                  var copy = path.resolve(tempDir1, basename + '.colors-' + color.name + extname);

                  console.log('Coloring glyph: ' + chalk.cyan(basename) + ' of ' + chalk.cyan(config.name) + ' > ' + chalk.cyan(color.name));

                  return fs.copyAsync(file, copy);
                });
              })
              .then(function () {
                return loadFiles([path.resolve(tempDir1, '*.svg')]);
              })
              .then(function (files) {
                return Promise.mapSeries(files, function (file) {
                  // Minify SVG.
                  file.data = svgMin(file.data);

                  return Promise.props(file);
                });
              })
              .then(function (files) {
                return Promise.mapSeries(files, function (file) {
                  return fs.writeFileAsync(file.path, file.data, 'utf-8');
                });
              })
              .then(function () {
                var colors = {};
                colors[color.name] = color.hex;

                // Colorfy directory of SVGs.
                var dc = new DirectoryColorfy(tempDir1, tempDir2, {
                  colors: colors
                });

                return dc.convert();
              })
              .then(function () {
                // Remove color suffix from SVG and move to color directory.
                return Promise.mapSeries(srcFiles, function (file) {
                  var extname = path.extname(file);
                  var basename = path.basename(file, extname);

                  var srcPath = path.resolve(tempDir2, basename + '-' + color.name + '.svg');
                  var distPath = path.resolve(svgDistDir, basename + '.svg');

                  return fs.renameAsync(srcPath, distPath);
                });
              });
          });
        }

        // If not colorizing (no colors were defined in config), then create
        // minified SVG without color applied.
        return Promise.mapSeries(files, function (file) {
          var basename = path.basename(file);
          var svgDistPath = path.join(config.glyph.svg.dist, basename);

          return fs.readFileAsync(file, 'utf-8')
            .then(function (data) {
              // Minify SVG.
              return svgMin(data);
            })
            .then(function (data) {
              return fs.writeFileAsync(svgDistPath, data, 'utf-8');
            })
            .then(function () {
              if (_.includes(config.glyph.types, 'png')) {
                // Convert SVG to PNG.
                return svg2pngMin(svgDistPath, config.glyph.png.dist, config.glyph.png.scale);
              }

              return Promise.resolve(true);
            });
        });
      })
      .then(function () {
        // If colorizing and generating PNG.
        if (_.includes(config.glyph.types, 'png') && svgDistDirs.length) {
          var src = _.map(svgDistDirs, function (dir) {
            return path.resolve(dir, '*.svg');
          });
          var base = path.resolve(svgDistDirs[0], '..');

          return multiGlob(src)
            .then(function (files) {
              return Promise.mapSeries(files, function (file) {
                var pngDistDir = path.dirname(path.join(config.glyph.png.dist, file.substring(base.length)));

                // Convert SVG to PNG.
                return svg2pngMin(file, pngDistDir, config.glyph.png.scale);
              });
            });
        }

        return new Promise.resolve(true);
      })
      .then(function () {
        var dirs = [
          tempDir1,
          tempDir2
        ];

        // Delete destination directories that weren't used.
        if (!_.includes(config.glyph.types, 'png')) {
          dirs.push(config.glyph.png.dist);
        }
        if (!_.includes(config.glyph.types, 'svg')) {
          dirs.push(config.glyph.svg.dist);
        }

        // Clean up.
        return del(dirs);
      });
  },
  /**
   *
   * @param  {Object} config
   * @returns {Promise}
   */
  buildJsFont: function (config) {
    console.log('Building JS font: ' + chalk.cyan(config.name));

    return this.loadFiles(config.src)
      .then(function (files) {
        return Promise.mapSeries(files, function (file) {
          // Minify SVG.
          file.data = svgMin(file.data);

          return Promise.props(file);
        });
      })
      .then(function (files) {
        var map = {};

        _.forEach(files, function (file) {
          var extname = path.extname(file.path);
          var basename = path.basename(file.path, extname);
          var data = file.data;

          map[basename] = {
            viewBox: '',
            data: ''
          };

          var $svg = cheerio.load(file.data, {
            xmlMode: true
          })('svg');

          if ($svg.length) {
            map[basename].viewBox = $svg.attr('viewBox');
            map[basename].data = $svg.contents().toString();
          }
        });

        var data = config.js.prepend + JSON.stringify(map, null, 2) + config.js.append;
        var distPath = path.resolve(config.js.dist, config.name + '.js');
        var distDir = path.dirname(distPath);

        return fs.mkdirpAsync(distDir)
          .then(function () {
            return fs.writeFileAsync(distPath, data, 'utf-8');
          });
      });
  },
  /**
   *
   * @param  {Object} config
   * @returns {Promise}
   */
  build: function (config) {
    config.font = _.assign({
      css: {
        dist: path.resolve(config.dist, config.name, 'font')
      },
      font: {
        dist: path.resolve(config.dist, config.name, 'font')
      },
      embed: false,
      htmlDemo: false,
      order: ['eot', 'woff2', 'woff', 'ttf', 'svg'],
      relativeFontPath: null,
      stylesheets: ['scss'],
      syntax: 'bem',
      templateOptions: {},
      types: ['eot', 'woff2', 'woff', 'ttf', 'svg']
    }, config.font || {});

    config.glyph = _.assign({
      png: {
        dist: path.resolve(config.dist, config.name, 'glyph', 'png'),
        scale: null
      },
      svg: {
        dist: path.resolve(config.dist, config.name, 'glyph', 'svg')
      },
      types: ['png', 'svg']
    }, config.glyph || {});

    config.js = _.assign({
      dist: path.resolve(config.dist, config.name, 'js'),
      prepend: 'module.exports = ',
      append: ';'
    }, config.js || {});

    config.sprite = _.assign({
      monochrome: false,
      svg: {
        dist: path.resolve(config.dist, config.name, 'sprite'),
        idPrefix: ''
      },
      types: ['svg']
    }, config.sprite || {});

    var promises = [];

    if (_.includes(config.types, 'font')) {
      promises.push(this.buildWebfonts(config));
    }
    if (_.includes(config.types, 'glyph')) {
      promises.push(this.buildGlyphs(config));
    }
    if (_.includes(config.types, 'js')) {
      promises.push(this.buildJsFont(config));
    }
    if (_.includes(config.types, 'sprite')) {
      promises.push(this.buildSprite(config));
    }

    return Promise.all(promises);
  }
};

module.exports = {
  svg2pngMin: svg2pngMin,
  svgMin: svgMin,
  Punchcutter: Punchcutter
};
