var _ = require('lodash');
var chalk = require('chalk');
var cheerio = require('cheerio');
var del = require('del');
var fs = require('fs');
var mkdirp = require('mkdirp');
var multiGlob = require('./util').multiGlob;
var path = require('path');
var Promise = require('bluebird');
var spawn = require('child_process').spawn;
var SVGOptim = require('svgo');
var svgstore = require('svgstore');
var webfont = require('grunt-webfont');

Promise.promisifyAll(fs);

var mkdirpAsync = Promise.promisify(mkdirp);

/**
 * Constants
 */
var SVG = 'svg';

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
          file.data = fs.readFileAsync(file.path, 'utf8');

          return Promise.props(file);
        });
      });
  },
  /**
   *
   * @param  {Object} config
   * @return {Promise}
   */
  buildFont: function (config) {
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
                  dest: config.dist + 'font/',
                  destCss: config.dist + 'font/'
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
                target: config.dist,
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
  buildMonoColorSVG: function (config) {
    var dist = path.resolve(config.dist, 'svg', config.name + '.svg');

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
            return fs.writeFileAsync(dist, data, 'utf8');
          });
      });
  },
  /**
   *
   * @param  {Object} config
   * @return {Promise}
   */
  buildPolyColorSVG: function (config) {
    var dist = path.resolve(config.dist, 'svg', config.name + '.svg');

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
            return fs.writeFileAsync(dist, data, 'utf8');
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

    config.svg = _.assign({
      mono: false
    }, config.svg || {});

    var promises = [];

    if (config.types.indexOf('font') > -1) {
      promises.push(this.buildFont(config));
    }

    if (config.types.indexOf('svg') > -1) {
      if (config.svg.mono) {
        promises.push(this.buildMonoColorSVG(config));
      }
      promises.push(this.buildPolyColorSVG(config));
    }

    return Promise.all(promises);
  }
};

module.exports = {
  Punchcutter: Punchcutter
};
