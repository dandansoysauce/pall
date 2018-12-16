'use strict';
const { ipcRenderer, clipboard, shell, desktopCapturer, screen } = require('electron')
const Store = require('electron-store')
const Jimp = require('jimp')
const hex2rgb = require('hex2rgb')
require('./renderer.css')
const styles = document.createElement('style')
styles.innerText = `@import url(https://unpkg.com/spectre.css/dist/spectre-icons.css);@import url(https://unpkg.com/spectre.css/dist/spectre.min.css);`
const vueScript = document.createElement('script')
vueScript.setAttribute('type', 'text/javascript'), vueScript.setAttribute('src', 'https://unpkg.com/vue'), vueScript.onload = init, document.head.appendChild(vueScript), document.head.appendChild(styles)

const store = new Store()
let getColorsFromStore = store.get('colors') ? store.get('colors') : []

function pushColor(color) {
    const foreground = hex2rgb(color).yiq
    const colorObj = { code: color, date: new Date().toLocaleString(), fg: foreground }
    getColorsFromStore.unshift(colorObj)
}

function init() {
    ipcRenderer.on('closewindow', (event, args) => {
        store.set('colors', getColorsFromStore)
    })

    ipcRenderer.on('capture', (event, args) => {
        const allDisplays = screen.getAllDisplays()
        const primaryDisplay = screen.getPrimaryDisplay()
        const point = screen.getCursorScreenPoint()
        let displayHeight = primaryDisplay.size.height
        let displayWidth = primaryDisplay.size.width
        if (allDisplays.length > 1) {
            displayWidth = 0
            displayHeight = Math.max.apply(Math, allDisplays.map(function (o) { return o.size.height }))
            allDisplays.forEach(display => {
                displayWidth = displayWidth + display.size.width
            })
        }
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
    })

    var myVue = new Vue({
        data: {
            colors: getColorsFromStore,
            minimizeToTrayOnExit: store.get('settings.minimizeToTrayOnExit') ? store.get('settings.minimizeToTrayOnExit') : false,
            autostartToTray: store.get('settings.autostartToTray') ? store.get('settings.autostartToTray') : false
        },
        methods: {
            copyToClipboard: color => {
                document.getElementById('copy-toast').style.display = 'block'
                clipboard.writeText(color)
                setTimeout(() => {
                    document.getElementById('copy-toast').style.display = 'none'
                }, 3000)
            },
            clearHistory () {
                store.delete('colors')
                getColorsFromStore = []
                this.colors = getColorsFromStore
            },
            showSettings: () => {
                document.getElementById('settings-modal').classList.add('active')
            },
            hideSettings: () => {
                document.getElementById('settings-modal').classList.remove('active')
            },
            saveSettings () {
                store.set('settings.autostartToTray', this.autostartToTray)
                store.set('settings.minimizeToTrayOnExit', this.minimizeToTrayOnExit)
                document.getElementById('settings-modal').classList.remove('active')
            },
            openGithub () {
                shell.openExternal('https://github.com')
            }
        },
        template: `
        <div class="main-container">
            <div class="panel panel-container">
                <div class="panel-header">
                    <div class="panel-title">
                        History
                        <a class="float-right link-pointer" v-on:click="openGithub"><span class="label label-primary">github</span></a>
                    </div>
                </div>
                <div class="panel-nav">

                </div>
                <div class="panel-body">
                    <div class="container">
                        <div id="colors-container" class="columns">
                            <div class="column col-4 color-code-box" v-for="color in colors" v-on:click="copyToClipboard(color.code)" v-bind:style="{ backgroundColor: color.code, color: color.fg }">
                                {{ color.code }}
                            </div>
                        </div>
                    </div>
                </div>
                <div class="panel-footer">
                    <button class="btn btn-action tooltip tooltip-right" data-tooltip="Clear History" v-on:click="clearHistory"><i class="icon icon-delete"></i></button>
                    <button class="btn btn-action tooltip tooltip-left float-right" data-tooltip="Settings" v-on:click="showSettings"><i class="icon icon-menu"></i></button>
                </div>
            </div>
            <div id="copy-toast" class="toast" style="width: 200px; position: absolute; bottom: 20px; right: 20px; display: none;">
                Copied to clipboard
            </div>
            <div class="modal modal-sm" id="settings-modal">
                <a v-on:click="hideSettings" class="modal-overlay" aria-label="Close"></a>
                <div class="modal-container">
                    <div class="modal-header">
                        <a v-on:click="hideSettings" class="btn btn-clear float-right" aria-label="Close"></a>
                        <div class="modal-title h5">Settings</div>
                    </div>
                    <div class="modal-body">
                        <div class="content">
                            <div class="form-group">
                                <label class="form-switch">
                                    <input type="checkbox" v-model="autostartToTray">
                                    <i class="form-icon"></i> Auto-start to tray
                                </label>
                                <label class="form-switch">
                                    <input type="checkbox" v-model="minimizeToTrayOnExit">
                                    <i class="form-icon"></i> Minimize to tray on exit
                                </label>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn" v-on:click="saveSettings">Save</button>
                    </div>
                </div>
            </div>
        </div>`
    })
	Vue.config.devtools = false, Vue.config.productionTip = false, myVue.$mount('#app')
}
