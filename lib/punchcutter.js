const _ = require('lodash');
const Promise = require('bluebird');
const svg2pngMin = require('./svg2pngMin');
const svgMin = require('./svgMin');
const buildGlyph = require('./buildGlyph');
const buildJsFont = require('./buildJsFont');
const buildSprite = require('./buildSprite');
const buildWebFont = require('./buildWebFont');
const {
  GLYPH,
  JS_FONT,
  SPRITE,
  WEB_FONT,
  PNG,
  SVG,
  EOT,
  WOFF,
  WOFF2,
  TTF
} = require('./constants');

/**
 *
 * @param   {Object} config
 * @returns {Promise}
 */
function build(config) {
  return Promise.all(
    config.builds.reduce(function(result, buildConfig) {
      const {type} = buildConfig;

      if (type === GLYPH) {
        return result.concat([
          buildGlyph({
            name: config.name,
            src: config.src,
            build: buildConfig
          })
        ]);
      }

      if (type === JS_FONT) {
        return result.concat([
          buildJsFont({
            name: config.name,
            src: config.src,
            build: _.assign(
              {
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
            build: _.assign(
              {
                monochrome: false
              },
              buildConfig
            )
          })
        ]);
      }

      if (type === WEB_FONT) {
        return result.concat([
          buildWebFont({
            name: config.name,
            src: config.src,
            build: _.assign(
              {
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
  GLYPH,
  JS_FONT,
  SPRITE,
  WEB_FONT,
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
