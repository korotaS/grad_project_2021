const {app, BrowserWindow, ipcMain, net, shell} = require("electron");
const path = require("path");
const getPort = require('get-port');

const PY_MODULE = "src/python/main.py";
const SERVER_RUNNING = false;
const QUIT_ON_CLOSING = true;
const DEV = false;

// Keep a global reference of the mainWindow object, if you don't, the mainWindow will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow = null;
let subpy = null;
let host = 'localhost'
let port = 5000;
let numGpus = -1

// -----INITIALIZATION-----

const startPythonSubprocess = () => {
    if (!SERVER_RUNNING) {
        (async () => {
            port = await getPort({port: 5000});
            let command = process.platform.toLowerCase() === 'win32' ? 'py' : 'python'
            subpy = require("child_process").spawn(command, [PY_MODULE, '--port', port.toString()]);
            console.log(`started process at ${subpy.pid} on port ${port}`);
            mainWindow.webContents.send('pythonPort', {port: port});
        })();
    } else {
        mainWindow.webContents.send('pythonPort', {port: port});
    }
};

const createMainWindow = (x_custom, y_custom) => {
    // Create the browser mainWindow
    mainWindow = new BrowserWindow({
        width: 800,
        minWidth: 800,
        height: 1000,
        minHeight: 1000,
        x: x_custom,
        y: y_custom,
        resizeable: true,
        webPreferences: {
            nodeIntegration: true,
            enableRemoteModule: true,
            worldSafeExecuteJavaScript: true,
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

    mainWindow.webContents.on('new-window', function (e, url) {
        e.preventDefault();
        shell.openExternal(url);
    });
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", function () {
    // start the backend server
    createMainWindow(0, 0);
    startPythonSubprocess();
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

ipcMain.on('getPythonPort', function (e) {
    mainWindow.webContents.send('pythonPort', {port: port});
});

ipcMain.on('runTraining', function (e, item) {
    const request = net.request({
        method: 'POST',
        hostname: host,
        port: port,
        path: '/runTraining'
    });

    request.on('error', (error) => {
        let message = "Can't run training because python server is not running."
        mainWindow.webContents.send('netError', {name: error.message, message: message, noTrain: true});
    })

    let post_data = JSON.stringify({config: item.config, loadConfig: item.loadConfig});
    request.write(post_data);
    request.end();
});

ipcMain.on('stopTraining', function (e) {
    const path = `http://${host}:${port}/stopTraining`
    const request = net.request(path);
    request.on('response', (response) => {
        response.on('data', (data) => {
            let json = JSON.parse(data.toString());
            if (json.status === 'ok') {
                mainWindow.webContents.send('trainingStopped');
            }
        })
    });
    request.on('error', (error) => {
        // console.log(path);
        // console.log(error)
    })
    request.end()
});

ipcMain.on('export', function (e, item) {
    const request = net.request({
        method: 'POST',
        hostname: host,
        port: port,
        path: '/export'
    })

    request.on('response', (response) => {
        response.on('data', (data) => {
            let json = JSON.parse(data.toString());
            switch (json.status) {
                case 'ok': {
                    mainWindow.webContents.send('exportOk', {outPath: json.outPath});
                    break
                }
                case 'error': {
                    mainWindow.webContents.send('exportError', {message: json.errorMessage});
                    break
                }
                default:
                    break
            }
        })
    });

    request.on('error', (error) => {
        let message = "Can't export because python server is not running."
        mainWindow.webContents.send('exportNetError', {name: error.message, message: message});
    })

    let post_data = {
        cfgPath: item.configPath,
        folder: item.exportFolder,
        prefix: item.exportPrefix,
        exportType: item.exportType
    };
    request.write(JSON.stringify(post_data));
    request.end();
});

ipcMain.on('launchTB', function (e, item) {
    const taskTypeForTB = item.taskTypeForTB;

    (async () => {
        const tb_port = await getPort({port: getPort.makeRange(6006, 6100)});
        const path = `http://localhost:${port}/launchTB/${taskTypeForTB}/${tb_port}`
        const request = net.request(path);
        request.on('response', (response) => {
            response.on('data', (data) => {
                let json = JSON.parse(data.toString());
                if (json.status === 'ok') {
                    shell.openExternal(json.url);
                    mainWindow.webContents.send('tbLaunched',
                        {
                            status: 'ok',
                            taskTypeForTB: taskTypeForTB,
                            tbLink: json.url,
                            port: tb_port
                        }
                    );
                }
            })
        });
        request.on('error', (error) => {
            let message = "Can't launch TensorBoard because python server is not running."
            mainWindow.webContents.send('netError', {name: error.message, message: message});
            mainWindow.webContents.send('tbLaunched', {status: 'error'});
        })
        request.end()
    })();
});

ipcMain.on('killTB', function () {
    const path = `http://localhost:${port}/killTB`
    const request = net.request(path);
    request.on('response', (response) => {
        response.on('data', (data) => {
            let json = JSON.parse(data.toString());
            mainWindow.webContents.send('tbKilled', {info: json.info});
        })
    });
    request.end()
});

ipcMain.on('testConnection', function (e, item) {
    const path = `http://${item.host}:${item.port}/health`
    const request = require('request');
    request.get({uri: path, timeout: 5000}, function (err, response, body) {
        if (err) {
            mainWindow.webContents.send('testedConnection', {
                status: 'error',
                errorName: err.code
            });
        } else {
            mainWindow.webContents.send('testedConnection', {status: 'ok', test: item.test});
        }
    })
});

ipcMain.on('getNumGpus', function (e) {
    if (SERVER_RUNNING) {
        const path = `http://${host}:${port}/getNumGpus`
        const request = net.request(path);
        request.on('response', (response) => {
            response.on('data', (data) => {
                let json = JSON.parse(data.toString());
                numGpus = json.numGpus
                mainWindow.webContents.send('gotNumGpus', json);
            })
        });
        request.on('error', (error) => {
            let message = "Can't get number of GPUs because python server is not running."
            mainWindow.webContents.send('netError', {name: error.message, message: message});
        })
        request.end()
    } else {
        numGpus = 0
        mainWindow.webContents.send('gotNumGpus', {numGpus: numGpus});
    }
});

ipcMain.on('getConfig', function (e, item) {
    const request = net.request({
        method: 'POST',
        hostname: host,
        port: port,
        path: '/getConfig'
    })
    request.on('response', (response) => {
        response.on('data', (data) => {
            let json = JSON.parse(data.toString());
            mainWindow.webContents.send('gotConfig', json);
        })
    });
    request.on('error', (error) => {
        let message = "Can't get config because python server is not running."
        mainWindow.webContents.send('gotConfig', {status: 'error', errorMessage: message});
    })
    let post_data = {
        path: item.path,
    };
    request.write(JSON.stringify(post_data));
    request.end()
});

ipcMain.on('changeToRemote', function (e, item) {
    killPythonSubprocess().then(() => {
        subpy = null
        host = item.host
        port = item.port
    })
})

ipcMain.on('startNewPython', function () {
    if (!SERVER_RUNNING) {
        (async () => {
            host = 'localhost'
            port = await getPort({port: 5000});
            subpy = require("child_process").spawn("python", [PY_MODULE, '--port', port.toString()]);
            console.log(`started process at ${subpy.pid} on port ${port}`);
            mainWindow.webContents.send('startedNewPython', {port: port});
        })();
    } else {
        host = 'localhost'
        port = 5000
        mainWindow.webContents.send('startedNewPython', {port: port});
    }
})

// -----END OF RUNTIME-----

// -----QUITING-----

function killPythonSubprocess() {
    if (!SERVER_RUNNING) {
        let cleanup_completed = false;
        if (!subpy.killed) {
            console.log(`killing python subprocess with pid=${subpy.pid}`);
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
    // last chance to clear something
});

// -----END OF QUITING-----