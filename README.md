# ![pall icon](https://raw.githubusercontent.com/dandansoysauce/pall/master/build/icon-mini.png "pall icon") Pall [![Build Status](https://travis-ci.org/dandansoysauce/pall.svg?branch=master)](https://travis-ci.org/dandansoysauce/pall) [![Build status](https://ci.appveyor.com/api/projects/status/2f5ymuc0h94xsman?svg=true)](https://ci.appveyor.com/project/dandansoysauce/pall)

Pick a color. Anywhere.

[![Get it from the Snap Store](https://snapcraft.io/static/images/badges/en/snap-store-black.svg)](https://snapcraft.io/pall)

## Usage

<!-- ![pall gif](https://media.giphy.com/media/6IgmK66Gn8zalvazG0/giphy.gif "pall usage") -->

Point to wherever on your screen and <kbd>ctrl + shift + c</kbd> - copies the color pointed by the mouse to the clipboard and saves it.

<kbd>ctrl + shift + z</kbd> - copies the last picked color.

## Dependencies

* [Teamwork/node-auto-launch](https://github.com/Teamwork/node-auto-launch)
* [sindresorhus/electron-store](https://github.com/sindresorhus/electron-store)
* [mawie81/electron-window-state](https://github.com/mawie81/electron-window-state)
* [oliver-moran/jimp](https://github.com/oliver-moran/jimp)
* [glnster/hex2rgb](https://github.com/glnster/hex2rgb)
* [RobertWHurst/KeyboardJS](https://github.com/RobertWHurst/KeyboardJS)

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
