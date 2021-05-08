import React, {Component} from 'react';
import {Button, Col, Form, Row} from "react-bootstrap";
import {Numeric} from "../Common";
import {TrainingSettingsForImclf, TrainingSettingsForImsgm, TrainingSettingsForTxtclf} from "./TaskSpecific";

class TrainingSettings extends Component {
    constructor(props) {
        super(props);
        this.state = {
            optimizers: ['Adam', 'SGD', 'RMSprop', 'Adadelta', 'Adagrad', 'AdamW',
                'SparseAdam', 'Adamax', 'ASGD', 'LBFGS', 'Rprop'],
            advancedPushed: false,
            advancedTexts: ['Advanced ▼', 'Advanced ▲']
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

    render() {
        if (!this.props.show) {
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
                <Button style={{marginTop: '10px'}} variant="outline-secondary"
                        onClick={this.handleAdvanced.bind(this)} size={'sm'}
                >{this.state.advancedTexts[this.state.advancedPushed ? 1 : 0]}</Button>
                {/*Common advanced*/}
                <div hidden={!this.state.advancedPushed}>
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
                    <div>Maybe params...</div>

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
            </div>
        )
    }
}

export default TrainingSettings;