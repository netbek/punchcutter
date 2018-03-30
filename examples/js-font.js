const {build, JS_FONT} = require('..');

build({
  name: 'poly', // Font name.
  src: ['src/poly/*.svg'],
  builds: [
    {
      type: JS_FONT,
      dist: 'dist/poly/js-font/'
    }
  ]
});
