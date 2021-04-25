import React, {Component} from 'react';
import {Button, Form, Col, FormControl, ButtonGroup} from 'react-bootstrap';

const {dialog} = window.require('electron').remote;

const {ipcRenderer} = window.require("electron");

class ChooseExport extends Component {
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

    componentDidMount() {
        ipcRenderer.on('trainingStopped', function (e) {
            this.setState(state => {
                state.training = false;
                return state
            })
        }.bind(this));
    }

    render() {
        return (
            <div className="ChooseExport">
                <header className="chooseExport">
                    <Form>
                        <Form.Row className="align-items-center" style={{
                            marginTop: '10px',
                            marginLeft: '5px'
                        }}>
                            <Col xs="auto">
                                <Button
                                    variant="success" type="submit"
                                    onClick={this.chooseConfig}
                                >Choose config</Button>
                            </Col>
                            <Col xs="auto">
                                <Button
                                    variant="success" type="submit"
                                    onClick={this.chooseFolder}
                                >Choose export folder</Button>
                            </Col>
                            <Col xs="auto">
                                <FormControl
                                    placeholder="Prefix"
                                    aria-label="prefix"
                                    onChange={this.handlePrefixChange}
                                    defaultValue={this.state.exportPrefix}
                                />
                            </Col>
                            <Col xs="auto">
                                <Form.Row className="align-items-center" style={{
                                    marginLeft: '5px',
                                    marginTop: '-2px',
                                    marginRight: '3px'
                                }}>
                                    <input
                                        type="radio"
                                        value="onnx"
                                        checked={this.state.exportType === "onnx"}
                                        onChange={(event) => {
                                            event.persist();
                                            this.onRadioChange(event)
                                        }}
                                    />
                                    <span style={{marginLeft: "5px"}}>ONNX</span>
                                </Form.Row>
                                <Form.Row className="align-items-center" style={{
                                    marginLeft: '5px'
                                }}>
                                    <input
                                        type="radio"
                                        value="jit"
                                        checked={this.state.exportType === "jit"}
                                        onChange={(event) => {
                                            event.persist();
                                            this.onRadioChange(event)
                                        }}
                                    />
                                    <span style={{marginLeft: "5px"}}>JIT</span>
                                </Form.Row>
                            </Col>
                            <Col xs="auto">
                                <Button
                                    variant="success"
                                    type="submit"
                                    onClick={this.submitChoice}
                                >Export</Button>
                            </Col>
                        </Form.Row>
                    </Form>
                </header>
            </div>
        );
    }
}

export default ChooseExport;
