import React, {Component} from 'react';
import {Button, Form, Col, FormLabel} from 'react-bootstrap';

const {dialog} = window.require('electron').remote;

const {ipcRenderer} = window.require("electron");

class ChooseConfig extends Component {
    constructor(props) {
        super(props);
        this.state = {
            configPath: '',
            pushed: false,
        };

        this.submitChoice = this.submitChoice.bind(this);
        this.chooseDir = this.chooseDir.bind(this);
        this.getCurrentConfigPath = this.getCurrentConfigPath.bind(this);
    }

    submitChoice(event) {
        event.preventDefault();
        if (this.state.configPath === "") {
            alert("Choose config path please!")
        } else {
            this.setState(state => {
                state.pushed = true;
                return state
            });
            ipcRenderer.send('configChosen', {
                configPath: this.state.configPath,
            });
        }
    }

    chooseDir(event) {
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

    getCurrentConfigPath() {
        return this.state.configPath === "" ? "No selected config path" : this.state.configPath;
    }

    componentDidMount() {

    }

    render() {
        return (
            <div className="ChooseDataset" style={{
                // display: 'flex',
                // justifyContent: 'center',
                // alignItems: 'center',
                // height: '100vh'
            }}>
                <header className="chooseDataset">
                    <Form>
                        <Form.Row className="align-items-center">
                            <Col xs="auto">
                                <Button
                                    variant="success" type="submit"
                                    onClick={this.chooseDir}
                                >Choose config</Button>
                            </Col>
                            <Col xs="auto">
                                <Button
                                    variant="success" type="submit" onClick={this.submitChoice}
                                >Submit</Button>
                            </Col>
                            <FormLabel>{this.getCurrentConfigPath()}</FormLabel>
                        </Form.Row>
                    </Form>
                </header>
            </div>
        );
    }
}

export default ChooseConfig;
