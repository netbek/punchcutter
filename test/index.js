const _ = require('lodash');
const chai = require('chai');
const {assert} = chai;
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
const fs = require('fs-extra');
const Promise = require('bluebird');
const {multiGlob} = require('../lib/util');
const {build, GLYPHS, JS_FONT, SPRITE, WEB_FONTS} = require('..');

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
            buildType: SPRITE,
            monochrome: true,
            svg: {
              dist: testDir + 'data/dist/mono/sprite/',
              idPrefix: 'mono--'
            }
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
            buildType: WEB_FONTS,
            order: ['eot', 'woff', 'ttf'],
            stylesheets: ['scss'],
            syntax: 'bem',
            templateOptions: {
              baseClass: 'poly',
              classPrefix: 'poly--'
            },
            types: ['eot', 'woff', 'ttf']
          },
          {
            buildType: GLYPHS,
            colors: {
              black: '#000000'
            }
          },
          {
            buildType: JS_FONT
          },
          {
            buildType: SPRITE
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
        testDir + 'data/dist/mono/sprite/mono.svg',
        testDir + 'data/dist/poly/font/_poly.scss',
        testDir + 'data/dist/poly/font/poly.eot',
        testDir + 'data/dist/poly/font/poly.ttf',
        testDir + 'data/dist/poly/font/poly.woff',
        testDir + 'data/dist/poly/glyph/png/black/erlenmeyer-flask.png',
        testDir + 'data/dist/poly/glyph/png/black/eye.png',
        testDir + 'data/dist/poly/glyph/svg/black/erlenmeyer-flask.svg',
        testDir + 'data/dist/poly/glyph/svg/black/eye.svg',
        testDir + 'data/dist/poly/js/poly.js',
        testDir + 'data/dist/poly/sprite/poly.svg'
      ].sort();

      return assert.eventually.deepEqual(actual(), expected);
    });
  });
});
