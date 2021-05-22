import {Form} from "react-bootstrap";
import React, {Component} from "react";

export class TrainingSettingsForImclf extends Component {
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
                <Form.Control as="select" custom
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

export class TrainingSettingsForImsgm extends Component {
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
                <Form.Control as="select" custom
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

export class TrainingSettingsForTxtclf extends Component {
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
                <Form.Control as="select" custom
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