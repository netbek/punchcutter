/* eslint no-console: 0 */
const _ = require('lodash');
const chalk = require('chalk');
const Promise = require('bluebird');
const webfont = require('grunt-webfont');
const multiGlob = require('./multiGlob');

/**
 *
 * @param   {Object} config
 * @returns {Promise}
 */
module.exports = function(config) {
  console.log(`Building web font: ${chalk.cyan(config.name)}`);

  return multiGlob(config.src).then(function(files) {
    return new Promise(function(resolve, reject) {
      let task;

      webfont({
        registerMultiTask: function(name, desc, fn) {
          task = fn.bind({
            async: function() {
              return function() {
                resolve();
              };
            },
            requiresConfig: function() {
              return true;
            },
            data: {
              src: config.src,
              dest: config.build.font.dist,
              destCss: config.build.css.dist
            },
            options: function() {
              // https://github.com/sapegin/grunt-webfont#options
              var options = _.pick(config.build, [
                'codepoints',
                'codepointsFile',
                'embed',
                'htmlDemo',
                'order',
                'relativeFontPath',
                'stylesheets',
                'syntax',
                'templateOptions',
                'types'
              ]);

              options.font = config.name;

              options.logger = {
                warn: function(err) {
                  console.warn(err);
                  reject(err);
                },
                error: function(err) {
                  console.error(err);
                  reject(err);
                },
                log: _.noop,
                verbose: _.noop
              };

              return options;
            },
            name: name,
            target: config.build.font.dist,
            filesSrc: files
          });
        }
      });

      task();
    });
  });
};
