const {build, SVG_SPRITE} = require('..');

build({
  name: 'poly', // Font name.
  src: ['src/poly/*.svg'],
  builds: [
    {
      type: SVG_SPRITE,
      monochrome: true, // Removes `fill` attributes. Defaults to `false`.
      builds: [
        {
          dist: 'dist/poly/svg-sprite/',
          idPrefix: 'poly-'
        }
      ]
    }
  ]
});
