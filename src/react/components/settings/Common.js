import {Button, Col, Form, Row} from "react-bootstrap";
import React, {Component} from "react";
import openSocket from 'socket.io-client';
import {TracebackModal} from "../Modals";

const {ipcRenderer} = window.require("electron");

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
            value: props.value === null ? 1 : props.value
        }

        this.handleChange = this.handleChange.bind(this);
    }

    handleChange(event) {
        let {value, min, max} = event.target;
        value = Math.max(Number(min), Math.min(max, Number(value)));
        if (this.props.passData) {
            this.props.passData(this.props.type, this.props.nameKey, value)
        }
        this.setState(state => {
            state.value = value;
            return state
        })
    }

    render() {
        return (
            <input
                type="number" min={this.props.min === null ? 1 : this.props.min} max={this.props.max || Infinity}
                value={this.state.value}
                onChange={(event) => {
                    event.persist();
                    this.handleChange(event)
                }}
                style={{width: '50%'}}
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
        this.props.passData(this.props.type, 'labels', labels)
        this.setState(state => {
            state.labels = labels;
            return state
        })
    }

    addLabel = () => {
        let lastLabelIndex = this.state.labels.length + 1
        while (this.state.labels.includes(`label${lastLabelIndex}`)) {
            lastLabelIndex += 1
        }
        let labels = [...this.state.labels, `label${lastLabelIndex}`]
        this.props.passData(this.props.type, 'labels', labels)
        this.setState(state => {
            state.labels = labels;
            return state
        })
    }

    removeElement = (e, index) => {
        if (this.state.labels.length > 2) {
            let labels = [...this.state.labels]
            labels.splice(index, 1)
            this.props.passData(this.props.type, 'labels', labels)
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

export class TextLog extends Component {
    constructor(props) {
        super(props);
        this.state = {
            text: '',
            log: [],
            socket: null,
            port: null,
            listenerSet: false,

            showTraceback: false,
            currentTracebackIndex: null
        }

        this.textLog = React.createRef();
        ipcRenderer.send('getPythonPort');
    }

    clearLogs(event) {
        event.preventDefault();
        this.setState(state => {
            state.text = '';
            state.log = []
            state.currentTracebackIndex = null
            return state
        });
    }

    setShowTraceback(value, index = null) {
        this.setState(state => {
            if (index !== null) {
                state.currentTracebackIndex = index
            }
            state.showTraceback = value;
            return state
        });
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        if (this.textLog.current !== null) {
            this.textLog.current.scrollTop = this.textLog.current.scrollHeight;
        }

        if (this.state.socket !== null && !this.state.listenerSet) {
            this.setState(state => {
                state.listenerSet = true
                return state
            });

            this.state.socket.on('log', data => {
                this.setState(state => {
                    if (data.toString().trim().length > 0) {
                        state.log = state.log.concat({text: data.toString().trim(), error: false})
                    }
                    return state
                });
            })

            this.state.socket.on('exception', data => {
                let ex = JSON.parse(data.toString())
                let ex_string = `Error: ${ex.name}\nMessage: ${ex.message}`
                this.setState(state => {
                    state.log = state.log.concat({text: ex_string, error: true, traceback: ex.traceback})
                    return state
                });
                this.props.stopTraining()
            })
        }
    }

    componentDidMount() {
        ipcRenderer.on('pythonPort', function (e, data) {
            let port = JSON.parse(data).port
            if (this.state.socket === null) {
                this.setState(state => {
                    state.port = port;
                    state.socket = openSocket(`http://localhost:${port}`);
                    return state
                })
            }
        }.bind(this));
    }

    renderLog() {
        return (
            <div style={{height: '300px', width: '600px', overflow: 'auto', border: '4px solid black'}}
                 align={'left'} ref={this.textLog}>
                {this.state.log.map((obj, index) => {
                    return (
                        <div key={index}>
                            <p style={{
                                color: obj.error ? 'red' : 'black',
                                marginBottom: '0px',
                                whiteSpace: 'pre-line'
                            }}>{obj.text}</p>
                            {obj.error
                                ? <div style={{color: 'gray'}}
                                       onClick={() => this.setShowTraceback(true, index)}>(show full traceback)</div>
                                : null}
                        </div>
                    )
                })}
            </div>
        )
    }

    render() {
        if (!this.props.show) {
            return null
        }

        let log = this.renderLog()
        return (
            <div style={{marginBottom: '10px'}}>
                <Form style={{marginLeft: '10px', marginRight: '10px'}}>
                    {log}
                    <Button
                        variant="success"
                        type="submit"
                        onClick={this.clearLogs.bind(this)}
                    >Clear logs</Button>
                </Form>
                <TracebackModal show={this.state.showTraceback}
                                onHide={() => this.setShowTraceback(false)}
                                value={this.state.currentTracebackIndex === null
                                    ? null
                                    : this.state.log[this.state.currentTracebackIndex].traceback}/>
            </div>
        )
    }
}