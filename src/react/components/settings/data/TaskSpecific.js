import React, {Component} from "react";
import {Col, Row} from "react-bootstrap";
import {LabelArray, Numeric, SingleCheck} from "../Common";

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

                <h5 style={{marginTop: '10px', display: 'inline-block'}}>Labels</h5>
                <div className="help-tip">
                    <p>Labels have to match those in info.json.</p>
                </div>
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
        let link = <a
            href={'https://github.com/korotaS/grad_project_2021/blob/234866394b22dcdcc7d55e49d1a2cc4d15610998/src/python/utils/utils.py#L31'}
            target={'_blank'} rel={"noopener noreferrer"}>this</a>;
        let hint = (<div>Run length encoding. You can convert your masks to RLE with {link} function.</div>)
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

                <SingleCheck value={this.state.useRle}
                             handleCheckbox={this.handleRleCheckbox.bind(this)}
                             text={'Use RLE'}
                             hint={hint}/>

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