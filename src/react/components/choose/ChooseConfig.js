import React, {Component} from 'react';
import {Button, Form, Col, FormLabel, DropdownButton, Dropdown} from 'react-bootstrap';

const {dialog} = window.require('electron').remote;

const {ipcRenderer} = window.require("electron");

class ChooseConfig extends Component {
    constructor(props) {
        super(props);
        this.state = {
            configPath: '',
            pushed: false,
            training: false,
            tbLaunched: false,
            tbLink: ''
        };

        this.submitChoice = this.submitChoice.bind(this);
        this.chooseDir = this.chooseDir.bind(this);
        this.getCurrentConfigPath = this.getCurrentConfigPath.bind(this);
        this.launchTB = this.launchTB.bind(this)
    }

    submitChoice(event) {
        event.preventDefault();
        if (this.state.configPath === "") {
            alert("Choose config path please!")
        } else {
            this.setState(state => {
                state.pushed = true;
                state.training = true;
                return state
            });
            ipcRenderer.send('configChosen', {
                configPath: this.state.configPath,
            });
        }
    }

    launchTB(key) {
        console.log(key);
        ipcRenderer.send('launchTB', {
            taskTypeForTB: key
        });
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

    stopTraining(event) {
        event.preventDefault();
        ipcRenderer.send('stopTraining');
    }

    getCurrentConfigPath() {
        return this.state.configPath === "" ? "No selected config path" : this.state.configPath;
    }

    componentDidMount() {
        ipcRenderer.on('tbLaunched', function (e, args) {
            if (args.status === 'ok') {
                let tbLink = args.tbLink;
                this.setState(state => {
                    state.tbLink = tbLink;
                    state.tbLaunched = true;
                    return state
                })
            } else if (args.status === 'error') {

            }

        }.bind(this));

        ipcRenderer.on('tbStopped', function (e) {
            this.setState(state => {
                state.tbLaunched = false;
                state.tbLink = '';
                return state
            })
        }.bind(this));

        ipcRenderer.on('trainingStopped', function (e) {
            this.setState(state => {
                state.training = false;
                return state
            })
        }.bind(this));
    }

    render() {
        let trainingSection;
        if (!this.state.training) {
            trainingSection = <InitialState chooseDir={this.chooseDir}
                                            submitChoice={this.submitChoice}
                                            getCurrentConfigPath={this.getCurrentConfigPath}/>
        } else {
            trainingSection = <StopTraining stopTraining={this.stopTraining}/>
        }

        let tbSection;
        if (!this.state.tbLaunched) {
            tbSection = <LaunchTB onSelect={this.launchTB}/>
        } else {
            tbSection = <TBLaunched onClick={this.openTb} tbLink={this.state.tbLink}/>
        }
        return (
            <div className="ChooseConfig">
                <header className="chooseConfig">
                    <Form>
                        {trainingSection}
                        {tbSection}
                    </Form>
                </header>
            </div>
        );
    }
}

function InitialState(props) {
    return (
        <Form.Row className="align-items-center" style={{
            marginTop: '10px',
            marginLeft: '5px'
        }}>
            <Col xs="auto">
                <Button
                    variant="success" type="submit"
                    onClick={props.chooseDir}
                >Choose config</Button>
            </Col>
            <Col xs="auto">
                <Button
                    variant="success"
                    type="submit"
                    onClick={props.submitChoice}
                >Submit</Button>
            </Col>
            <FormLabel>{props.getCurrentConfigPath()}</FormLabel>
        </Form.Row>
    )
}

function StopTraining(props) {
    return (
        <Form.Row className="align-items-center" style={{
            marginTop: '10px',
            marginLeft: '5px'
        }}>
            <Col xs="auto">
                <Button
                    variant="danger"
                    type="submit"
                    onClick={props.stopTraining}
                >Stop training</Button>
            </Col>
        </Form.Row>
    )
}

function LaunchTB(props) {
    return (
        <Form.Row className="align-items-center" style={{
            marginTop: '10px',
            marginLeft: '5px'
        }}>
            <Col xs="auto">
                <DropdownButton title={'Launch TensorBoard'}
                                variant="success"
                                type="submit"
                                onSelect={props.onSelect}
                >
                    <Dropdown.Item eventKey={'imclf'}>Image classification</Dropdown.Item>
                    <Dropdown.Item eventKey={'imsgm'}>Image segmentation</Dropdown.Item>
                    <Dropdown.Item eventKey={'txtclf'}>Text classification</Dropdown.Item>
                </DropdownButton>
            </Col>
        </Form.Row>
    )
}

function TBLaunched(props) {
    let link = <a href={props.tbLink} target={'_blank'}>{props.tbLink}</a>;
    return (
        <Form.Row className="align-items-center" style={{
            marginTop: '10px',
            marginLeft: '5px'
        }}>
            <Col xs="auto">
                <h5>TensorBoard is running on {link}. It will be terminated when the app closes.</h5>
            </Col>
        </Form.Row>

    )
}

export default ChooseConfig;
