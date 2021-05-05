import {Button, Col, Form, Row} from "react-bootstrap";
import React, {Component} from "react";

export function DatasetLength(props) {
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

export class Numeric extends Component {
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

export class LabelArray extends Component {
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