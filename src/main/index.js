'use strict'

import { app, BrowserWindow, globalShortcut, ipcMain, Tray, Menu, clipboard, nativeImage } from 'electron'
import * as path from 'path'
import { format as formatUrl } from 'url'
require('@electron/remote/main').initialize()
const Store = require('electron-store')
const store = new Store()
const AutoLaunch = require('auto-launch')
const windowStateKeeper = require('electron-window-state')
let appIcon = null
if (process.env.SNAP) {
  appIcon = path.join(__dirname, '../../', 'meta/gui/icon.png')
} else {
  appIcon = nativeImage.createFromPath('build/icon-mini.png')
}

const globalColorPick = store.get('shortuct.colorPick') ? store.get('shortuct.colorPick') : 'CommandOrControl+Shift+C'
const globalPickLast = store.get('shortuct.pickLast') ? store.get('shortuct.pickLast') : 'CommandOrControl+Shift+Z'
const autoStartToTray = store.get('settings.autostartToTray') ? store.get('settings.autostartToTray') : false

var autoLauncher = new AutoLaunch({
  name: 'pall'
})

const isDevelopment = process.env.NODE_ENV !== 'production'

let mainWindow
let tray = null

function createMainWindow() {
  let mainWindowState = windowStateKeeper({
    defaultWidth: 400,
    defaultHeight: 500
  });

  const window = new BrowserWindow({
    minWidth: 400,
    minHeight: 500,
    maxWidth: 400,
    maxHeight: 500,
    maximizable: false,
    x: mainWindowState.x,
    y: mainWindowState.y,
    width: mainWindowState.width,
    height: mainWindowState.height,
    icon: appIcon,
    title: 'Pall - Color Picker',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true
    }
  })

  window.setMenuBarVisibility(false)

  if (isDevelopment) {
    window.webContents.openDevTools()
  }

  if (isDevelopment) {
    window.loadURL(`http://localhost:${process.env.ELECTRON_WEBPACK_WDS_PORT}`)
  }
  else {
    window.loadURL(formatUrl({
      pathname: path.join(__dirname, 'index.html'),
      protocol: 'file',
      slashes: true
    }))

    if (autoStartToTray) {
      autoLauncher.isEnabled().then(isEnabled => {
        if (isEnabled) return
    
        autoLauncher.enable()
      })
    } else {
      autoLauncher.disable()
    }
  }

  window.on('closed', () => {
    mainWindow = null
  })

  window.on('close', ev => {
    const isMinimize = store.get('settings.minimizeToTrayOnExit') ? store.get('settings.minimizeToTrayOnExit') : false
    if (isMinimize) {
      ev.preventDefault()
      window.hide()
    }

    mainWindow.webContents.send('closewindow', 'close this window')
  })

  window.webContents.on('devtools-opened', () => {
    window.focus()
    setImmediate(() => {
      window.focus()
    })
  })

  mainWindowState.manage(window)

  return window
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }

  globalShortcut.unregisterAll()
})

app.on('activate', () => {
  if (mainWindow === null) {
    mainWindow = createMainWindow()
  }
})

function getLastColorToClipboard() {
  const colors = store.get('colors')
  if (colors && colors.length > 0) {
    const shiftOne = colors.shift()
    clipboard.writeText(shiftOne.code)
  }
}

app.on('ready', () => {
  mainWindow = createMainWindow()
  tray = new Tray(appIcon)
  const contextMenu = Menu.buildFromTemplate([
    {label: 'Restore Window', click: function () { mainWindow.show() }},
    {label: 'Copy Last Color', click: function () {
      getLastColorToClipboard()
    }},
    {label: 'Quit', click: function () { app.quit() } }
  ])
  tray.setToolTip('Your Pall')
  tray.setContextMenu(contextMenu)

  mainWindow.webContents.once('dom-ready', () => {
    const shortcuts = globalShortcut.register(globalColorPick, () => {
      mainWindow.webContents.send('capture', 'captureCursor')
    })

    const lastColor = globalShortcut.register(globalPickLast, () => {
      getLastColorToClipboard()
    })
  
    if (!shortcuts || !lastColor) {
      console.log('one of the shortcuts failed to register')
    }
  })
})

ipcMain.on('close-main-window', () => {
  app.quit()
})
