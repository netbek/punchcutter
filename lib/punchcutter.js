const _ = require('lodash');
const Promise = require('bluebird');
const svg2pngMin = require('./svg2pngMin');
const svgMin = require('./svgMin');
const buildGlyph = require('./buildGlyph');
const buildJsFont = require('./buildJsFont');
const buildPngSprite = require('./buildPngSprite');
const buildSvgSprite = require('./buildSvgSprite');
const buildWebFont = require('./buildWebFont');
const {
  GLYPH,
  JS_FONT,
  PNG_SPRITE,
  SVG_SPRITE,
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
  return Promise.mapSeries(config.builds, function(buildConfig) {
    const {type} = buildConfig;

    switch (type) {
      case GLYPH:
        return buildGlyph({
          name: config.name,
          src: config.src,
          build: buildConfig
        });

      case JS_FONT:
        return buildJsFont({
          name: config.name,
          src: config.src,
          build: _.assign(
            {
              prepend: 'module.exports = ',
              append: ';'
            },
            buildConfig
          )
        });

      case PNG_SPRITE:
        return buildPngSprite({
          name: config.name,
          src: config.src,
          build: _.assign(
            {
              autoprefixer: {
                browsers: [
                  'last 2 versions',
                  'ie >= 8',
                  'ff >= 5',
                  'chrome >= 20',
                  'opera >= 12',
                  'safari >= 4',
                  'ios >= 6',
                  'android >= 2',
                  'bb >= 6'
                ]
              },
              htmlDemo: false,
              stylesheets: ['scss'],
              templateOptions: {}
            },
            buildConfig
          )
        });

      case SVG_SPRITE:
        return buildSvgSprite({
          name: config.name,
          src: config.src,
          build: _.assign(
            {
              monochrome: false
            },
            buildConfig
          )
        });

      case WEB_FONT:
        return buildWebFont({
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
        });
    }

    return Promise.reject(new Error(`Build type "${type}" not supported`));
  });
}

module.exports = {
  GLYPH,
  JS_FONT,
  PNG_SPRITE,
  SVG_SPRITE,
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
