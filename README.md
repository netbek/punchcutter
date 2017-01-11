# Punchcutter [![Build Status](https://secure.travis-ci.org/netbek/punchcutter.png?branch=master)](http://travis-ci.org/netbek/punchcutter)

Build fonts.

## Installation

### Ubuntu

```
sudo apt-get install fontforge g++ graphicsmagick pngquant
```

The most recent version of `ttfautohint` in Ubuntu 14/15 has [a fatal bug](https://github.com/sapegin/grunt-webfont/issues/162), and should be compiled from source.

#### Step 1

```
sudo apt-get install autoconf automake bison flex git pkg-config gcc g++ libglib2.0-dev libcairo2-dev libtool libc6 libfreetype6 libgcc1 libqtcore4 libqtgui4 libstdc++6 libqt4-dev libfreetype6-dev libharfbuzz-dev pandoc texlive-xetex help2man
git clone http://repo.or.cz/ttfautohint.git
cd ttfautohint
```

#### Step 2

In configure.ac, comment out line 100-105 except line 104:

```
FREETYPE_LIBS="`$ft_config --libs`"
```

This is needed because `freetype-config --libtool` causes `configure` to fail.

#### Step 3

```
nano configure.ac # Make changes mentioned above
./bootstrap
./configure --with-doc=no
make
sudo make install
```

### OS X

```
brew install fontforge
brew install gcc48 --enable-cxx
brew install pngquant
brew install ttfautohint --with-qt
```

## Credit

Test font: [Ionicons](https://github.com/driftyco/ionicons) (MIT license)

## License

Copyright (c) 2016 Hein Bekker. Licensed under the GNU Affero General Public License, version 3.
