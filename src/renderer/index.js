'use strict';
const { ipcRenderer, clipboard, shell, desktopCapturer } = require('electron')
const remote = require('@electron/remote')
const Store = require('electron-store')
const Jimp = require('jimp')
const hex2rgb = require('hex2rgb')
require('./renderer.css')
const styles = document.createElement('style')
styles.innerText = `@import url(https://unpkg.com/spectre.css/dist/spectre-icons.css);@import url(https://unpkg.com/spectre.css/dist/spectre.min.css);`
const vueScript = document.createElement('script')
vueScript.setAttribute('type', 'text/javascript'), vueScript.setAttribute('src', 'https://unpkg.com/vue'), vueScript.onload = init, document.head.appendChild(vueScript), document.head.appendChild(styles)

const ifSnap = process.env.SNAP
const store = new Store()
let getColorsFromStore = store.get('colors') ? store.get('colors') : []

function pushColor(color) {
    const foreground = hex2rgb(color).yiq
    const colorObj = { code: color, date: new Date().toLocaleString(), fg: foreground }
    getColorsFromStore.unshift(colorObj)
}

function showToast(timeout) {
    document.getElementById('copy-toast').style.display = 'block'
    setTimeout(() => {
        document.getElementById('copy-toast').style.display = 'none'
    }, timeout)
}

function init() {
    let keyboardTimeout, keyboardOpt;
    const keyboardJS = require('keyboardjs')
    keyboardJS.bind('', e => {
        if (keyboardTimeout !== undefined) clearTimeout(keyboardTimeout)
        keyboardTimeout = setTimeout(() => { mykeyboard(e) }, 1000)
    })
    keyboardJS.pause()

    function mykeyboard(e) {
        if (keyboardOpt !== undefined) {
            if (keyboardOpt === 'color_pick') {
                setOption(e, 'shortuct.colorPick')
            } else if (keyboardOpt === 'last_pick') {
                setOption(e, 'shortuct.pickLast')
            }
    
            if (e.code === 'Escape') {
                keyboardJS.pause()
            }
        }
    }
    
    function setOption(keyboard, option) {
        let finalOption = ''
        if (keyboard.altKey) {
            finalOption = finalOption + 'Alt+'
        } 
        
        if (keyboard.ctrlKey) {
            finalOption = finalOption + 'CommandOrControl+'
        } 
        
        if (keyboard.shiftKey) {
            finalOption = finalOption + 'Shift+'
        }
    
        finalOption = finalOption + keyboard.key
        store.set(option, finalOption)
        if (option === 'shortuct.colorPick') {
            myVue.globalColorPick = finalOption
        } else if (option === 'shortuct.pickLast') {
            myVue.globalPickLast = finalOption
        }
        keyboardJS.pause()
    }

    ipcRenderer.on('closewindow', (event, args) => {
        store.set('colors', getColorsFromStore)
    })

    ipcRenderer.on('capture', (event, args) => {
        const allDisplays = remote.screen.getAllDisplays()
        const point = remote.screen.getCursorScreenPoint()
        const nearestDispaly = remote.screen.getDisplayNearestPoint(point)
        const targetDisplayIndex = allDisplays.findIndex(display => {
            return display.id === nearestDispaly.id
        })
        const displayPoint = allDisplays[targetDisplayIndex];
        const screenName = targetDisplayIndex + 1
        const componentToHex = c => {
            const hex = c.toString(16)
            return hex.length === 1 ? "0" + hex : hex
        }
        desktopCapturer.getSources({ types: ['screen'], thumbnailSize: {width: displayPoint.size.width, height: displayPoint.size.height} }).then(sources => {
            for (let i = 0; i < sources.length; ++i) {
                if (sources[i].name === `Screen ${screenName}`) {
                    Jimp.read(sources[i].thumbnail.toPNG(), (err, img) => {
                        if (err) return console.log(err)
    
                        const pixelColor = img.getPixelColor(point.x - displayPoint.bounds.x, point.y - displayPoint.bounds.y)
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
            toastMessage: 'Copied to clipboard',
            colors: getColorsFromStore,
            autoStartOpt: ifSnap,
            globalColorPick: store.get('shortuct.colorPick') ? store.get('shortuct.colorPick') : 'CommandOrControl+Shift+C',
            globalPickLast: store.get('shortuct.pickLast') ? store.get('shortuct.pickLast') : 'CommandOrControl+Shift+Z',
            minimizeToTrayOnExit: store.get('settings.minimizeToTrayOnExit') ? store.get('settings.minimizeToTrayOnExit') : false,
            autostartToTray: store.get('settings.autostartToTray') ? store.get('settings.autostartToTray') : false
        },
        methods: {
            copyToClipboard: color => {
                showToast(3000)
                clipboard.writeText(color)
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
                keyboardJS.pause()
                store.set('settings.autostartToTray', this.autostartToTray)
                store.set('settings.minimizeToTrayOnExit', this.minimizeToTrayOnExit)
                document.getElementById('settings-modal').classList.remove('active')

                if (keyboardOpt !== undefined) {
                    keyboardOpt = undefined
                    remote.app.relaunch()
                    remote.app.exit()
                }
            },
            openGithub () {
                shell.openExternal('https://github.com/dandansoysauce/pall')
            },
            buyMeACoffee () {
                shell.openExternal('https://paypal.me/dandansoysauce')
            },
            colorPickShortcutChange () {
                this.globalColorPick = 'Start keyboard capture...'
                keyboardOpt = 'color_pick'
                keyboardJS.resume()
            },
            lastPickShortcutChange () {
                this.globalPickLast = 'Start keyboard capture...'
                keyboardOpt = 'last_pick'
                keyboardJS.resume()
            }
        },
        template: `
        <div class="main-container">
            <div class="panel panel-container">
                <div class="panel-header">
                    <div class="panel-title">
                        History
                        <a class="float-right link-pointer" v-on:click="openGithub"><span class="label label-primary">github</span></a>
                        <a class="float-right link-pointer" style="margin-right: 5px;" v-on:click="buyMeACoffee"><span class="label label-error">paypal link</span></a>
                    </div>
                </div>
                <div class="panel-nav">

                </div>
                <div class="panel-body">
                    <div class="center-info" v-if="this.colors.length === 0">
                        <p><b>Point</b> and <kbd>{{ this.globalColorPick }}</kbd> to pick a color.</p>
                        <p><kbd>{{ this.globalPickLast }}</kbd> to copy last picked color.</p>
                    </div>
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
                {{ this.toastMessage }}
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
                                <label class="form-switch" v-if="!this.autoStartOpt">
                                    <input type="checkbox" v-model="autostartToTray">
                                    <i class="form-icon"></i> Auto-start to tray
                                </label>
                                <label class="form-switch">
                                    <input type="checkbox" v-model="minimizeToTrayOnExit">
                                    <i class="form-icon"></i> Minimize to tray on exit
                                </label>
                                <label>Color Pick Shortcut</label>
                                <div class="input-group" style="margin-bottom: 10px;">
                                    <span class="input-group-addon shortcut-span">{{ this.globalColorPick }}</span>
                                    <button class="btn btn-primary input-group-btn" v-on:click="colorPickShortcutChange">Change</button>
                                </div>
                                <label>Last Pick Shortcut</label>
                                <div class="input-group">
                                    <span class="input-group-addon shortcut-span">{{ this.globalPickLast }}</span>
                                    <button class="btn btn-primary input-group-btn" v-on:click="lastPickShortcutChange">Change</button>
                                </div>
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
