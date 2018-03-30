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
        builds: [
          {
            type: GLYPHS,
            builds: [
              {
                type: SVG,
                dist: testDir + 'data/dist/mono/glyph/svg/'
              }
            ]
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
        builds: [
          {
            type: WEB_FONTS,
            css: {
              dist: testDir + 'data/dist/poly/font/'
            },
            font: {
              dist: testDir + 'data/dist/poly/font/'
            },
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
            type: JS_FONT,
            dist: testDir + 'data/dist/poly/js/'
          },
          {
            type: SPRITE,
            builds: [
              {
                type: SVG,
                dist: testDir + 'data/dist/poly/sprite/'
              }
            ]
          }
        ]
      }
    ]
  };

  const setup = function(done) {
    // Delete test output.
    fs.removeAsync(testDir + 'data/dist/').then(function() {
      done();
    });
  };

  beforeEach(setup);
  after(setup);

  describe('build', function() {
    it('Should build', function() {
      this.timeout(10000);

      const actual = () =>
        Promise.mapSeries(config.fonts, font => build(font))
          .then(() => multiGlob([testDir + 'data/dist/**/*'], {nodir: true}))
          .then(files => Promise.resolve(files.sort()));

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
