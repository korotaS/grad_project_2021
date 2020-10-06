"use strict";

const { app, BrowserWindow, ipcMain, net, screen } = require("electron");
const path = require("path");
const url = require('url');

// Keep a global reference of the mainWindowdow object, if you don't, the mainWindowdow will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow = null;
let subpy = null;

const PY_MODULE = "main.py"; // the name of the main module

const startPythonSubprocess = () => {
	subpy = require("child_process").spawn("python", [PY_MODULE]);
    console.log(`started process at ${subpy.pid}`);
};

function killPythonSubprocess(){
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


ipcMain.on('item:select', function(e, item){
    console.log(item);
	const request = net.request('http://localhost:5000/run/123');
	request.on('response', (response) => {
	    response.on('data', (data) => {
	      console.log(`${data}`)
	      startChecking();
	    })
  	});
  	request.end()
});

function startChecking() {
      let rl = setInterval(function () {
        const request = net.request('http://localhost:5000/test');
        request.on('response', (response) => {
            response.on('data', (data) => {
              let json = JSON.parse(data.toString());
              console.log(`${json.done}, arr: ${json.data}`);
              if (json.done) {
                clearInterval(rl);
                console.log(`done!`)
              }
            })
        });
        request.end()
      }, 100)
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
    pathname: path.join(__dirname, 'mainWindow.html'),
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