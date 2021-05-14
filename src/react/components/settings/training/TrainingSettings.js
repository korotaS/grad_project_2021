import React, {Component} from 'react';
import {Button, Col, Collapse, Form, Row} from "react-bootstrap";
import {Numeric} from "../Common";
import {TrainingSettingsForImclf, TrainingSettingsForImsgm, TrainingSettingsForTxtclf} from "./TaskSpecific";
import Editor from 'react-simple-code-editor';
import {highlight, languages} from 'prismjs/components/prism-core';
import 'prismjs/components/prism-yaml';
import "prismjs/themes/prism-coy.css";

const yaml = require('js-yaml');

class TrainingSettings extends Component {
    constructor(props) {
        super(props);
        this.state = {
            optimizers: ['Adam', 'SGD', 'RMSprop', 'Adadelta', 'Adagrad', 'AdamW',
                'SparseAdam', 'Adamax', 'ASGD', 'LBFGS', 'Rprop'],
            advancedPushed: false,
            advancedTexts: ['Advanced ▼', 'Advanced ▲'],

            noParams: true,
            params: 'param1: 42',
            paramsValid: true
        }

        this.handleBatchSize = this.handleBatchSize.bind(this);
        this.handleOptNameChange = this.handleOptNameChange.bind(this);
    }

    getGpuRange() {
        if (this.props.numGpus !== -1) {
            return [...Array(this.props.numGpus).keys()].map((x) => x.toString())
        }
        return []
    }

    getBatchSizeRange() {
        return [...Array(12).keys()].map((x) => {
            return Math.pow(2, x)
        })
    }

    handleGpuChange(event) {
        let value = event.target.value;
        this.props.setCommonState(this.props.type, 'gpus', value === 'cpu' ? null : value)
    }

    handleBatchSize(event, type) {
        let value = event.target.value
        if (type === 'train') {
            this.props.setCommonState(this.props.type, 'batchSizeTrain', parseInt(value))
        } else {
            this.props.setCommonState(this.props.type, 'batchSizeVal', parseInt(value))
        }
    }

    handleOptNameChange(event) {
        let value = event.target.value;
        this.props.setCommonState(this.props.type, 'optimizer.name', value)
    }

    handleLrChange(event) {
        let {value, min, max} = event.target;
        value = Math.max(Number(min), Math.min(max, Number(value)));
        this.props.setCommonState(this.props.type, 'optimizer.params.lr', value)
    }

    handleAdvanced() {
        this.setState(state => {
            state.advancedPushed = !state.advancedPushed
            return state
        })
    }

    handleCheckMonitorChange(event) {
        let monitor = event.target.value
        let mode = monitor === 'val_loss' ? 'min' : 'max'
        this.props.setCommonState(this.props.type, 'checkpointCallback.monitor', monitor)
        this.props.setCommonState(this.props.type, 'checkpointCallback.mode', mode)
    }

    handleNoParamsCheckbox(event) {
        let paramsConfig = {}
        try {
            paramsConfig = yaml.load(this.state.params)
        } catch {
        }
        this.props.setCommonState(this.props.type, 'optimizer.paramsAdd', event.target.checked ? {} : paramsConfig)
        this.setState(state => {
            state.noParams = event.target.checked
            return state
        })
    }

    handleParams(value) {
        let paramsConfig = {}
        try {
            paramsConfig = yaml.load(value)
            this.setState(state => {
                state.paramsValid = true
                return state
            })
        } catch (e) {
            this.setState(state => {
                state.paramsValid = false
                return state
            })
        }
        this.props.setCommonState(this.props.type, 'optimizer.paramsAdd', paramsConfig)
        this.setState(state => {
            state.params = value
            return state
        })
    }

    render() {
        if (!this.props.showFull) {
            return null
        }
        let taskSpecificSettings;
        if (this.props.taskSubClass === 'imclf') {
            taskSpecificSettings = <TrainingSettingsForImclf handleTaskSpecificState={this.props.setTaskSpecificState}
                                                             clearTaskSpecificState={this.props.clearTaskSpecificState}
                                                             defaultState={this.props.data.taskSpecificCache}
                                                             type={this.props.type}/>
        } else if (this.props.taskSubClass === 'imsgm') {
            taskSpecificSettings = <TrainingSettingsForImsgm handleTaskSpecificState={this.props.setTaskSpecificState}
                                                             clearTaskSpecificState={this.props.clearTaskSpecificState}
                                                             defaultState={this.props.data.taskSpecificCache}
                                                             type={this.props.type}/>
        } else {
            taskSpecificSettings = <TrainingSettingsForTxtclf handleTaskSpecificState={this.props.setTaskSpecificState}
                                                              clearTaskSpecificState={this.props.clearTaskSpecificState}
                                                              defaultState={this.props.data.taskSpecificCache}
                                                              type={this.props.type}/>
        }
        return (
            <div align={'center'}>
                <h3>Training</h3>

                <div hidden={!this.props.showContent}>
                    <h5>Device</h5>
                    <Form.Control as="select" custom style={{width: '50%'}}
                                  onChange={this.handleGpuChange.bind(this)}>
                        {['cpu'].concat(this.getGpuRange()).map((obj, index) => {
                            return (
                                <option key={index} value={obj}>{obj}</option>
                            )
                        })}
                    </Form.Control>

                    <h5>Max epochs</h5>
                    <Numeric value={this.props.data.common.maxEpochs} nameKey={'maxEpochs'} type={this.props.type}
                             passData={this.props.setCommonState}/>

                    <h5>Batch size</h5>
                    <Row className="justify-content-md-center">
                        <Col md="auto">
                            <div>Train</div>
                            <Form.Control as="select" custom defaultValue={8}
                                          onChange={(event) => {
                                              this.handleBatchSize(event, 'train')
                                          }}>
                                {this.getBatchSizeRange().map((obj, index) => {
                                    return (
                                        <option key={index} value={obj}>{obj}</option>
                                    )
                                })}
                            </Form.Control>
                        </Col>
                        <Col md="auto">
                            <div>Val</div>
                            <Form.Control as="select" custom defaultValue={8}
                                          onChange={(event) => {
                                              this.handleBatchSize(event, 'val')
                                          }}>
                                {this.getBatchSizeRange().map((obj, index) => {
                                    return (
                                        <option key={index} value={obj}>{obj}</option>
                                    )
                                })}
                            </Form.Control>
                        </Col>
                    </Row>

                    <h5>Workers</h5>
                    <Numeric value={this.props.data.common.workers} nameKey={'workers'} type={this.props.type}
                             passData={this.props.setCommonState} min={0}/>

                    <h5>Learning rate</h5>
                    <input
                        type="number" min={0} max={Infinity} step={0.1}
                        value={this.props.data.common.optimizer.params.lr}
                        onChange={(event) => {
                            event.persist();
                            this.handleLrChange(event)
                        }}
                        style={{width: '50%'}}
                    />
                    {taskSpecificSettings}
                    <Button style={{marginTop: '10px', marginBottom: '5px'}} variant="outline-secondary"
                            onClick={this.handleAdvanced.bind(this)} size={'sm'}
                    >{this.state.advancedTexts[this.state.advancedPushed ? 1 : 0]}</Button>
                    {/*Common advanced*/}
                    <Collapse in={this.state.advancedPushed}>
                        <div>
                            <h5>Optimizer</h5>
                            <div>Name</div>
                            <Form.Control as="select" custom style={{width: '50%'}}
                                          onChange={(event) => {
                                              this.handleOptNameChange(event)
                                          }}>
                                {this.state.optimizers.map((obj, index) => {
                                    return (
                                        <option key={index} value={obj}>{obj}</option>
                                    )
                                })}
                            </Form.Control>
                            <div>Params</div>
                            <Form.Check
                                label={'no params'} type={'checkbox'} checked={this.state.noParams}
                                onChange={(event) => {
                                    event.persist();
                                    this.handleNoParamsCheckbox(event)
                                }}
                            />
                            <div hidden={this.state.paramsValid}>Please enter the valid YAML.</div>
                            <div className="container_editor_area">
                                <Editor
                                    disabled={this.state.noParams}
                                    value={this.state.params}
                                    onValueChange={this.handleParams.bind(this)}
                                    highlight={code => highlight(code, languages.yaml, 'yaml')}
                                    padding={10}
                                    onClick={() => {
                                    }}
                                    style={{
                                        fontSize: 15,
                                        width: '50%',
                                    }}
                                />
                            </div>

                            <h5>Checkpoint</h5>
                            <div>Monitor</div>
                            <Row className="justify-content-md-center">
                                <Col xs="auto">
                                    <Form.Check
                                        type={'radio'} label={'Loss'} value={'val_loss'}
                                        checked={this.props.data.common.checkpointCallback.monitor === 'val_loss'}
                                        onChange={(event) => {
                                            event.persist();
                                            this.handleCheckMonitorChange(event)
                                        }}/>
                                </Col>
                                <Col xs="auto">
                                    <Form.Check
                                        type={'radio'} label={this.props.taskSubClass === 'imsgm' ? 'IOU' : 'Accuracy'}
                                        value={this.props.taskSubClass === 'imsgm' ? 'val_iou' : 'val_acc'}
                                        checked={this.props.data.common.checkpointCallback.monitor !== 'val_loss'}
                                        onChange={(event) => {
                                            event.persist();
                                            this.handleCheckMonitorChange(event)
                                        }}/>
                                </Col>
                            </Row>
                            <div>Save top K</div>
                            <Numeric value={this.props.data.common.checkpointCallback.save_top_k}
                                     nameKey={'checkpointCallback.save_top_k'}
                                     type={this.props.type}
                                     passData={this.props.setCommonState} max={100}/>
                        </div>
                    </Collapse>
                </div>
            </div>
        )
    }
}

export default TrainingSettings;