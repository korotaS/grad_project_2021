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
            error: null
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
            alert("Choose config path please!")
        } else if (this.state.exportFolder === "") {
            alert("Choose export folder please!")
        } else {
            this.setState(state => {
                state.error = null;
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

    clearState() {
        this.setState(state => {
            state.configPath = ''
            state.exportFolder = ''
            state.exportPrefix = ''
            state.exportType = 'onnx'
            state.error = null
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
                return state
            })
        }
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
                state.error = data;
                return state
            })
        }.bind(this))
    }

    render() {
        let errorMessage;
        if (this.state.error !== null) {
            errorMessage = <div>{`Error: ${this.state.error.message}`}</div>
        }
        return (
            <Modal
                {...this.props}
                size="lg"
                aria-labelledby="contained-modal-title-vcenter"
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
                        <Button
                            variant="success" type="submit"
                            onClick={this.chooseConfig}
                        >Choose config</Button>
                        <br/>
                        <div style={{fontSize: 10}}>{this.state.configPath}</div>
                        <Button style={{marginTop: '10px'}}
                                variant="success" type="submit"
                                onClick={this.chooseFolder}
                        >Choose export folder</Button>
                        <div style={{fontSize: 10}}>{this.state.exportFolder}</div>
                        <FormControl style={{marginTop: '10px'}}
                                     placeholder="Prefix"
                                     aria-label="prefix"
                                     onChange={this.handlePrefixChange}
                                     defaultValue={this.state.exportPrefix}
                        />
                        <input style={{marginTop: '10px'}}
                               type="radio"
                               value="onnx"
                               checked={this.state.exportType === "onnx"}
                               onChange={(event) => {
                                   event.persist();
                                   this.onRadioChange(event)
                               }}
                        />
                        <span style={{marginLeft: "5px"}}>ONNX</span>
                        <input style={{marginTop: '10px', marginLeft: "10px"}}
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
                        <Button style={{marginTop: '10px'}}
                                variant="success"
                                type="submit"
                                onClick={this.submitChoice}
                        >Export</Button>
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
                        style={{transition: "none"}}>Close</Button>
                <Button variant="primary" onClick={() => props.onHide(props.value)}
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
            dialogClassName="modal-traceback"
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
                <Button variant="primary" onClick={props.onHide} style={{transition: "none"}}>Close</Button>
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
                <Button variant="primary" onClick={props.onHide} style={{transition: "none"}}>Close</Button>
            </Modal.Footer>
        </Modal>
    );
}

export class RemoteModal extends Component {
    constructor(props) {
        super(props);
        this.state = {
            connecting: false,
            afterTestedMessage: '',
            creds: {
                host: '46.138.241.190',
                port: '8819'
            }
        }
    }

    changeRemoteField(event, field) {
        let value = event.target.value;
        this.setState(state => {
            state.creds[field] = value;
            return state
        })
    }

    testConnection() {
        this.setState(state => {
            state.connecting = true
            state.afterTestedMessage = ''
            return state
        })
        ipcRenderer.send('testConnection', this.state.creds);
    }

    componentDidMount() {
        ipcRenderer.on('testedConnection', function (e, data) {
            this.setState(state => {
                state.connecting = false
                if (data.status === 'ok') {
                    state.afterTestedMessage = 'Connected successfully!'
                } else {
                    state.afterTestedMessage = `Failed to connect due to error: ${data.errorName}`
                }
                return state
            })
        }.bind(this))
    }

    render() {
        let afterTestedText
        if (this.state.afterTestedMessage) {
            afterTestedText = <div>{this.state.afterTestedMessage}</div>
        }

        return (
            <Modal
                {...this.props}
                aria-labelledby="contained-modal-title-vcenter"
                centered
            >
                <Modal.Header closeButton>
                    <Modal.Title id="contained-modal-title-vcenter">
                        Change to remote
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <FormControl placeholder="Host"
                                 onChange={(event) => this.changeRemoteField(event, 'host')}
                                 defaultValue={this.state.creds.host}/>
                    <FormControl placeholder="Port"
                                 onChange={(event) => this.changeRemoteField(event, 'port')}
                                 defaultValue={this.state.creds.port}/>
                    {afterTestedText}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="primary" style={{transition: "none"}}
                            onClick={this.testConnection.bind(this)}
                            disabled={this.state.connecting}
                    >{this.state.connecting ? 'Connecting' : 'Test connection'}</Button>
                    <Button variant="primary" style={{transition: "none"}}
                            disabled={this.state.connecting}>Connect</Button>
                </Modal.Footer>
            </Modal>
        );
    }
}