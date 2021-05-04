import React, {Component} from 'react';
import {Button, Col, Form, Row} from "react-bootstrap";

const {dialog} = window.require('electron').remote;

class DataSettings extends Component {
    constructor(props) {
        super(props);
        this.state = {
            trainLenNumeric: 1,
            valLenNumeric: 1,
            commonSettings: {
                datasetFolder: "",
                trainLen: -1,
                valLen: -1,
            },
            taskSpecificSettings: {}
        }

        this.chooseDatasetFolder = this.chooseDatasetFolder.bind(this);
        this.handleLengthCheckbox = this.handleLengthCheckbox.bind(this);
        this.handleLengthNumber = this.handleLengthNumber.bind(this);
        this.handleTaskSpecificState = this.handleTaskSpecificState.bind(this);
    }

    getCurrentDatasetFolder() {
        let folder = this.state.commonSettings.datasetFolder;
        return folder === "" ? "No selected folder" : folder;
    }

    chooseDatasetFolder(event) {
        event.preventDefault();
        let paths = dialog.showOpenDialogSync({
            properties: ['openDirectory'],
            defaultPath: '.'
        });
        if (paths != null) {
            this.setState(state => {
                state.commonSettings.datasetFolder = paths[0];
                return state
            })
        }
    }

    handleLengthCheckbox(event, type) {
        if (type === 'train') {
            this.setState(state => {
                state.commonSettings.trainLen = event.target.checked ? -1 : this.state.trainLenNumeric
                return state
            })
        } else {
            this.setState(state => {
                state.commonSettings.valLen = event.target.checked ? -1 : this.state.valLenNumeric
                return state
            })
        }
    }

    handleLengthNumber(event, type) {
        let {value, min} = event.target;
        value = Math.max(Number(min), Math.min(Infinity, Number(value)));
        if (type === 'train') {
            this.setState(state => {
                state.commonSettings.trainLen = value;
                state.trainLenNumeric = value
                return state
            })
        } else {
            this.setState(state => {
                state.commonSettings.valLen = value;
                state.valLenNumeric = value
                return state
            })
        }
    }

    // setStateFromChild(taskSpecificSettings) {
    //     this.setState(state => {
    //         state.taskSpecificSettings = taskSpecificSettings;
    //         return state
    //     })
    // }

    handleTaskSpecificState(key, value) {
        this.setState(state => {
            state.taskSpecificSettings[key] = value;
            return state
        })
    }

    render() {
        if (!this.props.show) {
            return null
        }
        let dataSpecificSettings;
        if (this.props.taskSubClass === 'imclf') {
            dataSpecificSettings = <DataSettingsForImclf
                handleTaskSpecificState={this.handleTaskSpecificState}
                defaultState={this.state.taskSpecificSettings}/>
        } else if (this.props.taskSubClass === 'imsgm') {
            dataSpecificSettings = <DataSettingsForImsgm
                handleTaskSpecificState={this.handleTaskSpecificState}
                defaultState={this.state.taskSpecificSettings}/>
        } else {
            dataSpecificSettings = <DataSettingsForTxtclf
                handleTaskSpecificState={this.handleTaskSpecificState}
                defaultState={this.state.taskSpecificSettings}/>
        }
        return (
            <div align={'center'}>
                <h5>Dataset folder</h5>
                <div>
                    <Button
                        variant="success"
                        type="submit"
                        onClick={this.chooseDatasetFolder}
                        size={'sm'}
                    >choose path</Button>
                </div>
                <div style={{fontSize: 10}}>{this.getCurrentDatasetFolder()}</div>
                <h5>Train dataset length</h5>
                <DatasetLength
                    len={this.state.commonSettings.trainLen}
                    type={'train'}
                    lenNumeric={this.state.trainLenNumeric}
                    handleLengthCheckbox={this.handleLengthCheckbox}
                    handleLengthNumber={this.handleLengthNumber}
                />
                <h5>Val dataset length</h5>
                <DatasetLength
                    len={this.state.commonSettings.valLen}
                    type={'val'}
                    lenNumeric={this.state.valLenNumeric}
                    handleLengthCheckbox={this.handleLengthCheckbox}
                    handleLengthNumber={this.handleLengthNumber}
                />
                {dataSpecificSettings}
                <Button
                    variant="success" type="submit" onClick={() => {
                    console.log(this.state)
                }}
                >Submit</Button>
            </div>
        )
    }
}

function DatasetLength(props) {
    return (
        <Row className="justify-content-md-center">
            <Col md="auto">
                <Form.Check
                    type={'checkbox'} label={'Full length'} value={'trainLenFull'}
                    checked={props.len === -1}
                    onChange={(event) => {
                        event.persist();
                        props.handleLengthCheckbox(event, props.type)
                    }}
                />
            </Col>
            <Col md="auto">
                <input
                    type="number" min={1}
                    value={props.lenNumeric}
                    onChange={(event) => {
                        event.persist();
                        props.handleLengthNumber(event, props.type)
                    }}
                    disabled={props.len === -1}
                />
            </Col>
        </Row>
    )
}

class DataSettingsForImclf extends DataSettings {
    constructor(props) {
        super(props)

        this.state = {
            width: props.defaultState.width || 256,
            height: props.defaultState.height || 256,
            labels: props.defaultState.labels || ['label1', 'label2']
        }

        this.props.handleTaskSpecificState('width', this.state.width)
        this.props.handleTaskSpecificState('height', this.state.height)
        this.props.handleTaskSpecificState('labels', this.state.labels)

        this.handleWidth = this.handleWidth.bind(this);
        this.handleHeight = this.handleHeight.bind(this);
    }

    handleWidth(event) {
        let {value, min, max} = event.target;
        value = Math.max(Number(min), Math.min(max, Number(value)));
        this.props.handleTaskSpecificState('width', value)
        this.setState(state => {
            state.width = value;
            return state
        })
    }

    handleHeight(event) {
        let {value, min, max} = event.target;
        value = Math.max(Number(min), Math.min(max, Number(value)));
        this.props.handleTaskSpecificState('height', value)
        this.setState(state => {
            state.height = value;
            return state
        })
    }

    handleArrayChange = (event, index) => {
        let labels = [...this.state.labels];
        labels[index] = event.target.value;
        this.props.handleTaskSpecificState('labels', labels)
        this.setState(state => {
            state.labels = labels;
            return state
        })
    }

    addLabel = (e) => {
        let labels = [...this.state.labels, 'label']
        this.props.handleTaskSpecificState('labels', labels)
        this.setState(state => {
            state.labels = labels;
            return state
        })
    }

    removeElement = (e, index) => {
        if (this.state.labels.length > 2) {
            let labels = [...this.state.labels]
            labels.splice(index, 1)
            this.props.handleTaskSpecificState('labels', labels)
            this.setState(state => {
                state.labels = labels;
                return state
            })
        }
    }

    render() {
        return (
            <div>
                <h5>Width/Height</h5>
                <Row className="justify-content-md-center">
                    <Col md="auto">
                        <input
                            type="number" min={1} max={10000}
                            value={this.state.width || 256}
                            onChange={(event) => {
                                event.persist();
                                this.handleWidth(event)
                            }}
                        />
                    </Col>
                    <Col md="auto">
                        <input
                            type="number" min={1} max={10000}
                            value={this.state.height || 256}
                            onChange={(event) => {
                                event.persist();
                                this.handleHeight(event)
                            }}
                        />
                    </Col>
                </Row>
                <h5>Labels</h5>
                <ul>
                    {this.state.labels.map((obj, index) => {
                        return (
                            <li key={index}>
                                name:<input
                                type="text"
                                value={obj}
                                onChange={(e) => this.handleArrayChange(e, index)}/>
                                <Button size={'sm'}
                                        onClick={(e) => this.removeElement(e, index)}
                                >Delete
                                </Button>
                            </li>
                        )
                    })}
                </ul>
                <Button size={'sm'} onClick={this.addLabel}>Add label</Button>
            </div>
        )
    }
}

class DataSettingsForImsgm extends DataSettings {
    render() {
        return (
            <div>DATA IMSGM</div>
        )
    }
}

class DataSettingsForTxtclf extends DataSettings {
    render() {
        return (
            <div>DATA TXTCLF</div>
        )
    }
}

export default DataSettings;