import React, {Component} from 'react';
import {Button, Col, Collapse, Form, FormControl, Row} from "react-bootstrap";
import {DatasetLength} from "../Common";
import {TaskSpecificForImclf, TaskSpecificForImsgm, TaskSpecificForTxtclf} from "./TaskSpecific";
import {AdvancedForImclf, AdvancedForImsgm} from "./Advanced";

const {dialog} = window.require('electron').remote;

class DataSettings extends Component {
    constructor(props) {
        super(props);
        this.state = {
            trainLenNumeric: 1,
            valLenNumeric: 1,

            advancedPushed: false,
            advancedTexts: ['Advanced ▼', 'Advanced ▲']
        }

        this.chooseDatasetFolderLocal = this.chooseDatasetFolderLocal.bind(this);
        this.handleLengthCheckbox = this.handleLengthCheckbox.bind(this);
        this.handleLengthNumber = this.handleLengthNumber.bind(this);
    }

    getCurrentDatasetFolder() {
        let folder = this.props.data.common.datasetFolder;
        return folder === "" ? "No selected folder" : folder;
    }

    chooseDatasetFolderLocal(event) {
        event.preventDefault();
        let paths = dialog.showOpenDialogSync({
            properties: ['openDirectory'],
            defaultPath: '.'
        });
        if (paths != null) {
            this.props.setCommonState(this.props.type, 'datasetFolder', paths[0])
        }
    }

    changeDatasetFolderRemote(event) {
        this.props.setCommonState(this.props.type, 'datasetFolder', event.target.value)
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

    handleAdvanced() {
        this.setState(state => {
            state.advancedPushed = !state.advancedPushed
            return state
        })
    }

    handleShuffleCheckbox(event, mode) {
        function cap(string) {
            return string.charAt(0).toUpperCase() + string.slice(1);
        }

        let key = 'shuffle' + cap(mode)
        this.props.setCommonState(this.props.type, key, event.target.checked)
        this.setState(state => {
            state[key] = event.target.checked
            return state
        })
    }

    static getDerivedStateFromProps(props, state) {
        if (state.advancedPushed && !props.showAdvanced) {
            state.advancedPushed = false
        }
        return state
    }

    render() {
        if (!this.props.showFull) {
            return null
        }
        let taskSpecificSettings;
        if (this.props.taskSubClass === 'imclf') {
            taskSpecificSettings = <TaskSpecificForImclf
                handleTaskSpecificState={this.props.setTaskSpecificState}
                clearTaskSpecificState={this.props.clearTaskSpecificState}
                defaultState={this.props.data.taskSpecificCache}
                type={this.props.type}/>
        } else if (this.props.taskSubClass === 'imsgm') {
            taskSpecificSettings = <TaskSpecificForImsgm
                handleTaskSpecificState={this.props.setTaskSpecificState}
                clearTaskSpecificState={this.props.clearTaskSpecificState}
                defaultState={this.props.data.taskSpecificCache}
                type={this.props.type}/>
        } else {
            taskSpecificSettings = <TaskSpecificForTxtclf
                handleTaskSpecificState={this.props.setTaskSpecificState}
                clearTaskSpecificState={this.props.clearTaskSpecificState}
                defaultState={this.props.data.taskSpecificCache}
                type={this.props.type}/>
        }

        let advancedSettings;
        if (this.props.taskSubClass === 'imclf') {
            advancedSettings = <AdvancedForImclf
                handleTaskSpecificState={this.props.setTaskSpecificState}
                defaultState={this.props.data.taskSpecificCache}
                type={this.props.type}/>
        } else if (this.props.taskSubClass === 'imsgm') {
            advancedSettings = <AdvancedForImsgm
                handleTaskSpecificState={this.props.setTaskSpecificState}
                defaultState={this.props.data.taskSpecificCache}
                type={this.props.type}/>
        } else {
            // nothing advanced and task specific for txtclf
        }
        return (
            <div align={'center'}>
                <div>
                    <h3>Data</h3>
                </div>

                <div>
                    <h5>Dataset folder</h5>
                    {this.props.remote
                        ? <FormControl
                            placeholder="Dataset folder on remote host"
                            onChange={this.changeDatasetFolderRemote.bind(this)}
                            defaultValue={this.props.data.common.datasetFolder}/>
                        : <Button
                            variant="primary" type="submit"
                            onClick={this.chooseDatasetFolderLocal}
                            style={{marginTop: '5px'}}
                        >Choose path</Button>}
                    <div style={{
                        fontSize: 10,
                        color: 'grey',
                        marginBottom: '10px'
                    }}>{this.getCurrentDatasetFolder()}</div>
                    {taskSpecificSettings}
                    <Button style={{marginTop: '10px'}}
                            variant="outline-secondary"
                            onClick={this.handleAdvanced.bind(this)}
                            size={'sm'}
                    >{this.state.advancedTexts[this.state.advancedPushed ? 1 : 0]}</Button>
                    {/*Common advanced*/}
                    <Collapse in={this.state.advancedPushed}>
                        <div>
                            <h5 style={{marginTop: '10px'}}>Train dataset length</h5>
                            <DatasetLength
                                len={this.props.data.common.trainLen}
                                type={'train'}
                                lenNumeric={this.state.trainLenNumeric}
                                handleLengthCheckbox={this.handleLengthCheckbox}
                                handleLengthNumber={this.handleLengthNumber}
                            />

                            <h5 style={{marginTop: '10px'}}>Val dataset length</h5>
                            <DatasetLength
                                len={this.props.data.common.valLen}
                                type={'val'}
                                lenNumeric={this.state.valLenNumeric}
                                handleLengthCheckbox={this.handleLengthCheckbox}
                                handleLengthNumber={this.handleLengthNumber}
                            />

                            <h5 style={{marginTop: '10px', display: 'inline-block'}}>Shuffle</h5>
                            <div className="help-tip">
                                <p>For most cases, you should shuffle train data and not shuffle valid data to keep results consistent.</p>
                            </div>
                            <Row className="justify-content-md-center">
                                <Col md="auto">
                                    <div>Train</div>
                                    <Form.Check
                                        type={'checkbox'}
                                        checked={this.props.data.common.shuffleTrain}
                                        onChange={(event) => {
                                            event.persist();
                                            this.handleShuffleCheckbox(event, 'train')
                                        }}
                                    />
                                </Col>
                                <Col md="auto">
                                    <div>Val</div>
                                    <Form.Check
                                        type={'checkbox'}
                                        checked={this.props.data.common.shuffleVal}
                                        onChange={(event) => {
                                            event.persist();
                                            this.handleShuffleCheckbox(event, 'val')
                                        }}
                                    />
                                </Col>
                            </Row>
                            {/*Task specific advanced*/}
                            {advancedSettings}
                        </div>
                    </Collapse>
                </div>
            </div>
        )
    }
}

export default DataSettings;