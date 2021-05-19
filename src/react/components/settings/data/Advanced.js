import React, {Component} from "react";
import {Col, Collapse, Form, Row} from "react-bootstrap";
import Editor from 'react-simple-code-editor';
import {highlight, languages} from 'prismjs/components/prism-core';
import 'prismjs/components/prism-yaml';
import "prismjs/themes/prism-coy.css";

const yaml = require('js-yaml');

export class AdvancedForImclf extends Component {
    constructor(props) {
        super(props)

        this.state = {
            transformsTrain: props.defaultState.transformsTrain || 'default',
            transformsVal: props.defaultState.transformsVal || 'default',

            _: {
                transformsDefault: true,
                transformsTrainCache: 'transform1: 42',
                transformsValid: true
            },
        }

        for (const [key, value] of Object.entries(this.state)) {
            if (key !== '_') {
                this.props.handleTaskSpecificState(this.props.type, key, value)
            }
        }
    }

    handleDefaultCheckbox(event) {
        let transformsConfig = 'not valid'
        try {
            transformsConfig = yaml.load(this.state._.transformsTrainCache)
        } catch {
        }
        this.props.handleTaskSpecificState(this.props.type, 'transformsTrain', event.target.checked ? 'default' : transformsConfig)
        this.setState(state => {
            state._.transformsDefault = event.target.checked
            return state
        })
    }

    handleTransformsTrain(value) {
        let transformsConfig = 'not valid'
        try {
            transformsConfig = yaml.load(value)
            this.setState(state => {
                state._.transformsValid = true
                return state
            })
        } catch (e) {
            this.setState(state => {
                state._.transformsValid = false
                return state
            })
        }
        this.props.handleTaskSpecificState(this.props.type, 'transformsTrain', transformsConfig)
        this.setState(state => {
            state.transformsTrain = value
            state._.transformsTrainCache = value
            return state
        })
    }

    render() {
        return (
            <div style={{marginBottom: '30px'}}>
                <h5 style={{marginTop: '10px'}}>Train transforms</h5>
                <Form.Check
                    label={'default'} type={'checkbox'} checked={this.state._.transformsDefault}
                    style={{marginBottom: '10px', lineHeight: '21px'}}
                    onChange={(event) => {
                        event.persist();
                        this.handleDefaultCheckbox(event)
                    }}
                />

                <Collapse in={!this.state._.transformsDefault && !this.state._.transformsValid}>
                    <div style={{marginBottom: '5px', color: 'red'}}>
                        {'Please enter valid YAML.'}
                    </div>
                </Collapse>

                <Collapse in={!this.state._.transformsDefault}>
                    <div className="container_editor_area">
                        <Editor
                            value={this.state._.transformsTrainCache}
                            onValueChange={this.handleTransformsTrain.bind(this)}
                            highlight={code => highlight(code, languages.yaml, 'yaml')}
                            padding={10}
                            onClick={() => {
                            }}
                            style={{fontSize: 15, width: '70%', border: '1px solid'}}
                        />
                    </div>
                </Collapse>
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

            rgb: true,
            _: {
                transformsDefault: true,
                transformsTrainCache: 'transform1: 42',
                transformsValid: true
            },
        }

        for (const [key, value] of Object.entries(this.state)) {
            if (key !== 'rgb' && key !== '_') {
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

    handleDefaultCheckbox(event) {
        let transformsConfig = 'default'
        try {
            transformsConfig = yaml.load(this.state._.transformsTrainCache)
        } catch {
        }
        this.props.handleTaskSpecificState(this.props.type, 'transformsTrain', event.target.checked ? 'default' : transformsConfig)
        this.setState(state => {
            state._.transformsDefault = event.target.checked
            return state
        })
    }

    handleTransformsTrain(value) {
        let transformsConfig = 'default'
        try {
            transformsConfig = yaml.load(value)
            this.setState(state => {
                state._.transformsValid = true
                return state
            })
        } catch (e) {
            this.setState(state => {
                state._.transformsValid = false
                return state
            })
        }
        this.props.handleTaskSpecificState(this.props.type, 'transformsTrain', transformsConfig)
        this.setState(state => {
            state.transformsTrain = value
            state._.transformsTrainCache = value
            return state
        })
    }

    render() {
        return (
            <div>
                <h5>Train transforms</h5>
                <Form.Check
                    label={'default'} type={'checkbox'} checked={this.state._.transformsDefault}
                    onChange={(event) => {
                        event.persist();
                        this.handleDefaultCheckbox(event)
                    }}
                />
                <div hidden={this.state._.transformsValid}>Please enter the valid YAML.</div>
                <div className="container_editor_area">
                    <Editor
                        disabled={this.state._.transformsDefault}
                        value={this.state._.transformsTrainCache}
                        onValueChange={this.handleTransformsTrain.bind(this)}
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