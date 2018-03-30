# Punchcutter [![CircleCI](https://circleci.com/gh/netbek/punchcutter.svg?style=svg)](https://circleci.com/gh/netbek/punchcutter)

Build fonts.

## Installation

### Ubuntu 14-16

1. Install system dependencies:

    ```
    sudo apt-get install fontforge g++ graphicsmagick pngquant
    ```

2. Install ttfautohint:

    ```
    bash ./scripts/install-ttfautohint.sh
    ```

### OS X

1. Install system dependencies:

    ```
    brew install fontforge
    brew install gcc48 --enable-cxx
    brew install graphicsmagick
    brew install pngquant
    brew install ttfautohint --with-qt
    ```

## Usage

### Web fonts

`cd examples && node web-fonts.js`

### SVG and PNG glyphs

`cd examples && node glyphs.js`

### JS font

`cd examples && node js-font.js`

### SVG sprite

`cd examples && node sprite.js`

## Credit

Test font: [Ionicons](https://github.com/driftyco/ionicons) (MIT license)

## License

Copyright (c) 2016 Hein Bekker. Licensed under the GNU Affero General Public License, version 3.
