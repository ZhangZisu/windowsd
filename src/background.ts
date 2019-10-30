import { app, protocol, BrowserWindow, Tray, Menu } from 'electron'
import { createProtocol, installVueDevtools } from 'vue-cli-plugin-electron-builder/lib'
import * as path from 'path'

const isDevelopment = process.env.NODE_ENV !== 'production'

let win: BrowserWindow | null
let tray: Tray | null

function createWindow () {
  win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true
    },
    frame: false
  })

  if (process.env.WEBPACK_DEV_SERVER_URL) {
    // Load the url of the dev server if in development mode
    win.loadURL(process.env.WEBPACK_DEV_SERVER_URL as string)
    if (!process.env.IS_TEST) win.webContents.openDevTools()
  } else {
    createProtocol('app')
    // Load the index.html when not in development
    win.loadURL('app://./index.html')
  }

  win.on('closed', () => {
    win = null
  })
}

function createTray () {
  const contextMenu = Menu.buildFromTemplate([
    { label: 'Show', click: () => { if (win !== null) win.show() } },
    { label: 'Quit', click: () => { app.quit() } }
  ])
  tray = new Tray(path.join(__static, 'favicon.ico'))
  tray.setContextMenu(contextMenu)
  tray.on('double-click', () => {
    if (win !== null) {
      win.show()
    }
  })
}

if (app.requestSingleInstanceLock()) {
  protocol.registerSchemesAsPrivileged([{ scheme: 'app', privileges: { secure: true, standard: true } }])

  app.on('activate', () => {
    if (win === null) {
      createWindow()
    }
  })

  app.on('ready', async () => {
    if (isDevelopment && !process.env.IS_TEST) {
      try {
        await installVueDevtools()
      } catch (e) {
        console.error('Vue Devtools failed to install:', e.toString())
      }
    }
    createWindow()
    createTray()
  })

  if (isDevelopment) {
    if (process.platform === 'win32') {
      process.on('message', data => {
        if (data === 'graceful-exit') {
          app.quit()
        }
      })
    } else {
      process.on('SIGTERM', () => {
        app.quit()
      })
    }
  }
} else {
  app.quit()
}
