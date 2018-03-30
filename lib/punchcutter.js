const _ = require('lodash');
const fs = require('fs-extra');
const path = require('path');
const Promise = require('bluebird');
const {svgMin, svg2pngMin} = require('./util');
const buildGlyphs = require('./buildGlyphs');
const buildJsFont = require('./buildJsFont');
const buildSprite = require('./buildSprite');
const buildWebFonts = require('./buildWebFonts');

Promise.promisifyAll(fs);

const GLYPHS = 'glyphs';
const JS_FONT = 'js-font';
const SPRITE = 'sprite';
const WEB_FONTS = 'web-fonts';

/**
 *
 * @param   {Object} config
 * @returns {Promise}
 */
function build(config) {
  return Promise.all(
    config.builds.reduce(function(result, buildConfig) {
      const {buildType} = buildConfig;

      if (buildType === GLYPHS) {
        return result.concat([
          buildGlyphs({
            name: config.name,
            src: config.src,
            dist: config.dist,
            build: _.assign(
              {
                png: {
                  dist: path.resolve(config.dist, config.name, 'glyph', 'png'),
                  scale: null
                },
                svg: {
                  dist: path.resolve(config.dist, config.name, 'glyph', 'svg')
                },
                types: ['png', 'svg']
              },
              buildConfig
            )
          })
        ]);
      }

      if (buildType === JS_FONT) {
        return result.concat([
          buildJsFont({
            name: config.name,
            src: config.src,
            dist: config.dist,
            build: _.assign(
              {
                dist: path.resolve(config.dist, config.name, 'js'),
                prepend: 'module.exports = ',
                append: ';'
              },
              buildConfig
            )
          })
        ]);
      }

      if (buildType === SPRITE) {
        return result.concat([
          buildSprite({
            name: config.name,
            src: config.src,
            dist: config.dist,
            build: _.assign(
              {
                monochrome: false,
                svg: {
                  dist: path.resolve(config.dist, config.name, 'sprite'),
                  idPrefix: ''
                },
                types: ['svg']
              },
              buildConfig
            )
          })
        ]);
      }

      if (buildType === WEB_FONTS) {
        return result.concat([
          buildWebFonts({
            name: config.name,
            src: config.src,
            dist: config.dist,
            build: _.assign(
              {
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
              },
              buildConfig
            )
          })
        ]);
      }

      return result;
    }, [])
  );
}

module.exports = {
  GLYPHS,
  JS_FONT,
  SPRITE,
  WEB_FONTS,
  build,
  svg2pngMin,
  svgMin
};
