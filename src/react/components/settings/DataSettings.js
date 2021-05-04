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
            taskSpecificSettings: {},

        }

        this.chooseDatasetFolder = this.chooseDatasetFolder.bind(this);
        this.handleLengthCheckbox = this.handleLengthCheckbox.bind(this);
        this.handleLengthNumber = this.handleLengthNumber.bind(this);

        this.trainLenRef = React.createRef();
        this.valLenRef = React.createRef();
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
                state.commonSettings.trainLen = event.target.checked ? -1 : this.trainLenRef.current.value
                return state
            })
        } else {
            this.setState(state => {
                state.commonSettings.valLen = event.target.checked ? -1 : this.valLenRef.current.value
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

    render() {
        if (!this.props.show) {
            return null
        }
        let dataSpecificSettings;
        if (this.props.taskSubClass === 'imclf') {
            dataSpecificSettings = <DataSettingsForImclf/>
        } else if (this.props.taskSubClass === 'imsgm') {
            dataSpecificSettings = <DataSettingsForImsgm/>
        } else {
            dataSpecificSettings = <DataSettingsForTxtclf/>
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
                    lenRef={this.trainLenRef}
                    lenNumeric={this.state.trainLenNumeric}
                    handleLengthCheckbox={this.handleLengthCheckbox}
                    handleLengthNumber={this.handleLengthNumber}
                />
                <h5>Val dataset length</h5>
                <DatasetLength
                    len={this.state.commonSettings.valLen}
                    type={'val'}
                    lenRef={this.valLenRef}
                    lenNumeric={this.state.valLenNumeric}
                    handleLengthCheckbox={this.handleLengthCheckbox}
                    handleLengthNumber={this.handleLengthNumber}
                />
                {dataSpecificSettings}
                {/*<Button*/}
                {/*    variant="success" type="submit" onClick={() => {console.log(this.state)}}*/}
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
                    type="number" min={1} ref={props.lenRef}
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
    render() {
        return (
            <div>DATA IMCLF</div>
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