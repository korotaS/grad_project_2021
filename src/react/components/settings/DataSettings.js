import React, {Component} from 'react';
import {Button, Col, Form, Row} from "react-bootstrap";

const {dialog} = window.require('electron').remote;

class DataSettings extends Component {
    constructor(props) {
        super(props);
        this.state = {
            commonSettings: {
                datasetFolder: "",
                trainLen: -1,
                valLen: -1,
            },
            taskSpecificSettings: {},
            // additional stuff
            trainLenNumeric: 1,
            valLenNumeric: 1,
            taskSpecificCache: {}
        }

        this.chooseDatasetFolder = this.chooseDatasetFolder.bind(this);
        this.handleLengthCheckbox = this.handleLengthCheckbox.bind(this);
        this.handleLengthNumber = this.handleLengthNumber.bind(this);
        this.handleTaskSpecificState = this.handleTaskSpecificState.bind(this);
        this.clearTaskSpecificState = this.clearTaskSpecificState.bind(this);
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

    clearTaskSpecificState() {
        this.setState(state => {
            state.taskSpecificSettings = {};
            return state
        })
    }

    handleTaskSpecificState(key, value) {
        this.setState(state => {
            state.taskSpecificSettings[key] = value;
            state.taskSpecificCache[key] = value;
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
                clearTaskSpecificState={this.clearTaskSpecificState}
                defaultState={this.state.taskSpecificCache}/>
        } else if (this.props.taskSubClass === 'imsgm') {
            dataSpecificSettings = <DataSettingsForImsgm
                handleTaskSpecificState={this.handleTaskSpecificState}
                clearTaskSpecificState={this.clearTaskSpecificState}
                defaultState={this.state.taskSpecificCache}/>
        } else {
            dataSpecificSettings = <DataSettingsForTxtclf
                handleTaskSpecificState={this.handleTaskSpecificState}
                clearTaskSpecificState={this.clearTaskSpecificState}
                defaultState={this.state.taskSpecificCache}/>
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
                {/*<Button*/}
                {/*    variant="success" type="submit" onClick={() => {*/}
                {/*    console.log(this.state)*/}
                {/*}}*/}
                {/*>Submit</Button>*/}
            </div>
        )
    }
}

function DatasetLength(props) {
    return (
        <Row className="justify-content-md-center">
            <Col md="auto">
                <Form.Check
                    type={'checkbox'} label={'Full length'}
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

class Numeric extends Component {
    constructor(props) {
        super(props)

        this.state = {
            value: props.value || 1
        }

        this.handleChange = this.handleChange.bind(this);
    }

    handleChange(event) {
        let {value, min, max} = event.target;
        value = Math.max(Number(min), Math.min(max, Number(value)));
        this.props.passData(this.props.nameKey, value)
        this.setState(state => {
            state.value = value;
            return state
        })
    }

    render() {
        return (
            <input
                type="number" min={this.props.min || 1} max={this.props.max || Infinity}
                value={this.state.value}
                onChange={(event) => {
                    event.persist();
                    this.handleChange(event)
                }}
            />
        )
    }
}

class LabelArray extends Component {
    constructor(props) {
        super(props)

        this.state = {
            labels: props.labels || ['label1', 'label2']
        }
    }

    handleArrayChange = (event, index) => {
        let labels = [...this.state.labels];
        labels[index] = event.target.value;
        this.props.passData('labels', labels)
        this.setState(state => {
            state.labels = labels;
            return state
        })
    }

    addLabel = (e) => {
        let labels = [...this.state.labels, `label${this.state.labels.length + 1}`]
        this.props.passData('labels', labels)
        this.setState(state => {
            state.labels = labels;
            return state
        })
    }

    removeElement = (e, index) => {
        if (this.state.labels.length > 2) {
            let labels = [...this.state.labels]
            labels.splice(index, 1)
            this.props.passData('labels', labels)
            this.setState(state => {
                state.labels = labels;
                return state
            })
        }
    }

    render() {
        return (
            <div>
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

class DataSettingsForImclf extends DataSettings {
    constructor(props) {
        super(props)

        this.state = {
            width: props.defaultState.width || 256,
            height: props.defaultState.height || 256,
            labels: props.defaultState.labels || ['label1', 'label2']
        }

        this.props.clearTaskSpecificState();
        for (const [key, value] of Object.entries(this.state)) {
            this.props.handleTaskSpecificState(key, value)
        }
    }

    render() {
        return (
            <div>
                <h5>Width/Height</h5>
                <Row className="justify-content-md-center">
                    <Col md="auto">
                        <Numeric value={this.state.width} nameKey={'width'}
                                 passData={this.props.handleTaskSpecificState} max={10000}/>
                    </Col>
                    <Col md="auto">
                        <Numeric value={this.state.height} nameKey={'height'}
                                 passData={this.props.handleTaskSpecificState} max={10000}/>
                    </Col>
                </Row>
                <h5>Labels</h5>
                <LabelArray labels={this.state.labels} passData={this.props.handleTaskSpecificState}/>
            </div>
        )
    }
}

class DataSettingsForImsgm extends DataSettings {
    constructor(props) {
        super(props)

        this.state = {
            width: props.defaultState.width || 256,
            height: props.defaultState.height || 256,
            useRle: props.defaultState.useRle || false,
            numClasses: props.defaultState.numClasses || 1
        }

        this.props.clearTaskSpecificState();
        for (const [key, value] of Object.entries(this.state)) {
            this.props.handleTaskSpecificState(key, value)
        }
    }

    handleRleCheckbox(event) {
        this.props.handleTaskSpecificState('useRle', event.target.checked)
        this.setState(state => {
            state.useRle = event.target.checked
            return state
        })
    }

    render() {
        return (
            <div>
                <h5>Width/Height</h5>
                <Row className="justify-content-md-center">
                    <Col md="auto">
                        <Numeric value={this.state.width} nameKey={'width'}
                                 passData={this.props.handleTaskSpecificState} max={10000}/>
                    </Col>
                    <Col md="auto">
                        <Numeric value={this.state.height} nameKey={'height'}
                                 passData={this.props.handleTaskSpecificState} max={10000}/>
                    </Col>
                </Row>
                <h5>Use RLE</h5>
                <Form.Check
                    type={'checkbox'} label={'Use RLE'} checked={this.state.useRle}
                    onChange={(event) => {
                        event.persist();
                        this.handleRleCheckbox(event)
                    }}
                />
                <h5>Number of classes</h5>
                <Numeric value={this.state.numClasses} nameKey={'numClasses'}
                         passData={this.props.handleTaskSpecificState} max={1000}/>
            </div>
        )
    }
}

class DataSettingsForTxtclf extends DataSettings {
    constructor(props) {
        super(props)

        this.state = {
            labels: props.defaultState.labels || ['label1', 'label2'],
            maxItemLen: props.defaultState.maxItemLen || 200,
            lang: props.defaultState.lang || 'en'
        }

        this.props.clearTaskSpecificState();
        for (const [key, value] of Object.entries(this.state)) {
            this.props.handleTaskSpecificState(key, value)
        }
    }

    handleLangCheckbox(event) {
        this.props.handleTaskSpecificState('lang', event.target.value)
        this.setState(state => {
            state.lang = event.target.value
            return state
        })
    }

    render() {
        return (
            <div>
                <h5>Max item len</h5>
                <Numeric value={this.state.maxItemLen} nameKey={'maxItemLen'}
                         passData={this.props.handleTaskSpecificState} max={512}/>
                <h5>Labels</h5>
                <LabelArray labels={this.state.labels} passData={this.props.handleTaskSpecificState}/>
                <h5>Language</h5>
                <Row className="justify-content-md-center">
                    <Col md="auto">
                        <Form.Check
                            type={'checkbox'} label={'Russian'} value={'ru'} checked={this.state.lang === 'ru'}
                            onChange={(event) => {
                                event.persist();
                                this.handleLangCheckbox(event)
                            }}
                        />
                    </Col>
                    <Col md="auto">
                        <Form.Check
                            type={'checkbox'} label={'English'} value={'en'} checked={this.state.lang === 'en'}
                            onChange={(event) => {
                                event.persist();
                                this.handleLangCheckbox(event)
                            }}
                        />
                    </Col>
                </Row>
            </div>
        )
    }
}

export default DataSettings;