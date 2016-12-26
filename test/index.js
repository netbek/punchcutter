var _ = require('lodash');
var chai = require('chai');
var assert = chai.assert;
var chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
var del = require('del');
var multiGlob = require('../lib/util').multiGlob;
var globPromise = require('glob-promise');
var path = require('path');
var Punchcutter = require('..').Punchcutter;
var Promise = require('bluebird');

describe('Punchcutter', function () {
  var testDir = __dirname.substring(process.cwd().length + 1) + '/';

  var config = {
    'fonts': [{
      'name': 'mono',
      'src': [
        testDir + 'data/src/mono/*.svg'
      ],
      'dist': testDir + 'data/dist/',
      'types': ['svg'],
      'svg': {
        'mono': true
      }
    }, {
      'name': 'poly',
      'src': [
        testDir + 'data/src/poly/*.svg'
      ],
      'dist': testDir + 'data/dist/',
      'types': ['font', 'svg'],
      'font': {
        'font': 'poly',
        'order': ['eot', 'woff', 'ttf'],
        'relativeFontPath': '../fonts',
        'stylesheets': ['scss'],
        'syntax': 'bem',
        'templateOptions': {
          'baseClass': 'poly',
          'classPrefix': 'poly--'
        },
        'types': ['eot', 'woff', 'ttf']
      }
    }]
  };

  var punchcutter = new Punchcutter;

  beforeEach(function (done) {
    // Delete test output.
    del(_.map(config.fonts, function (font) {
        return font.dist;
      }))
      .then(function () {
        done();
      });
  });

  after(function (done) {
    // Delete test output.
    del(_.map(config.fonts, function (font) {
        return font.dist;
      }))
      .then(function () {
        done();
      });
  });

  describe('build', function () {
    it('Should build', function () {
      var actual = function () {
        return Promise.mapSeries(config.fonts, function (font) {
            return punchcutter.build(font);
          })
          .then(function () {
            return multiGlob(_.uniq(_.map(config.fonts, function (config) {
              return config.dist + '**/*';
            })), {
              nodir: true
            });
          })
          .then(function (files) {
            return Promise.resolve(files.sort());
          });
      };

      var expected = [
        testDir + 'data/dist/' + 'font/_poly.scss',
        testDir + 'data/dist/' + 'font/poly.eot',
        testDir + 'data/dist/' + 'font/poly.ttf',
        testDir + 'data/dist/' + 'font/poly.woff',
        testDir + 'data/dist/' + 'svg/mono.svg',
        testDir + 'data/dist/' + 'svg/poly.svg',
      ].sort();

      return assert.eventually.deepEqual(actual(), expected);
    });
  });
});
