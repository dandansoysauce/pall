const { desktopCapturer, screen, clipboard} = require('electron')

const Store = require('electron-store')
const store = new Store()
const Jimp = require('jimp')
const hex2rgb = require('hex2rgb')

let colorsHistory = store.get('colors') ? store.get('colors') : []

function pushColor(color) {
    const foreground = hex2rgb(color).yiq
    const colorObj = {code: color, date: new Date().toLocaleString(), fg: foreground}
    colorsHistory.unshift(colorObj)
    store.set('colors', colorsHistory)
}

module.exports = {
    getPixelColor: function () {
        const primaryDisplay = screen.getPrimaryDisplay()
        const point = screen.getCursorScreenPoint()
        const displayHeight = primaryDisplay.bounds.height
        const displayWidth = primaryDisplay.bounds.width
        const componentToHex = c => {
            const hex = c.toString(16)
            return hex.length === 1 ? "0" + hex : hex
        }
        desktopCapturer.getSources({types: ['screen'], thumbnailSize: {width: displayWidth, height: displayHeight}}, (error, sources) => {
            if (error) throw error
        
            for (let i = 0; i < sources.length; ++i) {
            if (sources[i].name.toLocaleLowerCase() === 'entire screen') {
                Jimp.read(sources[i].thumbnail.toPNG(), (err, img) => {
                    if (err) return console.log(err)

                    const pixelColor = img.getPixelColor(point.x, point.y)
                    const rgbaColor = Jimp.intToRGBA(pixelColor)
                    const hexColorString = `#${componentToHex(rgbaColor.r)}${componentToHex(rgbaColor.g)}${componentToHex(rgbaColor.b)}`
                    clipboard.writeText(hexColorString)
                    pushColor(hexColorString)
                })
            }
            }
        })
    },
    clearStore: function () {
        store.delete('colors')
    }
}