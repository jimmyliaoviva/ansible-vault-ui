// Native
import { dialog } from 'electron';
import * as fs from 'fs';
import path, { join } from 'path';

// Packages
import { BrowserWindow, IpcMainEvent, app, ipcMain } from 'electron';
import isDev from 'electron-is-dev';
// Warning: This package seems to have issue with import, use require instead
const { Vault } = require('ansible-vault');


const height = 600;
const width = 800;
let window: BrowserWindow;

function createWindow() {
  // Create the browser window.
  window = new BrowserWindow({
    width,
    height,
    //  change to false to use AppBar
    frame: false,
    show: true,
    resizable: true,
    fullscreenable: true,
    webPreferences: {
      preload: join(__dirname, 'preload.js')
    }
  });

  const port = process.env.PORT || 3000;
  const url = isDev ? `http://localhost:${port}` : join(__dirname, '../src/out/index.html');

  // and load the index.html of the app.
  if (isDev) {
    window?.loadURL(url);
  } else {
    window?.loadFile(url);
  }
  // Open the DevTools.
  window.webContents.openDevTools();

  // For AppBar
  ipcMain.on('minimize', () => {
    // eslint-disable-next-line no-unused-expressions
    window.isMinimized() ? window.restore() : window.minimize();
    // or alternatively: win.isVisible() ? win.hide() : win.show()
  });
  ipcMain.on('maximize', () => {
    // eslint-disable-next-line no-unused-expressions
    window.isMaximized() ? window.restore() : window.maximize();
  });

  ipcMain.on('close', () => {
    window.close();
  });
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

// listen the channel `message` and resend the received message to the renderer process
ipcMain.on('message', (event: IpcMainEvent, message: any) => {
  console.log(message);
  if (window) {
    console.log('sending message to renderer');
  }
  dialog.showOpenDialog(window, {
    properties: ['openFile', 'openDirectory']
  }).then(result => {
    console.log(result);
    if (!result.canceled) {
      const dirPath = result.filePaths[0];
      fs.readdir(dirPath, (err, files) => {
        if (err) {
          console.log(err);
        } else {
          console.log(files); // This will log all files in the directory
          event.sender.send('selected-directory', dirPath, files);
        }
      });
    }
  }).catch(err => {
    console.log(err);
  });
  setTimeout(() => event.sender.send('message', 'hi from electron'), 500);
});

ipcMain.on('button-event', (event: IpcMainEvent, message, ...args: any[]) => {
  console.log('button-event triggered', message);
  // determine what event is triggered (better to use factory pattern if there are many events)
  if (message === 'selectDirectory') {
    dialog.showOpenDialog(window, {
      properties: ['openFile', 'openDirectory']
    }).then(result => {
      console.log(result);
      if (!result.canceled) {
        const dirPath = result.filePaths[0];
        fs.readdir(dirPath, (err, files) => {
          if (err) {
            console.log(err);
          } else {
            console.log(files); // This will log all files in the directory
            event.sender.send('selected-directory', { dirPath: dirPath, files: files });
          }
        });
      }
    }).catch(err => {
      console.log(err);
    });
  } else if (message === 'decrypt') {
    console.log(args[0]);
    let keyPath = args[0];
    let encryptedString = args[1];
    const password = fs.readFileSync(path.resolve(keyPath), 'utf8');

    const v = new Vault({ password: password });
    console.log(encryptedString);
    encryptedString = encryptedString.split('\n').map((s: any) => s.trimStart()).join('\n');

    v.decrypt(encryptedString).then((decryptedString: any) => {
      console.log(decryptedString);
      event.sender.send('decrypt', decryptedString);
    }).catch((err: any) => {
      console.log(err);
    });
  } else if (message === 'encrypt') {
    let keyPath = args[0];
    let secret = args[1];

    const password = fs.readFileSync(path.resolve(keyPath), 'utf8');
    const v = new Vault({ password: password });

    v.encrypt(secret).then((encryptedString: any) => {
      console.log(encryptedString);
      event.sender.send('encrypt', encryptedString);
    }).catch((err: any) => {
      console.log(err);
    });
  }
});
