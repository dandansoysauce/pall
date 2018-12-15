# ![pall icon](https://raw.githubusercontent.com/dandansoysauce/pall/master/src/main/images/icon.png "pall icon") Pall [![Build Status](https://travis-ci.org/dandansoysauce/pall.svg?branch=master)](https://travis-ci.org/dandansoysauce/pall) [![Build status](https://ci.appveyor.com/api/projects/status/2f5ymuc0h94xsman?svg=true)](https://ci.appveyor.com/project/dandansoysauce/pall)

Pick a color. Anywhere.

## Usage

Point and <kbd>ctrl + shift + c</kbd> - copies the color to the clipboard and saves it.

<kbd>ctrl + shift + z</kbd> - copies the last picked color.

### Development Scripts

```bash
# run application in development mode
yarn dev

# compile source code and create webpack output
yarn compile

# `yarn compile` & create build with electron-builder
yarn dist

# `yarn compile` & create unpacked build with electron-builder
yarn dist:dir
```
