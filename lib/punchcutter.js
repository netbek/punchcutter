const _ = require('lodash');
const fs = require('fs-extra');
const path = require('path');
const Promise = require('bluebird');
const {svgMin, svg2pngMin} = require('./util');
const buildGlyphs = require('./buildGlyphs');
const buildJsFont = require('./buildJsFont');
const buildSprite = require('./buildSprite');
const buildWebfonts = require('./buildWebfonts');

Promise.promisifyAll(fs);

class Punchcutter {
  /**
   *
   * @param   {Object} config
   * @returns {Promise}
   */
  build(config) {
    config.font = _.assign(
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
      config.font || {}
    );

    config.glyph = _.assign(
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
      config.glyph || {}
    );

    config.js = _.assign(
      {
        dist: path.resolve(config.dist, config.name, 'js'),
        prepend: 'module.exports = ',
        append: ';'
      },
      config.js || {}
    );

    config.sprite = _.assign(
      {
        monochrome: false,
        svg: {
          dist: path.resolve(config.dist, config.name, 'sprite'),
          idPrefix: ''
        },
        types: ['svg']
      },
      config.sprite || {}
    );

    const promises = [];

    if (_.includes(config.types, 'font')) {
      promises.push(buildWebfonts(config));
    }
    if (_.includes(config.types, 'glyph')) {
      promises.push(buildGlyphs(config));
    }
    if (_.includes(config.types, 'js')) {
      promises.push(buildJsFont(config));
    }
    if (_.includes(config.types, 'sprite')) {
      promises.push(buildSprite(config));
    }

    return Promise.all(promises);
  }
}

module.exports = {
  svg2pngMin: svg2pngMin,
  svgMin: svgMin,
  Punchcutter: Punchcutter
};
