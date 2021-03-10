import React, {Component} from 'react';
import {Button, Form, Col, FormLabel} from 'react-bootstrap';

const {dialog} = window.require('electron').remote;

const {ipcRenderer} = window.require("electron");

class ChooseDataset extends Component {
    constructor(props) {
        super(props);
        this.state = {
            taskClass: props.taskClass,
            taskSubClass: props.taskSubClass,
            projectName: props.projectName,
            datasetFolder: '',
            pushed: false,
        };

        this.submitChoice = this.submitChoice.bind(this);
        this.chooseDir = this.chooseDir.bind(this);
        this.getCurrentDatasetFolder = this.getCurrentDatasetFolder.bind(this);
    }

    static getDerivedStateFromProps(props, state) {
        if (props.taskClass !== state.taskClass || props.taskSubClass !== state.taskSubClass) {
            return {
                taskClass: props.taskClass,
                taskSubClass: props.taskClass,
                projectName: props.projectName,
                pushed: false,
                datasetFolder: ''
            }
        }
        return state
    }

    submitChoice(event) {
        event.preventDefault();
        if (this.state.datasetFolder === "") {
            alert("Choose dataset folder please!")
        } else {
            this.setState(state => {
                state.pushed = true;
                return state
            });
            ipcRenderer.send('submitChoice3', {
                taskClass: this.state.taskClass,
                taskSubClass: this.state.taskSubClass,
                datasetFolder: this.state.datasetFolder,
                projectName: this.state.projectName,
            });
        }
    }

    chooseDir(event) {
        event.preventDefault();
        let paths = dialog.showOpenDialogSync({
            properties: ['openDirectory'],
            defaultPath: '.'
        });
        if (paths != null) {
            this.setState(state => {
                state.datasetFolder = paths[0];
                return state
            })
        }
    }

    getCurrentDatasetFolder() {
        return this.state.datasetFolder === "" ? "No selected folder" : this.state.datasetFolder;
    }

    componentDidMount() {

    }

    render() {
        return (
            <div className="ChooseDataset">
                <header className="chooseDataset">
                    <Form>
                        <Form.Row className="align-items-center">
                            <Col xs="auto">
                                <Button
                                    variant="success" type="submit"
                                    onClick={this.chooseDir}
                                >choose path</Button>
                            </Col>
                            <Col xs="auto">
                                <Button
                                    variant="success" type="submit" onClick={this.submitChoice}
                                >Submit</Button>
                            </Col>
                            <FormLabel>{this.getCurrentDatasetFolder()}</FormLabel>
                        </Form.Row>
                    </Form>
                </header>
            </div>
        );
    }
}

export default ChooseDataset;
