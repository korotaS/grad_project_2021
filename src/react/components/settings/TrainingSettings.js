import React, {Component} from 'react';
import {Button, Col, Form, Row} from "react-bootstrap";
import {Numeric} from "./Common";

class TrainingSettings extends Component {
    constructor(props) {
        super(props);
        this.state = {
            commonSettings: {
                gpus: null,
                maxEpochs: 100,
                batchSizeTrain: 8,
                batchSizeVal: 8,
                workers: 0,
                optimizer: {
                    name: 'Adam',
                    params: {
                        lr: 0.001
                    }
                }
            },
            taskSpecificSettings: {},
            // additional stuff
            taskSpecificCache: {},
            optimizers: ['Adam', 'SGD', 'RMSprop', 'Adadelta', 'Adagrad', 'AdamW',
                'SparseAdam', 'Adamax', 'ASGD', 'LBFGS', 'Rprop']
        }

        this.handleCommonState = this.handleCommonState.bind(this);
        this.handleBatchSize = this.handleBatchSize.bind(this);
        this.handleOptNameChange = this.handleOptNameChange.bind(this);
        this.handleTaskSpecificState = this.handleTaskSpecificState.bind(this);
        this.clearTaskSpecificState = this.clearTaskSpecificState.bind(this);
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
        this.setState(state => {
            state.commonSettings.gpus = value === 'cpu' ? null : value
            return state
        })
    }

    handleCommonState(key, value) {
        this.setState(state => {
            state.commonSettings[key] = value;
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

    clearTaskSpecificState() {
        this.setState(state => {
            state.taskSpecificSettings = {};
            return state
        })
    }

    handleBatchSize(event, type) {
        let value = event.target.value
        if (type === 'train') {
            this.setState(state => {
                state.commonSettings.batchSizeTrain = parseInt(value)
                return state
            })
        } else {
            this.setState(state => {
                state.commonSettings.batchSizeVal = parseInt(value)
                return state
            })
        }
    }

    handleOptNameChange(event) {
        let value = event.target.value;
        this.setState(state => {
            state.commonSettings.optimizer.name = value
            return state
        })
    }

    handleLrChange(event) {
        let {value, min, max} = event.target;
        value = Math.max(Number(min), Math.min(max, Number(value)));
        this.setState(state => {
            state.commonSettings.optimizer.params.lr = value;
            return state
        })
    }

    render() {
        if (!this.props.show) {
            return null
        }
        let taskSpecificSettings;
        if (this.props.taskSubClass === 'imclf') {
            taskSpecificSettings = <TrainingSettingsForImclf
                handleTaskSpecificState={this.handleTaskSpecificState}
                clearTaskSpecificState={this.clearTaskSpecificState}
                defaultState={this.state.taskSpecificCache}/>
        } else if (this.props.taskSubClass === 'imsgm') {
            taskSpecificSettings = <TrainingSettingsForImsgm
                handleTaskSpecificState={this.handleTaskSpecificState}
                clearTaskSpecificState={this.clearTaskSpecificState}
                defaultState={this.state.taskSpecificCache}/>
        } else {
            taskSpecificSettings = <TrainingSettingsForTxtclf
                handleTaskSpecificState={this.handleTaskSpecificState}
                clearTaskSpecificState={this.clearTaskSpecificState}
                defaultState={this.state.taskSpecificCache}/>
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
                <Numeric value={this.state.commonSettings.maxEpochs} nameKey={'maxEpochs'}
                         passData={this.handleCommonState}/>

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
                <Numeric value={this.state.commonSettings.workers} nameKey={'workers'}
                         passData={this.handleCommonState} min={0}/>

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
                <div>Learning rate</div>
                <input
                    type="number" min={0} max={Infinity} step={0.1}
                    value={this.state.commonSettings.optimizer.params.lr}
                    onChange={(event) => {
                        event.persist();
                        this.handleLrChange(event)
                    }}
                    style={{width: '50%'}}
                />
                {taskSpecificSettings}
                <Button
                    variant="success" type="submit" style={{marginTop: '10px'}} onClick={() => {
                    console.log(this.state)
                }}
                >Submit</Button>
            </div>
        )
    }
}

class TrainingSettingsForImclf extends TrainingSettings {
    constructor(props) {
        super(props)

        this.state = {
            criterions: ['CrossEntropyLoss', 'BCELoss', 'BCEWithLogitsLoss', 'CTCLoss', 'MSELoss'],

            criterion: props.criterion || 'CrossEntropyLoss',
        }

        this.props.clearTaskSpecificState();
        for (const [key, value] of Object.entries(this.state)) {
            if (key !== 'criterions') {
                this.props.handleTaskSpecificState(key, value)
            }
        }

        this.handleLossChange = this.handleLossChange.bind(this);
    }

    handleLossChange(event) {
        let value = event.target.value;
        this.props.handleTaskSpecificState('criterion', value)
        this.setState(state => {
            state.criterion = value
            return state
        })
    }

    render() {
        return (
            <div>
                <h5>Loss</h5>
                <Form.Control as="select" custom style={{width: '50%'}}
                              onChange={(event) => {
                                  this.handleLossChange(event)
                              }}>
                    {this.state.criterions.map((obj, index) => {
                        return (
                            <option key={index} value={obj}>{obj}</option>
                        )
                    })}
                </Form.Control>
            </div>
        )
    }
}

class TrainingSettingsForImsgm extends TrainingSettings {
        constructor(props) {
        super(props)

        this.state = {
            criterions: ['JaccardLoss', 'DiceLoss', 'FocalLoss', 'LovaszLoss',
                'SoftBCEWithLogitsLoss', 'SoftCrossEntropyLoss'],

            criterion: props.criterion || 'CrossEntropyLoss',
        }

        this.props.clearTaskSpecificState();
        for (const [key, value] of Object.entries(this.state)) {
            if (key !== 'criterions') {
                this.props.handleTaskSpecificState(key, value)
            }
        }

        this.handleLossChange = this.handleLossChange.bind(this);
    }

    handleLossChange(event) {
        let value = event.target.value;
        this.props.handleTaskSpecificState('criterion', value)
        this.setState(state => {
            state.criterion = value
            return state
        })
    }

    render() {
        return (
            <div>
                <h5>Loss</h5>
                <Form.Control as="select" custom style={{width: '50%'}}
                              onChange={(event) => {
                                  this.handleLossChange(event)
                              }}>
                    {this.state.criterions.map((obj, index) => {
                        return (
                            <option key={index} value={obj}>{obj}</option>
                        )
                    })}
                </Form.Control>
            </div>
        )
    }
}

class TrainingSettingsForTxtclf extends TrainingSettings {
        constructor(props) {
        super(props)

        this.state = {
            criterions: ['CrossEntropyLoss', 'BCELoss', 'BCEWithLogitsLoss', 'CTCLoss', 'MSELoss'],

            criterion: props.criterion || 'CrossEntropyLoss',
        }

        this.props.clearTaskSpecificState();
        for (const [key, value] of Object.entries(this.state)) {
            if (key !== 'criterions') {
                this.props.handleTaskSpecificState(key, value)
            }
        }

        this.handleLossChange = this.handleLossChange.bind(this);
    }

    handleLossChange(event) {
        let value = event.target.value;
        this.props.handleTaskSpecificState('criterion', value)
        this.setState(state => {
            state.criterion = value
            return state
        })
    }

    render() {
        return (
            <div>
                <h5>Loss</h5>
                <Form.Control as="select" custom style={{width: '50%'}}
                              onChange={(event) => {
                                  this.handleLossChange(event)
                              }}>
                    {this.state.criterions.map((obj, index) => {
                        return (
                            <option key={index} value={obj}>{obj}</option>
                        )
                    })}
                </Form.Control>
            </div>
        )
    }
}

export default TrainingSettings;