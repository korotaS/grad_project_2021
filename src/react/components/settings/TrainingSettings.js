import React, {Component} from 'react';
import {Col, Form, Row} from "react-bootstrap";
import {Numeric} from "./Common";

class TrainingSettings extends Component {
    constructor(props) {
        super(props);
        this.state = {
            optimizers: ['Adam', 'SGD', 'RMSprop', 'Adadelta', 'Adagrad', 'AdamW',
                'SparseAdam', 'Adamax', 'ASGD', 'LBFGS', 'Rprop']
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

    render() {
        if (!this.props.show) {
            return null
        }
        let taskSpecificSettings;
        if (this.props.taskSubClass === 'imclf') {
            taskSpecificSettings = <TrainingSettingsForImclf
                handleTaskSpecificState={this.props.setTaskSpecificState}
                clearTaskSpecificState={this.props.clearTaskSpecificState}
                defaultState={this.props.data.taskSpecificCache}
                type={this.props.type}/>
        } else if (this.props.taskSubClass === 'imsgm') {
            taskSpecificSettings = <TrainingSettingsForImsgm
                handleTaskSpecificState={this.props.setTaskSpecificState}
                clearTaskSpecificState={this.props.clearTaskSpecificState}
                defaultState={this.props.data.taskSpecificCache}
                type={this.props.type}/>
        } else {
            taskSpecificSettings = <TrainingSettingsForTxtclf
                handleTaskSpecificState={this.props.setTaskSpecificState}
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
                    value={this.props.data.common.optimizer.params.lr}
                    onChange={(event) => {
                        event.persist();
                        this.handleLrChange(event)
                    }}
                    style={{width: '50%'}}
                />
                {taskSpecificSettings}
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

        this.props.clearTaskSpecificState(this.props.type);
        for (const [key, value] of Object.entries(this.state)) {
            if (key !== 'criterions') {
                this.props.handleTaskSpecificState(this.props.type, key, value)
            }
        }

        this.handleLossChange = this.handleLossChange.bind(this);
    }

    handleLossChange(event) {
        let value = event.target.value;
        this.props.handleTaskSpecificState(this.props.type, 'criterion', value)
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

        this.props.clearTaskSpecificState(this.props.type);
        for (const [key, value] of Object.entries(this.state)) {
            if (key !== 'criterions') {
                this.props.handleTaskSpecificState(this.props.type, key, value)
            }
        }

        this.handleLossChange = this.handleLossChange.bind(this);
    }

    handleLossChange(event) {
        let value = event.target.value;
        this.props.handleTaskSpecificState(this.props.type, 'criterion', value)
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

        this.props.clearTaskSpecificState(this.props.type);
        for (const [key, value] of Object.entries(this.state)) {
            if (key !== 'criterions') {
                this.props.handleTaskSpecificState(this.props.type, key, value)
            }
        }

        this.handleLossChange = this.handleLossChange.bind(this);
    }

    handleLossChange(event) {
        let value = event.target.value;
        this.props.handleTaskSpecificState(this.props.type, 'criterion', value)
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