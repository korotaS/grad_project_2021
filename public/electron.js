const {app, BrowserWindow, ipcMain, net, shell, dialog} = require("electron");
const path = require("path");
const getPort = require('get-port');
const yaml = require('js-yaml');
const fs = require('fs');

const PY_MODULE = "src/python/main.py";
const SERVER_RUNNING = false;
const QUIT_ON_CLOSING = true;
const DEV = true;

// Keep a global reference of the mainWindow object, if you don't, the mainWindow will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow = null;
let subpy = null;
let PROJECT_NAME = '';
let LAST_EPOCH = 0;
let port = 5000;

// -----INITIALIZATION-----

const startPythonSubprocess = () => {
    if (!SERVER_RUNNING) {
        (async () => {
            port = await getPort({port: 5000});
            subpy = require("child_process").spawn("python", [PY_MODULE, '--port', port.toString()]);
            // subpy = require("child_process").spawn("python", [PY_MODULE]);
            console.log(`started process at ${subpy.pid} on port ${port}`);
        })();
    }
};

const createMainWindow = (x_custom, y_custom) => {
    // Create the browser mainWindow
    mainWindow = new BrowserWindow({
        width: 1200,
        minWidth: 800,
        height: 600,
        minHeight: 600,
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

// ipcMain.on('startTraining', function (e, item) {
//     PROJECT_NAME = item;
//     const request = net.request(`http://localhost:${port}/runTrain/` + PROJECT_NAME);
//     request.on('response', (response) => {
//         response.on('data', (data) => {
//             let json = JSON.parse(data.toString());
//             if (json.status === 'ready') {
//                 mainWindow.webContents.send('changeStatus', json.status);
//                 checkStatus();
//             }
//         })
//     });
//     request.end()
// });
//
// function checkStatus() {
//     let rl = setInterval(function () {
//         const request = net.request(`http://localhost:${port}/trainStatus/` + PROJECT_NAME + '/' + LAST_EPOCH);
//         request.on('response', (response) => {
//             response.on('data', (data) => {
//                 let json = JSON.parse(data.toString());
//                 mainWindow.webContents.send('changeStatus', json.status);
//                 if (json.status === 'done') {
//                     mainWindow.webContents.send('addEpochs', JSON.stringify(json.new_epochs));
//                     clearInterval(rl);
//                 } else if (!!json.new_epochs) {
//                     LAST_EPOCH = json.new_epochs[json.new_epochs.length - 1].epoch_num;
//                     mainWindow.webContents.send('addEpochs', JSON.stringify(json.new_epochs));
//                 }
//             })
//         });
//         request.end()
//     }, 1500)
// }

ipcMain.on('configChosen', function (e, item) {
    let config = yaml.load(fs.readFileSync(item.configPath, 'utf8'));
    const request = net.request({
        method: 'POST',
        hostname: 'localhost',
        port: port,
        path: '/validateConfig'
    })

    request.on('response', (response) => {
        response.on('data', (data) => {
            let json = JSON.parse(data.toString());
            // dialog.showMessageBox({message: data.toString()});
            if (json.status === 'ok') {
                const requestInit = net.request({
                    method: 'POST',
                    hostname: 'localhost',
                    port: port,
                    path: '/init'
                });
                requestInit.write(post_data);
                requestInit.end();
            } else {
                alert(json.error);
            }
        })
    });

    let post_data = JSON.stringify(config);
    request.write(post_data);
    request.end();
});

ipcMain.on('export', function (e, item) {
    let config = yaml.load(fs.readFileSync(item.configPath, 'utf8'));
    const request = net.request({
        method: 'POST',
        hostname: 'localhost',
        port: port,
        path: '/export'
    })

    request.on('response', (response) => {
        response.on('data', (data) => {
            let json = JSON.parse(data.toString());
            if (json.status === 'ok') {
                // dialog.showMessageBox({message: json.outPath});
            } else {

            }
        })
    });

    let post_data = {
        cfg: config,
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
    console.log(taskTypeForTB);

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
            console.log(path);
            console.log(error)
            mainWindow.webContents.send('tbLaunched',
                {
                    status: 'error'
                }
            );
        })
        request.end()
    })();
});

ipcMain.on('stopTraining', function (e) {
    const path = `http://localhost:${port}/stopTraining`
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
        console.log(path);
        console.log(error)
    })
    request.end()
});

// ipcMain.on('submitChoice1', function (e, item) {
//     mainWindow.webContents.send('afterChoice1', item);
// });
//
// ipcMain.on('submitChoice2', function (e, item) {
//     mainWindow.webContents.send('afterChoice2', item);
// });
//
// ipcMain.on('submitChoice3', function (e, item) {
//     const task = item.taskSubClass;
//     const request = net.request(`http://localhost:${port}/getArchs/` + task);
//     request.on('response', (response) => {
//         response.on('data', (data) => {
//             let json = JSON.parse(data.toString())
//             item.architectures = json.architectures
//             mainWindow.webContents.send('afterChoice3', item);
//         })
//     });
//     request.end()
// });
//
// ipcMain.on('submitChoice4', function (e, item) {
//     const request = net.request({
//         method: 'POST',
//         hostname: 'localhost',
//         port: 5000,
//         path: '/init'
//     })
//
//     request.on('response', (response) => {
//         if (response.statusCode === 200) {
//             response.on('data', (data) => {
//                 let json = JSON.parse(data.toString());
//                 if (json.status === 'INITIALIZED') {
//                     mainWindow.webContents.send('projectInitialized', item.projectName);
//                 }
//             })
//         }
//     })
//
//     let post_data = JSON.stringify(item);
//     request.write(post_data);
//     request.end();
// });

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