import {Button, Form, FormControl, Modal} from "react-bootstrap";
import React, {Component} from 'react';
import '../../styles/modals.css'

const {dialog} = window.require('electron').remote;
const {ipcRenderer} = window.require("electron");

export class ExportModal extends Component {
    constructor(props) {
        super(props);
        this.state = {
            configPath: '',
            exportFolder: '',
            exportType: 'onnx',
            exportPrefix: '',
            footerData: null
        };

        this.submitChoice = this.submitChoice.bind(this);
        this.chooseConfig = this.chooseConfig.bind(this);
        this.chooseFolder = this.chooseFolder.bind(this);
        this.handlePrefixChange = this.handlePrefixChange.bind(this)
        this.onRadioChange = this.onRadioChange.bind(this);
    }

    submitChoice(event) {
        event.preventDefault();
        if (this.state.configPath === "") {
            this.setState(state => {
                state.footerData = {message: 'Choose config path please!'}
                return state
            })
        } else if (this.state.exportFolder === "") {
            this.setState(state => {
                state.footerData = {message: 'Choose export folder please!'}
                return state
            })
        } else {
            this.setState(state => {
                state.footerData = null;
                state.waiting = true
                return state
            })
            ipcRenderer.send('export', {
                configPath: this.state.configPath,
                exportFolder: this.state.exportFolder,
                exportType: this.state.exportType,
                exportPrefix: this.state.exportPrefix
            });
        }
    }

    stripPath(path) {
        if (path === '') {
            return path
        }
        let splitPath = path.split('/')
        return splitPath[splitPath.length - 1]
    }

    clearState() {
        this.setState(state => {
            state.configPath = ''
            state.exportFolder = ''
            state.exportPrefix = ''
            state.exportType = 'onnx'
            state.waiting = false
            state.footerData = null
            return state
        })
    }

    chooseConfig(event) {
        event.preventDefault();
        let paths = dialog.showOpenDialogSync({
            properties: ['openFile'],
            filters: [
                {name: 'YAML configs', extensions: ['yaml']},
            ],
            defaultPath: '.'
        });
        if (paths != null) {

            this.setState(state => {
                state.configPath = paths[0];
                state.footerData = null
                return state
            })
        }
    }

    changeConfigRemote(event) {
        let value = event.target.value;
        this.setState(state => {
            state.configPath = value;
            return state
        })
    }

    changeExportFolderRemote(event) {
        let value = event.target.value;
        this.setState(state => {
            state.exportFolder = value;
            return state
        })
    }

    chooseFolder(event) {
        event.preventDefault();
        let paths = dialog.showOpenDialogSync({
            properties: ['openDirectory'],
            defaultPath: '.'
        });
        if (paths != null) {
            this.setState(state => {
                state.exportFolder = paths[0];
                state.footerData = null
                return state
            })
        }
    }

    handlePrefixChange(event) {
        let value = event.target.value;
        this.setState(state => {
            state.exportPrefix = value;
            return state
        })
    }

    onRadioChange = (event) => {
        this.setState(state => {
            state.exportType = event.target.value;
            return state
        })
    }

    componentDidMount() {
        ipcRenderer.on('exportNetError', function (e, data) {
            this.setState(state => {
                state.footerData = data;
                state.waiting = false
                return state
            })
        }.bind(this))

        ipcRenderer.on('exportError', function (e, data) {
            this.setState(state => {
                state.footerData = data;
                state.waiting = false
                return state
            })
        }.bind(this))

        ipcRenderer.on('exportOk', function (e, data) {
            this.setState(state => {
                state.footerData = {ok: true, message: `Exported to ${data.outPath}!`};
                state.waiting = false
                return state
            })
        }.bind(this))
    }

    render() {
        let toModalProps = {...this.props}
        delete toModalProps.remote

        let marginTop = '20px'

        let errorMessage;
        if (this.state.footerData !== null) {
            errorMessage =
                <div style={{marginTop: marginTop, color: 'ok' in this.state.footerData ? 'black' : 'red'}}>
                    {`${'ok' in this.state.footerData ? '' : 'Error: '}${this.state.footerData.message}`}
                </div>
        }
        return (
            <Modal
                {...toModalProps}
                aria-labelledby="contained-modal-title-vcenter"
                dialogClassName="modal-long"
                centered
                onHide={() => {
                    this.clearState();
                    this.props.onHide()
                }}
            >
                <Modal.Header closeButton>
                    <Modal.Title id="contained-modal-title-vcenter">
                        Export
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        {this.props.remote
                            ? <FormControl
                                placeholder="Config path on remote host"
                                onChange={this.changeConfigRemote.bind(this)}
                                defaultValue={this.state.configPath}/>
                            : <Button
                                variant="primary" type="submit"
                                onClick={this.chooseConfig}
                            >Choose config</Button>}
                        <div style={{fontSize: 10, color: 'gray'}}>{this.stripPath(this.state.configPath)}</div>
                        {this.props.remote
                            ? <FormControl
                                placeholder="Export folder on remote host"
                                onChange={this.changeExportFolderRemote.bind(this)}
                                defaultValue={this.state.exportFolder}/>
                            : <Button style={{marginTop: marginTop}}
                                      variant="primary" type="submit"
                                      onClick={this.chooseFolder}
                            >Choose export folder</Button>}
                        <div style={{fontSize: 10, color: 'gray'}}>{this.state.exportFolder}</div>
                        <FormControl style={{marginTop: marginTop}}
                                     placeholder="Prefix"
                                     aria-label="prefix"
                                     onChange={this.handlePrefixChange}
                                     defaultValue={this.state.exportPrefix}
                        />
                        <input style={{marginTop: marginTop}}
                               type="radio"
                               value="onnx"
                               checked={this.state.exportType === "onnx"}
                               onChange={(event) => {
                                   event.persist();
                                   this.onRadioChange(event)
                               }}
                        />
                        <span style={{marginLeft: "5px"}}>ONNX</span>
                        <input style={{marginTop: marginTop, marginLeft: "10px"}}
                               type="radio"
                               value="jit"
                               checked={this.state.exportType === "jit"}
                               onChange={(event) => {
                                   event.persist();
                                   this.onRadioChange(event)
                               }}
                        />
                        <span style={{marginLeft: "5px"}}>JIT</span>
                        <br/>
                        {errorMessage}
                        <Button style={{marginTop: marginTop}}
                                variant="success"
                                type="submit"
                                onClick={this.submitChoice}
                                disabled={this.state.waiting}
                        >{this.state.waiting ? 'Exporting...' : 'Export'}</Button>
                    </Form>
                </Modal.Body>
            </Modal>
        )
    }
}

export function SmthWrongModal(props) {
    let buttons;
    if (props.value !== '') {
        buttons = (
            <div>
                <Button variant="secondary" onClick={() => props.onHide()}
                        style={{transition: "none", marginRight: '10px'}}>Close</Button>
                <Button variant="success" onClick={() => props.onHide(props.value)}
                        style={{transition: "none"}}>Change</Button>
            </div>
        )
    } else {
        buttons = (
            <Button onClick={() => props.onHide()} style={{transition: "none"}}>Got it!</Button>
        )
    }
    return (
        <Modal
            {...props}
            size="lg"
            aria-labelledby="contained-modal-title-vcenter"
            centered
        >
            <Modal.Body>
                <h5>{props.message}</h5>
            </Modal.Body>
            <Modal.Footer>
                {buttons}
            </Modal.Footer>
        </Modal>
    );
}

export function TracebackModal(props) {
    return (
        <Modal
            {...props}
            aria-labelledby="contained-modal-title-vcenter"
            centered
            size={'lg'}
            dialogClassName="modal-long"
        >
            <Modal.Header closeButton>
                <Modal.Title id="contained-modal-title-vcenter">
                    Traceback
                </Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <p style={{whiteSpace: 'pre-line'}}>{props.value}</p>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={props.onHide} style={{transition: "none"}}>Close</Button>
            </Modal.Footer>
        </Modal>
    );
}

export function ErrorModal(props) {
    let errorName = props.value === null ? '' : props.value.name
    let errorMessage = props.value === null ? '' : props.value.message
    return (
        <Modal
            {...props}
            aria-labelledby="contained-modal-title-vcenter"
            centered
            size={'lg'}
        >
            <Modal.Header closeButton>
                <Modal.Title id="contained-modal-title-vcenter">
                    {`Error: ${errorName}`}
                </Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <h5>{errorMessage}</h5>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={props.onHide} style={{transition: "none"}}>Close</Button>
            </Modal.Footer>
        </Modal>
    );
}

export class LocalToRemoteModal extends Component {
    constructor(props) {
        super(props);
        this.state = {
            connecting: false,
            footerData: {
                error: false,
                message: ''
            },
            creds: {
                host: '46.138.241.190',
                port: '8819'
            }
        }

        this.connect = this.connect.bind(this);
        this.clearState = this.clearState.bind(this);
    }

    changeRemoteField(event, field) {
        let value = event.target.value;
        this.setState(state => {
            state.creds[field] = value;
            return state
        })
    }

    clearState() {
        this.setState(state => {
            state.footerData = {error: false, message: ''}
            state.connecting = false
            state.creds.host = ''
            state.creds.port = ''
            return state
        })
    }

    connect(test) {
        if (this.state.creds.host === '') {
            this.setState(state => {
                state.footerData = {error: true, message: 'Please enter host.'}
                return state
            })
        } else if (this.state.creds.port === '') {
            this.setState(state => {
                state.footerData = {error: true, message: 'Please enter port.'}
                return state
            })
        } else {
            this.setState(state => {
                state.connecting = true
                state.message = ''
                return state
            })
            ipcRenderer.send('testConnection', {...this.state.creds, test: test});
        }

    }

    componentDidMount() {
        ipcRenderer.on('testedConnection', function (e, data) {
            if (data.status === 'ok' && !data.test) {
                this.props.onHide({
                    status: 'connected',
                    ...this.state.creds
                })
                this.clearState()
            } else {
                this.setState(state => {
                    state.connecting = false
                    if (data.status === 'ok') {
                        state.footerData = {error: false, message: 'Connected successfully!'}
                    } else {
                        state.footerData = {error: true, message: `Failed to connect due to error: ${data.errorName}`}
                    }
                    return state
                })
            }
        }.bind(this))
    }

    render() {
        let afterTestedText
        if (this.state.footerData.message !== '') {
            afterTestedText = (
                <div style={{marginTop: '10px', color: this.state.footerData.error ? 'red': 'black'}}>
                    {this.state.footerData.message}
                </div>
            )
        }

        return (
            <Modal
                {...this.props}
                aria-labelledby="contained-modal-title-vcenter"
                centered
                onHide={() => {
                    this.clearState();
                    this.props.onHide()
                }}
            >
                <Modal.Header closeButton>
                    <Modal.Title id="contained-modal-title-vcenter">
                        Change to remote
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <FormControl placeholder="Host"
                                 style={{marginTop: '5px'}}
                                 onChange={(event) => this.changeRemoteField(event, 'host')}
                                 defaultValue={this.state.creds.host}/>
                    <FormControl placeholder="Port"
                                 style={{marginTop: '20px', marginBottom: '5px'}}
                                 onChange={(event) => this.changeRemoteField(event, 'port')}
                                 defaultValue={this.state.creds.port}/>
                    {afterTestedText}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="primary" style={{transition: "none"}}
                            onClick={() => this.connect(true)}
                            disabled={this.state.connecting}
                    >{this.state.connecting ? 'Connecting...' : 'Test connection'}</Button>
                    <Button variant="success" style={{transition: "none"}}
                            onClick={() => this.connect(false)}
                            disabled={this.state.connecting}>Connect</Button>
                </Modal.Footer>
            </Modal>
        );
    }
}

export function RemoteToLocalModal(props) {
    return (
        <Modal
            {...props}
            size="lg"
            aria-labelledby="contained-modal-title-vcenter"
            centered
        >
            <Modal.Body>
                <h5>Are you sure you want to change from remote server to local?</h5>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={() => props.onHide()}
                        style={{transition: "none"}}>Cancel</Button>
                <Button variant="primary" onClick={() => props.onHide(true)}
                        style={{transition: "none"}}>Change</Button>
            </Modal.Footer>
        </Modal>
    );
}

export class LoadFromConfigModal extends Component {
    constructor(props) {
        super(props);
        this.state = {
            configPath: '',
            footerData: {
                error: false,
                message: 'It needs to be a load config file with name of type "load_cfg_YYYYMMDDTHHMMSS.yaml".'
            },
            footerInitial: 'It needs to be a load config file with name of type "load_cfg_YYYYMMDDTHHMMSS.yaml".'
        }

        this.clearState = this.clearState.bind(this);
        this.sendConfig = this.sendConfig.bind(this);
    }

    clearState() {
        this.setState(state => {
            state.configPath = ''
            state.footerData = {error: false, message: state.footerInitial}
            return state
        })
    }

    chooseConfig(event) {
        event.preventDefault();
        let paths = dialog.showOpenDialogSync({
            properties: ['openFile'],
            filters: [
                {name: 'YAML configs', extensions: ['yaml']},
            ],
            defaultPath: '.'
        });
        if (paths != null) {
            let path = paths[0]
            if (this.isLoadCfg(path)) {
                this.setState(state => {
                    state.configPath = path;
                    return state
                })
            } else {
                this.setState(state => {
                    state.footerData = {error: true, message: 'The chosen file it not the "load_cfg" file.'}
                    return state
                })
            }
        }
    }

    stripPath(path) {
        if (path === '') {
            return path
        }
        let splitPath = path.split('/')
        return splitPath[splitPath.length - 1]
    }

    isLoadCfg(path) {
        let fileName = this.stripPath(path)
        return fileName.match('^load_cfg_\\d{8}T\\d{6}\\.yaml$') !== null
    }

    changeConfigRemote(event) {
        let value = event.target.value;
        this.setState(state => {
            state.configPath = value;
            if (!this.isLoadCfg(value)) {
                state.footerData = {error: true, message: 'The chosen file it not the "load_cfg" file.'}
            }
            return state
        })
    }

    sendConfig(event) {
        event.preventDefault();
        if (this.state.configPath === "") {
            this.setState(state => {
                state.footerData = {error: true, message: 'Choose config path please!'}
                return state
            })
        } else if (!this.isLoadCfg(this.state.configPath)) {
            this.setState(state => {
                state.footerData = {error: true, message: 'The chosen file it not the "load_cfg" file.'}
                return state
            })
        } else {
            this.setState(state => {
                state.footerData = null;
                return state
            })
            ipcRenderer.send('getConfig', {path: this.state.configPath})
            this.setState(state => {
                state.footerData = {error: false, message: 'Params loaded!'}
                return state
            })
        }
    }

    componentDidMount() {
        ipcRenderer.on('gotConfig', function (e, data) {
            if (data.status === 'ok') {
                this.props.loadParamsFromConfig(data.config)
                this.setState(state => {
                    state.footerData = {error: false, message: 'Params loaded!'}
                    return state
                })
            } else {
                this.setState(state => {
                    state.footerData = {error: true, message: data.errorMessage}
                    return state
                })
            }
        }.bind(this))
    }

    render() {
        let toModalProps = {...this.props}
        delete toModalProps.loadParamsFromConfig
        delete toModalProps.remote

        let errorMessage;
        if (this.state.footerData !== null) {
            errorMessage = (
                <div style={{
                    marginTop: '20px',
                    color: this.state.footerData.message.toLowerCase().includes('cho') ? 'red' : 'black'
                }}>
                    {this.state.footerData.message}
                </div>
            )
        }

        return (
            <Modal
                {...toModalProps}
                aria-labelledby="contained-modal-title-vcenter"
                dialogClassName="modal-long"
                centered
                onHide={() => {
                    this.clearState();
                    this.props.onHide()
                }}
            >
                <Modal.Header closeButton>
                    <Modal.Title id="contained-modal-title-vcenter">
                        Load params from config
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        {this.props.remote
                            ? <FormControl
                                placeholder="Config path on remote host"
                                onChange={this.changeConfigRemote.bind(this)}
                                defaultValue={this.state.configPath}/>
                            : <Button
                                variant="primary" type="submit"
                                style={{marginTop: '5px'}}
                                onClick={this.chooseConfig.bind(this)}
                            >Choose config</Button>}
                        <div style={{fontSize: 10, color: 'gray'}}>{this.stripPath(this.state.configPath)}</div>
                        {errorMessage}
                        <Button style={{marginTop: '20px'}}
                                variant="success"
                                type="submit"
                                onClick={this.sendConfig}
                                disabled={this.state.waiting}
                        >{'Load config'}</Button>
                    </Form>
                </Modal.Body>
            </Modal>
        )
    }
}