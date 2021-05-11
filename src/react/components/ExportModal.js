import {Button, Form, FormControl, Modal} from "react-bootstrap";
import React, {Component} from 'react';

const {dialog} = window.require('electron').remote;
const {ipcRenderer} = window.require("electron");

export class ExportModal extends Component {
    constructor(props) {
        super(props);
        this.state = {
            configPath: '',
            exportFolder: '',
            exportType: 'onnx',
            exportPrefix: ''
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
        console.log(event.target.value);
        this.setState(state => {
            state.exportType = event.target.value;
            return state
        })
    }

    render() {
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