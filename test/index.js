const _ = require('lodash');
const chai = require('chai');
const {assert} = chai;
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
const fs = require('fs-extra');
const Promise = require('bluebird');
const multiGlob = require('../lib/multiGlob');
const {
  build,
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
} = require('..');

Promise.promisifyAll(fs);

describe('Punchcutter', function() {
  const testDir = __dirname.substring(process.cwd().length + 1) + '/';

  const config = {
    fonts: [
      // Mono
      {
        name: 'mono',
        src: [testDir + 'data/src/mono/*.svg'],
        dist: testDir + 'data/dist/',
        builds: [
          {
            type: GLYPHS
          },
          {
            type: SPRITE,
            monochrome: true,
            builds: [
              {
                type: SVG,
                dist: testDir + 'data/dist/mono/sprite/',
                idPrefix: 'mono--'
              }
            ]
          }
        ]
      },
      // Poly
      {
        name: 'poly',
        src: [testDir + 'data/src/poly/*.svg'],
        dist: testDir + 'data/dist/',
        builds: [
          {
            type: WEB_FONTS,
            order: [EOT, WOFF, TTF],
            stylesheets: ['scss'],
            syntax: 'bem',
            templateOptions: {
              baseClass: 'poly',
              classPrefix: 'poly--'
            },
            types: [EOT, WOFF, TTF]
          },
          {
            type: GLYPHS,
            colors: {
              blue: '#00f',
              red: '#f00'
            },
            builds: [
              {
                type: SVG,
                dist: testDir + 'data/dist/poly/glyph/svg/'
              },
              {
                type: PNG,
                dist: testDir + 'data/dist/poly/glyph/png/@1x/',
                scale: 1
              },
              {
                type: PNG,
                dist: testDir + 'data/dist/poly/glyph/png/@2x/',
                scale: 2
              }
            ]
          },
          {
            type: JS_FONT
          },
          {
            type: SPRITE
          }
        ]
      }
    ]
  };

  const setup = function(done) {
    // Delete test output.
    Promise.mapSeries(
      _.map(config.fonts, function(font) {
        return font.dist;
      }),
      function(file) {
        return fs.removeAsync(file);
      }
    ).then(function() {
      done();
    });
  };

  beforeEach(setup);
  after(setup);

  describe('build', function() {
    it('Should build', function() {
      this.timeout(5000);

      const actual = function() {
        return Promise.mapSeries(config.fonts, function(font) {
          return build(font);
        })
          .then(function() {
            return multiGlob(
              _.uniq(
                _.map(config.fonts, function(config) {
                  return config.dist + '**/*';
                })
              ),
              {
                nodir: true
              }
            );
          })
          .then(function(files) {
            return Promise.resolve(files.sort());
          });
      };

      const expected = [
        testDir + 'data/dist/mono/glyph/svg/erlenmeyer-flask.svg',
        testDir + 'data/dist/mono/glyph/svg/eye.svg',
        testDir + 'data/dist/mono/sprite/mono.svg',
        testDir + 'data/dist/poly/font/_poly.scss',
        testDir + 'data/dist/poly/font/poly.eot',
        testDir + 'data/dist/poly/font/poly.ttf',
        testDir + 'data/dist/poly/font/poly.woff',
        testDir + 'data/dist/poly/glyph/png/@1x/blue/erlenmeyer-flask.png',
        testDir + 'data/dist/poly/glyph/png/@1x/blue/eye.png',
        testDir + 'data/dist/poly/glyph/png/@1x/red/erlenmeyer-flask.png',
        testDir + 'data/dist/poly/glyph/png/@1x/red/eye.png',
        testDir + 'data/dist/poly/glyph/png/@2x/blue/erlenmeyer-flask.png',
        testDir + 'data/dist/poly/glyph/png/@2x/blue/eye.png',
        testDir + 'data/dist/poly/glyph/png/@2x/red/erlenmeyer-flask.png',
        testDir + 'data/dist/poly/glyph/png/@2x/red/eye.png',
        testDir + 'data/dist/poly/glyph/svg/blue/erlenmeyer-flask.svg',
        testDir + 'data/dist/poly/glyph/svg/red/erlenmeyer-flask.svg',
        testDir + 'data/dist/poly/glyph/svg/blue/eye.svg',
        testDir + 'data/dist/poly/glyph/svg/red/eye.svg',
        testDir + 'data/dist/poly/js/poly.js',
        testDir + 'data/dist/poly/sprite/poly.svg'
      ].sort();

      return assert.eventually.deepEqual(actual(), expected);
    });
  });
});
