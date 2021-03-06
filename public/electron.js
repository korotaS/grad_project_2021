const {app, BrowserWindow, ipcMain, net} = require("electron");
const path = require("path");
const getPort = require('get-port');

const PY_MODULE = "src/python/main.py";
const SERVER_RUNNING = true;
const QUIT_ON_CLOSING = true;
const DEV = true;

// Keep a global reference of the mainWindow object, if you don't, the mainWindow will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow = null;
let subpy = null;
let subtb = null;
let PROJECT_NAME = '';
let LAST_EPOCH = 0;
let port = 0;

// -----INITIALIZATION-----

const startPythonSubprocess = () => {
    if (!SERVER_RUNNING) {
        (async () => {
            port = await getPort({port: 5000});
            subpy = require("child_process").spawn("python", [PY_MODULE, '--port', port.toString()]);
            console.log(`started process at ${subpy.pid} on port ${port}`);
            // subtb = require("child_process").spawn("tensorboard", ['--logdir', 'tb_logs/']);
            // console.log(`started tensorboard process at ${subtb.pid}`);
        })();
    }
};

const createMainWindow = (x_custom, y_custom) => {
    // Create the browser mainWindow
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 600,
        x: x_custom,
        y: y_custom,
        resizeable: true,
        webPreferences: {
            nodeIntegration: true,
            enableRemoteModule: true
        }
    });

    // Load the index page
    mainWindow.loadURL(
        DEV
            ? "http://localhost:3000"
            : `file://${path.join(__dirname, "../build/index.html")}`
    );

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
    const request = net.request(`http://localhost:${port}/runTrain/` + PROJECT_NAME);
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
        const request = net.request(`http://localhost:${port}/trainStatus/` + PROJECT_NAME + '/' + LAST_EPOCH);
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

ipcMain.on('submitChoice1', function (e, item) {
    mainWindow.webContents.send('afterChoice1', item);
});

ipcMain.on('submitChoice2', function (e, item) {
    mainWindow.webContents.send('afterChoice2', item);
});

ipcMain.on('submitChoice3', function (e, item) {
    const task = item.taskSubClass;
    const request = net.request(`http://localhost:${port}/getArchs/` + task);
    request.on('response', (response) => {
        response.on('data', (data) => {
            let json = JSON.parse(data.toString())
            item.architectures = json.architectures
            mainWindow.webContents.send('afterChoice3', item);
        })
    });
    request.end()
});

ipcMain.on('submitChoice4', function (e, item) {
    const request = net.request({
        method: 'POST',
        hostname: 'localhost',
        port: 5000,
        path: '/init'
    })

    request.on('response', (response) => {
        if (response.statusCode === 200) {
            response.on('data', (data) => {
                let json = JSON.parse(data.toString());
                if (json.status === 'INITIALIZED') {
                    mainWindow.webContents.send('projectInitialized', item.projectName);
                }
            })
        }
    })

    let post_data = JSON.stringify(item);
    request.write(post_data);
    request.end();
});

// -----END OF RUNTIME-----

// -----QUITING-----

function killPythonSubprocess() {
    if (!SERVER_RUNNING) {
        let cleanup_completed = false;
        if (!subpy.killed) {
            console.log(`killing python subprocess with pid=${subpy.pid}`);
            subpy.kill();
            // console.log(`killing tensorboard subprocess with pid=${subtb.pid}`);
            // subtb.kill();
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
    // last chance to clear something
});

// -----END OF QUITING-----