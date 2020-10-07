"use strict";

const { app, BrowserWindow, ipcMain, net, screen } = require("electron");
const path = require("path");
const url = require('url');

const PY_MODULE = "back/main.py";
const SERVER_RUNNING = false;

// Keep a global reference of the mainWindow object, if you don't, the mainWindow will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow = null;
let subpy = null;
let PROJECT_NAME = '';
let LAST_EPOCH = 0;

const startPythonSubprocess = () => {
    if (!SERVER_RUNNING){
      	subpy = require("child_process").spawn("python", [PY_MODULE]);
        console.log(`started process at ${subpy.pid}`);
    }
};

function killPythonSubprocess(){
  if (!SERVER_RUNNING){
      let cleanup_completed = false;
      if (!subpy.killed)  {
        console.log(`killing ${subpy.pid}`);
        subpy.kill();
      }
      cleanup_completed = true;
      return new Promise(function(resolve, reject) {
        (function waitForSubProcessCleanup() {
          cleanup_completed ? resolve() : reject();
          setTimeout(waitForSubProcessCleanup, 30);
        })();
      });
  }
  return new Promise(function(resolve, reject) {
      (function waitForSubProcessCleanup() {
          resolve();
      })();
  });
}


ipcMain.on('startTraining', function(e, item){
    PROJECT_NAME = item;
	const request = net.request('http://localhost:5000/runTrain/' + PROJECT_NAME);
	request.on('response', (response) => {
	    response.on('data', (data) => {
	      let json = JSON.parse(data.toString());
	      if (json.status === 'ready') {
            mainWindow.webContents.send('changeStatus', json.status);
            startChecking();
          }
	    })
  	});
  	request.end()
});

function startChecking() {
      let rl = setInterval(function () {
        const request = net.request('http://localhost:5000/trainStatus/'+PROJECT_NAME+'/'+LAST_EPOCH);
        request.on('response', (response) => {
            response.on('data', (data) => {
              let json = JSON.parse(data.toString());
              mainWindow.webContents.send('changeStatus', json.status);
              if (json.status === 'done') {
                mainWindow.webContents.send('addEpochs', JSON.stringify(json.new_epochs));
                clearInterval(rl);
              }
              else if (!!json.new_epochs) {
                LAST_EPOCH = json.new_epochs[json.new_epochs.length-1].epoch_num;
                mainWindow.webContents.send('addEpochs', JSON.stringify(json.new_epochs));
              }
            })
        });
        request.end()
      }, 1500)
}

const createMainWindow = (x_custom, y_custom) => {
  // Create the browser mainWindow
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    x: x_custom,
    y: y_custom,
    resizeable: true,
    webPreferences: {
        nodeIntegration: true
    }
  });

  // Load the index page
  mainWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'front/mainWindow.html'),
    protocol: 'file:',
    slashes:true
  }));

  // Open the DevTools.
  //mainWindow.webContents.openDevTools();

  // Emitted when the mainWindow is closed.
  mainWindow.on("closed", function() {
    // Dereference the mainWindow object
    mainWindow = null;
  });
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", function() {
  // start the backend server
  startPythonSubprocess();
  let height = screen.getPrimaryDisplay().bounds.height;
  createMainWindow(0, height/2-300);
});

// disable menu
// app.on("browser-window-created", function(e, window) {
//   window.setMenu(null);
// });

// Quit when all windows are closed.
app.on("window-all-closed", () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== "darwin") {
    killPythonSubprocess().then(() => {
      app.quit();
    }).catch(function () {
      console.log(`rejected`)
    });
  }
});

app.on("activate", () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (subpy == null) {
    startPythonSubprocess();
  }
});

app.on("quit", function() {
    killPythonSubprocess()
});