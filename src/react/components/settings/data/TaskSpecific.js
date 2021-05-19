import React, {Component} from "react";
import {Col, Form, Row} from "react-bootstrap";
import {LabelArray, Numeric} from "../Common";

export class TaskSpecificForImclf extends Component {
    constructor(props) {
        super(props)

        this.state = {
            width: props.defaultState.width || 256,
            height: props.defaultState.height || 256,
            labels: props.defaultState.labels || ['label1', 'label2']
        }

        this.props.clearTaskSpecificState(this.props.type);
        for (const [key, value] of Object.entries(this.state)) {
            this.props.handleTaskSpecificState(this.props.type, key, value)
        }
    }

    render() {
        return (
            <div>
                <h5>Image width/height</h5>
                <Row className="justify-content-md-center" style={{marginBottom: '10px'}}>
                    <Col md="auto">
                        <div>Width</div>
                        <Numeric value={this.state.width} nameKey={'width'} type={this.props.type}
                                 passData={this.props.handleTaskSpecificState} max={10000}/>
                    </Col>
                    <Col md="auto">
                        <div>Height</div>
                        <Numeric value={this.state.height} nameKey={'height'} type={this.props.type}
                                 passData={this.props.handleTaskSpecificState} max={10000}/>
                    </Col>
                </Row>

                <h5>Labels</h5>
                <LabelArray labels={this.state.labels} type={this.props.type}
                            passData={this.props.handleTaskSpecificState}/>
            </div>
        )
    }
}

export class TaskSpecificForImsgm extends Component {
    constructor(props) {
        super(props)

        this.state = {
            width: props.defaultState.width || 256,
            height: props.defaultState.height || 256,
            useRle: props.defaultState.useRle || false,
            numClasses: props.defaultState.numClasses || 1
        }

        this.props.clearTaskSpecificState(this.props.type);
        for (const [key, value] of Object.entries(this.state)) {
            this.props.handleTaskSpecificState(this.props.type, key, value)
        }
    }

    handleRleCheckbox(event) {
        this.props.handleTaskSpecificState(this.props.type, 'useRle', event.target.checked)
        this.setState(state => {
            state.useRle = event.target.checked
            return state
        })
    }

    render() {
        return (
            <div>
                <h5>Image width/height</h5>
                <Row className="justify-content-md-center" style={{marginBottom: '10px'}}>
                    <Col md="auto">
                        <div>Width</div>
                        <Numeric value={this.state.width} nameKey={'width'} type={this.props.type}
                                 passData={this.props.handleTaskSpecificState} max={10000}/>
                    </Col>
                    <Col md="auto">
                        <div>Height</div>
                        <Numeric value={this.state.height} nameKey={'height'} type={this.props.type}
                                 passData={this.props.handleTaskSpecificState} max={10000}/>
                    </Col>
                </Row>

                <Form.Check type={'checkbox'} style={{fontSize: '20px', lineHeight: '22px', marginBottom: '10px'}}>
                    <Form.Check.Input type={'checkbox'} checked={this.state.useRle}
                                      onChange={(event) => {
                                          event.persist();
                                          this.handleRleCheckbox(event)
                                      }}/>
                    <Form.Check.Label>
                        {'Use RLE'}
                    </Form.Check.Label>
                </Form.Check>

                <h5>Number of classes</h5>
                <Numeric value={this.state.numClasses} nameKey={'numClasses'} type={this.props.type}
                         passData={this.props.handleTaskSpecificState} max={1000} single={true}/>
            </div>
        )
    }
}

export class TaskSpecificForTxtclf extends Component {
    constructor(props) {
        super(props)

        this.state = {
            labels: props.defaultState.labels || ['label1', 'label2'],
            maxItemLen: props.defaultState.maxItemLen || 200,
        }

        this.props.clearTaskSpecificState(this.props.type);
        for (const [key, value] of Object.entries(this.state)) {
            this.props.handleTaskSpecificState(this.props.type, key, value)
        }
    }

    render() {
        return (
            <div>
                <h5>Max item len</h5>
                <Numeric value={this.state.maxItemLen} nameKey={'maxItemLen'} type={this.props.type}
                         passData={this.props.handleTaskSpecificState} max={512} single={true}/>

                <h5 style={{marginTop: '10px'}}>Labels</h5>
                <LabelArray labels={this.state.labels} type={this.props.type}
                            passData={this.props.handleTaskSpecificState}/>
            </div>
        )
    }
}