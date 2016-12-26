var _ = require('lodash');
var chalk = require('chalk');
var cheerio = require('cheerio');
var del = require('del');
var DirectoryColorfy = require('directory-colorfy');
var fs = require('fs-extra');
var gulp = require('gulp');
var mkdirp = require('mkdirp');
var multiGlob = require('./util').multiGlob;
var path = require('path');
var pngmin = require('gulp-pngmin');
var Promise = require('bluebird');
var spawn = require('child_process').spawn;
var streamToPromise = require('./util').streamToPromise;
var svg2png = require('gulp-svg2png');
var SVGOptim = require('svgo');
var svgstore = require('svgstore');
var webfont = require('grunt-webfont');

Promise.promisifyAll(fs);

var mkdirpAsync = Promise.promisify(mkdirp);

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
  buildFonts: function (config) {
    var dist = path.resolve(config.dist, config.name, 'font');

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
                  dest: dist,
                  destCss: dist
                },
                options: function () {
                  // https://github.com/sapegin/grunt-webfont#options
                  var options = _.pick(config.font, [
                    'embed',
                    'font',
                    'htmlDemo',
                    'order',
                    'relativeFontPath',
                    'stylesheets',
                    'syntax',
                    'templateOptions',
                    'types'
                  ]);

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
                target: dist,
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
  buildMonochromeSprite: function (config) {
    var dist = path.resolve(config.dist, config.name, 'sprite', config.name + '.svg');

    var svgo = new SVGOptim({
      plugins: [{
        cleanupIDs: {
          prefix: config.name + '-',
          minify: true
        }
      }]
    });

    return this.loadFiles(config.src)
      .then(function (files) {
        return Promise.mapSeries(files, function (file) {
          var data = file.data;

          file.data = new Promise(function (resolve, reject) {
            // Remove fill attribute.
            var $ = cheerio.load(data, {
              xmlMode: true
            });
            $('[fill]').removeAttr('fill');
            data = $.xml();

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

          store.add(basename, file.data);
        });

        var data = store.toString({
          inline: false
        })

        var distDir = path.dirname(dist);

        return mkdirpAsync(distDir)
          .then(function () {
            return fs.writeFileAsync(dist, data, 'utf-8');
          });
      });
  },
  /**
   *
   * @param  {Object} config
   * @return {Promise}
   */
  buildPolychromeSprite: function (config) {
    var dist = path.resolve(config.dist, config.name, 'sprite', config.name + '.svg');

    var svgo = new SVGOptim({
      plugins: [{
        cleanupIDs: {
          prefix: config.name + '-',
          minify: true
        }
      }]
    });

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
        var store = svgstore();

        _.forEach(files, function (file) {
          var extname = path.extname(file.path);
          var basename = path.basename(file.path, extname);

          store.add(basename, file.data);
        });

        var data = store.toString({
          inline: false
        })

        var distDir = path.dirname(dist);

        return mkdirpAsync(distDir)
          .then(function () {
            return fs.writeFileAsync(dist, data, 'utf-8');
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
    var srcFiles;
    var tempDir1 = path.resolve(config.dist, config.name, 'temp-glyph-1');
    var tempDir2 = path.resolve(config.dist, config.name, 'temp-glyph-2');
    var pngDist = path.resolve(config.dist, config.name, 'glyph', 'png');
    var svgDist = path.resolve(config.dist, config.name, 'glyph', 'svg');
    var svgo = new SVGOptim;

    // Delete temp directories.
    return del([
        tempDir1,
        tempDir2
      ])
      .then(function () {
        var dirs = [
          tempDir1,
          tempDir2,
          pngDist,
          svgDist
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
          return Promise.mapSeries(srcFiles, function (file) {
              // Add colors to filename for DirectoryColorfy.
              var extname = path.extname(file);
              var basename = path.basename(file, extname);
              var copy = path.resolve(tempDir1, basename + '.colors-' + color.name + extname);

              console.log('Coloring icon: ' + chalk.cyan(file) + ' => ' + chalk.cyan(color.name));

              return fs.copyAsync(file, copy);
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
              var distDir = path.resolve(svgDist, color.name.replace(/_/g, '-'));

              return mkdirpAsync(distDir)
                .then(function () {
                  // Remove color suffix from SVG and move to color directory.
                  return Promise.mapSeries(srcFiles, function (file) {
                    var extname = path.extname(file);
                    var basename = path.basename(file, extname);

                    var srcPath = path.resolve(tempDir2, basename + '-' + color.name + '.svg');
                    var distPath = path.resolve(distDir, basename + '.svg');

                    return fs.renameAsync(srcPath, distPath);
                  });
                });
            });
        });
      })
      .then(function () {
        if (config.glyph.types.indexOf('png') > -1) {
          // Convert SVG to PNG and minify PNG.
          return new Promise(function (resolve, reject) {
            gulp
              .src(path.resolve(svgDist, '**', '*.svg'))
              .pipe(svg2png(config.glyph.png.scale, false, 1))
              .pipe(pngmin([256]))
              .pipe(gulp.dest(pngDist))
              .on('end', resolve);
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
          dirs.push(pngDist);
        }

        if (config.glyph.types.indexOf('svg') < 0) {
          dirs.push(svgDist);
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
    var dist = path.resolve(config.dist, config.name, 'js', config.name + '.js');

    var svgo = new SVGOptim({
      plugins: [{
        cleanupIDs: {
          prefix: config.name + '-',
          minify: true
        }
      }]
    });

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

        var distDir = path.dirname(dist);

        return mkdirpAsync(distDir)
          .then(function () {
            return fs.writeFileAsync(dist, data, 'utf-8');
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
      embed: false,
      font: 'icons',
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
        scale: null
      },
      types: ['png', 'svg']
    }, config.glyph || {});

    config.js = _.assign({
      prepend: 'module.exports = ',
      append: ';'
    }, config.js || {});

    config.sprite = _.assign({
      monochrome: false
    }, config.sprite || {});

    var promises = [];

    if (config.types.indexOf('font') > -1) {
      promises.push(this.buildFonts(config));
    }

    if (config.types.indexOf('glyph') > -1) {
      promises.push(this.buildGlyphs(config));
    }

    if (config.types.indexOf('js') > -1) {
      promises.push(this.buildJsFont(config));
    }

    if (config.types.indexOf('sprite') > -1) {
      if (config.sprite.monochrome) {
        promises.push(this.buildMonochromeSprite(config));
      }
      else {
        promises.push(this.buildPolychromeSprite(config));
      }
    }

    return Promise.all(promises);
  }
};

module.exports = {
  Punchcutter: Punchcutter
};
