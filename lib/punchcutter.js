const _ = require('lodash');
const fs = require('fs-extra');
const path = require('path');
const Promise = require('bluebird');
const svg2pngMin = require('./svg2pngMin');
const svgMin = require('./svgMin');
const buildGlyphs = require('./buildGlyphs');
const buildJsFont = require('./buildJsFont');
const buildSprite = require('./buildSprite');
const buildWebFonts = require('./buildWebFonts');
const {
  GLYPHS,
  JS_FONT,
  SPRITE,
  WEB_FONTS,
  PNG,
  SVG,
  EOT,
  WOFF,
  WOFF2,
  TTF
} = require('./constants');

Promise.promisifyAll(fs);

/**
 *
 * @param   {Object} config
 * @returns {Promise}
 */
function build(config) {
  return Promise.all(
    config.builds.reduce(function(result, buildConfig) {
      const {type} = buildConfig;

      if (type === GLYPHS) {
        return result.concat([
          buildGlyphs({
            name: config.name,
            src: config.src,
            dist: config.dist,
            build: _.assign(
              {
                builds: [
                  {
                    type: SVG,
                    dist: path.resolve(config.dist, config.name, 'glyph', 'svg')
                  }
                ]
              },
              buildConfig
            )
          })
        ]);
      }

      if (type === JS_FONT) {
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

      if (type === SPRITE) {
        return result.concat([
          buildSprite({
            name: config.name,
            src: config.src,
            dist: config.dist,
            build: _.assign(
              {
                monochrome: false,
                builds: [
                  {
                    type: SVG,
                    dist: path.resolve(config.dist, config.name, 'sprite'),
                    idPrefix: ''
                  }
                ]
              },
              buildConfig
            )
          })
        ]);
      }

      if (type === WEB_FONTS) {
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
                order: [EOT, WOFF2, WOFF, TTF, SVG],
                relativeFontPath: null,
                stylesheets: ['scss'],
                syntax: 'bem',
                templateOptions: {},
                types: [EOT, WOFF2, WOFF, TTF, SVG]
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
  PNG,
  SVG,
  EOT,
  WOFF,
  WOFF2,
  TTF,
  build,
  svg2pngMin,
  svgMin
};
