import React, {Component} from "react";
import {Col, Form, Row} from "react-bootstrap";

export class AdvancedForImclf extends Component {
    constructor(props) {
        super(props)

        this.state = {
            transformsTrain: 'default',
            transformsVal: 'default'
        }

        for (const [key, value] of Object.entries(this.state)) {
            this.props.handleTaskSpecificState(this.props.type, key, value)
        }
    }

    render() {
        return (
            <div>
                <h5>Train transforms</h5>
                <div>Transforms train</div>
            </div>
        )
    }
}

export class AdvancedForImsgm extends Component {
    constructor(props) {
        super(props)

        this.state = {
            transformsTrain: props.defaultState.transformsTrain || 'default',
            transformsVal: props.defaultState.transformsVal || 'default',
            inChannels: props.defaultState.inChannels || 3,

            rgb: true
        }

        for (const [key, value] of Object.entries(this.state)) {
            if (key !== 'rgb') {
                this.props.handleTaskSpecificState(this.props.type, key, value)
            }
        }
    }

    handleRgbChange(event) {
        let rgb = event.target.value === 'rgb'
        let numChannels = rgb ? 3 : 1
        this.props.handleTaskSpecificState(this.props.type, 'inChannels', numChannels)
        this.setState(state => {
            state.rgb = rgb
            state.inChannels = numChannels
            return state
        })
    }

    render() {
        return (
            <div>
                <h5>Train transforms</h5>
                <div>Transforms train</div>

                <h5>In channels</h5>
                <Row className="justify-content-md-center">
                    <Col xs="auto">
                        <Form.Check
                            type={'radio'} label={'3 (RGB)'} value={'rgb'} checked={this.state.rgb}
                            onChange={(event) => {
                                event.persist();
                                this.handleRgbChange(event)
                            }}/>
                    </Col>
                    <Col xs="auto">
                        <Form.Check
                            type={'radio'} label={'1 (grey)'} value={'grey'} checked={!this.state.rgb}
                            onChange={(event) => {
                                event.persist();
                                this.handleRgbChange(event)
                            }}/>
                    </Col>
                </Row>
            </div>
        )
    }
}