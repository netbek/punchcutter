var _ = require('lodash');
var chalk = require('chalk');
var cheerio = require('cheerio');
var del = require('del');
var DirectoryColorfy = require('directory-colorfy');
var fs = require('fs-extra');
var mkdirp = require('mkdirp');
var multiGlob = require('./util').multiGlob;
var path = require('path');
var pngquant = require('pngquant');
var Promise = require('bluebird');
var replaceExt = require('replace-ext');
var streamifier = require('streamifier');
var svg2png = require('svg2png');
var SVGOptim = require('svgo');
var svgstore = require('svgstore');
var webfont = require('grunt-webfont');

Promise.promisifyAll(fs);

var mkdirpAsync = Promise.promisify(mkdirp);
var svgo = new SVGOptim;

/**
 *
 * @return {Punchcutter}
 */
function Punchcutter() {}

Punchcutter.prototype = {
  constructor: Punchcutter,
  /**
   *
   * @param  {Array} src
   * @return {Promise}
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
   * @return {Promise}
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
   * @return {Promise}
   */
  buildSprite: function (config) {
    console.log('Building sprite: ' + chalk.cyan(config.name));

    return this.loadFiles(config.src)
      .then(function (files) {
        return Promise.mapSeries(files, function (file) {
          var data = file.data;

          file.data = new Promise(function (resolve, reject) {
            if (config.sprite.monochrome) {
              // Remove fill attribute.
              var $ = cheerio.load(data, {
                xmlMode: true
              });
              $('[fill]').removeAttr('fill');
              data = $.xml();
            }

            // Minify SVG.
            svgo.optimize(data, function (result) {
              if (result.error) {
                reject(result.error);
              }
              else {
                resolve(result.data);
              }
            });
          });

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
        var distPath = path.resolve(config.sprite.svg.dist, config.name + '.svg')
        var distDir = path.dirname(distPath);

        return mkdirpAsync(distDir)
          .then(function () {
            return fs.writeFileAsync(distPath, data, 'utf-8');
          });
      });
  },
  /**
   *
   * @param  {Object} config
   * @return {Promise}
   */
  buildGlyphs: function (config) {
    var loadFiles = this.loadFiles;
    var tempDir1 = path.resolve(config.glyph.svg.dist, '_temp-1');
    var tempDir2 = path.resolve(config.glyph.svg.dist, '_temp-2');
    var srcFiles;
    var svgDistDirs = [];

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
          return mkdirpAsync(dir);
        });
      })
      .then(function () {
        return multiGlob(config.src);
      })
      .then(function (files) {
        srcFiles = files;

        var colors = _.map(config.glyph.colors, function (value, key) {
          return {
            name: key.replace(/\-/g, '_'),
            hex: value
          };
        });

        return Promise.mapSeries(colors, function (color) {
          var svgDistDir = path.resolve(config.glyph.svg.dist, color.name.replace(/_/g, '-'));
          svgDistDirs.push(svgDistDir);

          return mkdirpAsync(svgDistDir)
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
                var data = file.data;

                file.data = new Promise(function (resolve, reject) {
                  // Minify SVG.
                  svgo.optimize(data, function (result) {
                    if (result.error) {
                      reject(result.error);
                    }
                    else {
                      resolve(result.data);
                    }
                  });
                });

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
      })
      .then(function () {
        if (config.glyph.types.indexOf('png') > -1 && svgDistDirs.length) {
          var src = _.map(svgDistDirs, function (dir) {
            return path.resolve(dir, '*.svg');
          });
          var base = path.resolve(svgDistDirs[0], '..');

          return multiGlob(src)
            .then(function (files) {
              return Promise.mapSeries(files, function (file) {
                var distPath = replaceExt(path.join(config.glyph.png.dist, file.substring(base.length)), '.png');
                var distDir = path.dirname(distPath);

                return mkdirpAsync(distDir)
                  .then(function () {
                    return fs.readFileAsync(file, 'utf-8');
                  })
                  .then(function (data) {
                    var resize;

                    if (config.glyph.png.scale) {
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
                          width: width * config.glyph.png.scale,
                          height: height * config.glyph.png.scale
                        };
                      }
                    }

                    // Convert SVG to PNG.
                    var buffer = new Buffer(data, 'utf-8');

                    return svg2png(buffer, resize);
                  })
                  .then(function (buffer) {
                    return new Promise(function (resolve, reject) {
                      var writeStream = fs.createWriteStream(distPath);

                      writeStream.on('close', function () {
                        resolve();
                      });

                      var readStream = streamifier.createReadStream(buffer)
                        // Minify PNG.
                        .pipe(new pngquant([256]))
                        .pipe(writeStream);
                    });
                  });
              });
            });
        }

        return new Promise.resolve(true);
      })
      .then(function () {
        var dirs = [
          tempDir1,
          tempDir2
        ]

        if (config.glyph.types.indexOf('png') < 0) {
          dirs.push(config.glyph.png.dist);
        }

        if (config.glyph.types.indexOf('svg') < 0) {
          dirs.push(config.glyph.svg.dist);
        }

        // Clean up.
        return del(dirs);
      });
  },
  /**
   *
   * @param  {Object} config
   * @return {Promise}
   */
  buildJsFont: function (config) {
    console.log('Building JS font: ' + chalk.cyan(config.name));

    return this.loadFiles(config.src)
      .then(function (files) {
        return Promise.mapSeries(files, function (file) {
          var data = file.data;

          file.data = new Promise(function (resolve, reject) {
            // Minify SVG.
            svgo.optimize(data, function (result) {
              if (result.error) {
                reject(result.error);
              }
              else {
                resolve(result.data);
              }
            });
          });

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

        return mkdirpAsync(distDir)
          .then(function () {
            return fs.writeFileAsync(distPath, data, 'utf-8');
          });
      });
  },
  /**
   *
   * @param  {Object} config
   * @return {Promise}
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
      colors: {
        'black': '#000000'
      },
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

    if (config.types.indexOf('font') > -1) {
      promises.push(this.buildWebfonts(config));
    }

    if (config.types.indexOf('glyph') > -1) {
      promises.push(this.buildGlyphs(config));
    }

    if (config.types.indexOf('js') > -1) {
      promises.push(this.buildJsFont(config));
    }

    if (config.types.indexOf('sprite') > -1) {
      promises.push(this.buildSprite(config));
    }

    return Promise.all(promises);
  }
};

module.exports = {
  Punchcutter: Punchcutter
};
