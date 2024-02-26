const { app, BrowserWindow, globalShortcut, ipcMain } = require('electron');
const { spawn } = require('child_process');
const axios = require('axios');

app.disableHardwareAcceleration();

function createWindow() {
  const win = new BrowserWindow({
    width: 865,
    height: 1250,
    titleBarStyle: 'hidden',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  win.setIgnoreMouseEvents(false);
  win.loadFile('index.html');
  ipcMain.on('openTerminal', (event, { directory }) => {
    const mainProcess = process;
    mainProcess.env['PTYPATH'] = process.env['PTYPATH'];

    // Spawn a new terminal process in the background
    const terminalProcess = spawn('cmd.exe', ['/K', `cd ${directory}`], {
      detached: true,
      stdio: 'ignore', // Redirect standard I/O streams
    });
    terminalProcess.unref(); // Allow the main process to exit independently of the terminal process
  });

  return win;
}

let mainWindow;
let modalWindow;

app.whenReady().then(() => {
  mainWindow = createWindow();
  
  const ret = globalShortcut.register('CmdOrCtrl+G', () => {
    mainWindow.webContents.send('stop-alarm');
  });

  if (!ret) {
    console.log('registration failed');
  }

  ipcMain.on('open-chat-window', (event, arg) => {
    if (modalWindow) {
      modalWindow.close();
    }
  
    modalWindow = new BrowserWindow({
      width: 1050,
      height: 900,
      titleBarStyle: 'hidden',
      frame: true,
      parent: mainWindow,
      modal: false,
      show: false,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
      }
    });

    modalWindow.loadFile('chat.html'); // this is the html file with chat UI
    modalWindow.webContents.on('did-finish-load', () => {
      modalWindow.show();
       if (arg) {
      modalWindow.webContents.send('message-to-server', { prompt: arg });
    }
    });

    modalWindow.on('closed', () => {
      modalWindow = null;
    });
  });

  ipcMain.on('forward-to-chat', (event, arg) => {
    if (modalWindow) {
      modalWindow.webContents.send('message-to-server', arg);
    }
  });

  ipcMain.on('close-chat-window', () => {
    if (modalWindow) {
      modalWindow.close();
    }
  });
});

app.on('will-quit', () => {
  globalShortcut.unregister('34');
  globalShortcut.unregisterAll();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    mainWindow = createWindow();
  }
});
