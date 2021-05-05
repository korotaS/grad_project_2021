import React, {Component} from 'react';
import {Button, Col, Form, Row} from "react-bootstrap";
import {DatasetLength, LabelArray, Numeric} from "./Common";

const {dialog} = window.require('electron').remote;

class DataSettings extends Component {
    constructor(props) {
        super(props);
        this.state = {
            trainLenNumeric: 1,
            valLenNumeric: 1,
        }

        this.chooseDatasetFolder = this.chooseDatasetFolder.bind(this);
        this.handleLengthCheckbox = this.handleLengthCheckbox.bind(this);
        this.handleLengthNumber = this.handleLengthNumber.bind(this);
    }

    getCurrentDatasetFolder() {
        let folder = this.props.data.common.datasetFolder;
        return folder === "" ? "No selected folder" : folder;
    }

    chooseDatasetFolder(event) {
        event.preventDefault();
        let paths = dialog.showOpenDialogSync({
            properties: ['openDirectory'],
            defaultPath: '.'
        });
        if (paths != null) {
            this.props.setCommonState(this.props.type, 'datasetFolder', paths[0])
        }
    }

    handleLengthCheckbox(event, type) {
        if (type === 'train') {
            this.props.setCommonState(this.props.type, 'trainLen', event.target.checked ? -1 : this.state.trainLenNumeric)
        } else {
            this.props.setCommonState(this.props.type, 'valLen', event.target.checked ? -1 : this.state.valLenNumeric)
        }
    }

    handleLengthNumber(event, type) {
        let {value, min} = event.target;
        value = Math.max(Number(min), Math.min(Infinity, Number(value)));
        if (type === 'train') {
            this.props.setCommonState(this.props.type, 'trainLen', value)
            this.setState(state => {
                state.trainLenNumeric = value
                return state
            })
        } else {
            this.props.setCommonState(this.props.type, 'valLen', value)
            this.setState(state => {
                state.valLenNumeric = value
                return state
            })
        }
    }

    render() {
        if (!this.props.show) {
            return null
        }
        let taskSpecificSettings;
        if (this.props.taskSubClass === 'imclf') {
            taskSpecificSettings = <DataSettingsForImclf
                handleTaskSpecificState={this.props.setTaskSpecificState}
                clearTaskSpecificState={this.props.clearTaskSpecificState}
                defaultState={this.props.data.taskSpecificCache}
                type={this.props.type}/>
        } else if (this.props.taskSubClass === 'imsgm') {
            taskSpecificSettings = <DataSettingsForImsgm
                handleTaskSpecificState={this.props.setTaskSpecificState}
                clearTaskSpecificState={this.props.clearTaskSpecificState}
                defaultState={this.props.data.taskSpecificCache}
                type={this.props.type}/>
        } else {
            taskSpecificSettings = <DataSettingsForTxtclf
                handleTaskSpecificState={this.props.setTaskSpecificState}
                clearTaskSpecificState={this.props.clearTaskSpecificState}
                defaultState={this.props.data.taskSpecificCache}
                type={this.props.type}/>
        }
        return (
            <div align={'center'}>
                <h3>Data</h3>

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
                    len={this.props.data.common.trainLen}
                    type={'train'}
                    lenNumeric={this.state.trainLenNumeric}
                    handleLengthCheckbox={this.handleLengthCheckbox}
                    handleLengthNumber={this.handleLengthNumber}
                />

                <h5>Val dataset length</h5>
                <DatasetLength
                    len={this.props.data.common.valLen}
                    type={'val'}
                    lenNumeric={this.state.valLenNumeric}
                    handleLengthCheckbox={this.handleLengthCheckbox}
                    handleLengthNumber={this.handleLengthNumber}
                />
                {taskSpecificSettings}
            </div>
        )
    }
}

class DataSettingsForImclf extends Component {
    constructor(props) {
        super(props)

        this.state = {
            width: props.defaultState.width || 256,
            height: props.defaultState.height || 256,
            labels: props.defaultState.labels || ['label1', 'label2']
        }

        this.props.clearTaskSpecificState(this.props.type);
        for (const [key, value] of Object.entries(this.state)) {
            this.props.handleTaskSpecificState(this.props.type, key, value)
        }
    }

    render() {
        return (
            <div>
                <h5>Width/Height</h5>
                <Row className="justify-content-md-center">
                    <Col md="auto">
                        <div>Width</div>
                        <Numeric value={this.state.width} nameKey={'width'} type={this.props.type}
                                 passData={this.props.handleTaskSpecificState} max={10000}/>
                    </Col>
                    <Col md="auto">
                        <div>Height</div>
                        <Numeric value={this.state.height} nameKey={'height'} type={this.props.type}
                                 passData={this.props.handleTaskSpecificState} max={10000}/>
                    </Col>
                </Row>

                <h5>Labels</h5>
                <LabelArray labels={this.state.labels} type={this.props.type}
                            passData={this.props.handleTaskSpecificState}/>
            </div>
        )
    }
}

class DataSettingsForImsgm extends Component {
    constructor(props) {
        super(props)

        this.state = {
            width: props.defaultState.width || 256,
            height: props.defaultState.height || 256,
            useRle: props.defaultState.useRle || false,
            numClasses: props.defaultState.numClasses || 1
        }

        this.props.clearTaskSpecificState(this.props.type);
        for (const [key, value] of Object.entries(this.state)) {
            this.props.handleTaskSpecificState(this.props.type, key, value)
        }
    }

    handleRleCheckbox(event) {
        this.props.handleTaskSpecificState(this.props.type, 'useRle', event.target.checked)
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
                        <div>Width</div>
                        <Numeric value={this.state.width} nameKey={'width'} type={this.props.type}
                                 passData={this.props.handleTaskSpecificState} max={10000}/>
                    </Col>
                    <Col md="auto">
                        <div>Height</div>
                        <Numeric value={this.state.height} nameKey={'height'} type={this.props.type}
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
                <Numeric value={this.state.numClasses} nameKey={'numClasses'} type={this.props.type}
                         passData={this.props.handleTaskSpecificState} max={1000}/>
            </div>
        )
    }
}

class DataSettingsForTxtclf extends Component {
    constructor(props) {
        super(props)

        this.state = {
            labels: props.defaultState.labels || ['label1', 'label2'],
            maxItemLen: props.defaultState.maxItemLen || 200,
        }

        this.props.clearTaskSpecificState(this.props.type);
        for (const [key, value] of Object.entries(this.state)) {
            this.props.handleTaskSpecificState(this.props.type, key, value)
        }
    }

    render() {
        return (
            <div>
                <h5>Max item len</h5>
                <Numeric value={this.state.maxItemLen} nameKey={'maxItemLen'} type={this.props.type}
                         passData={this.props.handleTaskSpecificState} max={512}/>

                <h5>Labels</h5>
                <LabelArray labels={this.state.labels} type={this.props.type}
                            passData={this.props.handleTaskSpecificState}/>
            </div>
        )
    }
}

export default DataSettings;