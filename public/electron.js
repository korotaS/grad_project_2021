"use strict";

const {app, BrowserWindow, ipcMain, net} = require("electron");
const path = require("path");
const url = require('url');

const PY_MODULE = "src/python/main.py";
const SERVER_RUNNING = false;
const QUIT_ON_CLOSING = true;

// Keep a global reference of the mainWindow object, if you don't, the mainWindow will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow = null;
let subpy = null;
let PROJECT_NAME = '';
let LAST_EPOCH = 0;

// -----INITIALIZATION-----

const startPythonSubprocess = () => {
    if (!SERVER_RUNNING) {
        subpy = require("child_process").spawn("python", [PY_MODULE]);
        console.log(`started process at ${subpy.pid}`);
    }
};

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
        pathname: path.join(__dirname, 'public/index.html'),
        protocol: 'file:',
        slashes: true
    }));

    // Open the DevTools.
    //mainWindow.webContents.openDevTools();

    // Emitted when the mainWindow is closed.
    mainWindow.on("closed", function () {
        // Dereference the mainWindow object
        mainWindow = null;
    });
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", function () {
    // start the backend server
    startPythonSubprocess();
    createMainWindow(0, 0);
});

// disable menu
// app.on("browser-window-created", function(e, window) {
//   window.setMenu(null);
// });

app.on("activate", () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (subpy == null) {
        startPythonSubprocess();
    }
});

// -----END OF INITIALIZATION-----

// -----RUNTIME-----

ipcMain.on('startTraining', function (e, item) {
    PROJECT_NAME = item;
    const request = net.request('http://localhost:5000/runTrain/' + PROJECT_NAME);
    request.on('response', (response) => {
        response.on('data', (data) => {
            let json = JSON.parse(data.toString());
            if (json.status === 'ready') {
                mainWindow.webContents.send('changeStatus', json.status);
                checkStatus();
            }
        })
    });
    request.end()
});

function checkStatus() {
    let rl = setInterval(function () {
        const request = net.request('http://localhost:5000/trainStatus/' + PROJECT_NAME + '/' + LAST_EPOCH);
        request.on('response', (response) => {
            response.on('data', (data) => {
                let json = JSON.parse(data.toString());
                mainWindow.webContents.send('changeStatus', json.status);
                if (json.status === 'done') {
                    mainWindow.webContents.send('addEpochs', JSON.stringify(json.new_epochs));
                    clearInterval(rl);
                } else if (!!json.new_epochs) {
                    LAST_EPOCH = json.new_epochs[json.new_epochs.length - 1].epoch_num;
                    mainWindow.webContents.send('addEpochs', JSON.stringify(json.new_epochs));
                }
            })
        });
        request.end()
    }, 1500)
}

// -----END OF RUNTIME-----

// -----QUITING-----

function killPythonSubprocess() {
    if (!SERVER_RUNNING) {
        let cleanup_completed = false;
        if (!subpy.killed) {
            console.log(`killing ${subpy.pid}`);
            subpy.kill();
        }
        cleanup_completed = true;
        return new Promise(function (resolve, reject) {
            (function waitForSubProcessCleanup() {
                cleanup_completed ? resolve() : reject();
                setTimeout(waitForSubProcessCleanup, 30);
            })();
        });
    }
    return new Promise(function (resolve, reject) {
        (function func() {
            resolve();
        })();
    });
}

// Quit when all windows are closed.
app.on("window-all-closed", () => {
    if (process.platform !== "darwin" || QUIT_ON_CLOSING) {
        killPythonSubprocess().then(() => {
            app.quit();
        }).catch(function () {
            console.log(`rejected`)
        });
    }
});

app.on("quit", function () {
    killPythonSubprocess()
});

// -----END OF QUITING-----