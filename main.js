'use strict';

const electron = require('electron');

// Module to control application life.
const app = electron.app;

// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow;

var path = require('path');

// Server information
var SECC = require('./node_modules/secc/settings.json');
var scheduler = require('./node_modules/secc/lib/scheduler')(SECC);
var serverPort = SECC.scheduler.port;

// for menus
var Tray = require('tray');
var Menu = require('menu');
var iconPath = path.join(__dirname, 'icons', 'Icon.png');
var appIcon = null;
var contextMenu = null;

// for ipc
var ipcMain = electron.ipcMain;

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;

function createWindow () {
  mainWindow = new BrowserWindow({width: 1000, height: 600});
  mainWindow.loadURL('file://' + path.join(__dirname, 'app', 'index.html'));

  // Open the DevTools.
  mainWindow.webContents.openDevTools();

  // Emitted when the window is closed.
  mainWindow.on('closed', function() {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null;
  });
}

function createMenuBar() {
  appIcon = new Tray(iconPath);
  contextMenu = Menu.buildFromTemplate([
    {
      label: 'Start',
      type: 'radio',
      click: function(arg){
        // Request start event on Renderer Process
        mainWindow.webContents.send('call-start-scheduler');
      }
    },
    {
      label: 'Stop',
      type: 'radio',
      checked: true,
      click: function() {
        // Request start event on Renderer Process
        mainWindow.webContents.send('call-stop-scheduler');
      }
    },
    { label: 'Quit',
      accelerator: 'Command+Q',
      selector: 'terminate:',
    }
  ]);

  appIcon.setToolTip('This is Secc GUI Scheduler');
  appIcon.setContextMenu(contextMenu);
}


function startSheduler(port, successCallback) {
  //set custom port
  setSchedulerPort(port);
  

  scheduler.startServer(function(msg) {
    console.log(msg);
    
    // Change tray server state
    contextMenu.items[0].checked = true;
    successCallback();

  }, function(msg) {
    console.log(msg);
  });
}

function stopSheduler(successCallback) {
    scheduler.stopServer(function(msg) {
      console.log(msg);

      // Change tray server state
      contextMenu.items[1].checked = true;  
      successCallback();

    }, function(msg) {
      console.log(msg);
    });
}

function setSchedulerPort(port) {
  SECC.scheduler.port = port;
}


ipcMain.on('start-scheduler', function(event, port) {
  startSheduler(port, function() {
    event.sender.send('start-scheduler-callback');
  });
});

ipcMain.on('stop-scheduler', function(event, arg) {
  stopSheduler(function() {
    event.sender.send('stop-scheduler-callback');  
  });
});


// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.on('ready', function(){
  createWindow();
  createMenuBar();
});

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', function () {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow();
  }
});
