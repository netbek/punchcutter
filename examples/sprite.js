const {build, SPRITE, SVG} = require('..');

build({
  name: 'poly', // Font name.
  src: ['src/poly/*.svg'],
  builds: [
    {
      type: SPRITE,
      monochrome: true, // Removes `fill` attributes. Defaults to `false`.
      builds: [
        {
          type: SVG,
          dist: 'dist/poly/sprite/',
          idPrefix: 'poly-'
        }
      ]
    }
  ]
});
