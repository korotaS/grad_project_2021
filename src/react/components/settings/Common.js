import {Button, Col, Collapse, Form, Row} from "react-bootstrap";
import React, {Component} from "react";
import openSocket from 'socket.io-client';
import {TracebackModal} from "../other/Modals";

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
                    style={{width: '70%'}}
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
                style={{width: this.props.single ? '30%' : '70%'}}
            />
        )
    }
}

export class LabelArray extends Component {
    constructor(props) {
        super(props)

        this.state = {
            labels: props.labels || ['label1', 'label2'],
            animate: [true, true],
            removeIndex: null
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
        }, () => {
            this.setState(state => {
                state.animate = [...state.animate, true]
                return state
            })
        })
    }

    removeElement = (e, index) => {
        if (this.state.labels.length > 2) {
            let labels = [...this.state.labels]
            labels.splice(index, 1)
            this.props.passData(this.props.type, 'labels', labels)
            this.setState(state => {
                state.removeIndex = index
                state.labels = labels
                return state
            }, () => {
                this.setState(state => {
                    state.animate.splice(index, 1)
                    return state
                })
            })
        }
    }

    render() {
        return (
            <div>
                <div>
                    {this.state.labels.map((obj, index) => {
                        return (
                            <Collapse in={this.state.animate[index]} key={index}>
                                <div key={index} style={{marginBottom: '10px', lineHeight: '25px'}}>
                                    <input type="text" value={obj}
                                           style={{verticalAlign: 'middle', marginRight: '10px'}}
                                           onChange={(e) => this.handleArrayChange(e, index)}/>
                                    <Button size={'sm'} style={{verticalAlign: 'middle'}} variant={'outline-danger'}
                                            disabled={this.state.labels.length === 2}
                                            onClick={(e) => this.removeElement(e, index)}
                                    >Delete</Button>
                                </div>
                            </Collapse>
                        )
                    })}
                </div>
                <Button size={'sm'} onClick={this.addLabel}>Add label</Button>
            </div>
        )
    }
}

export class TextLog extends Component {
    constructor(props) {
        super(props);

        this.state = {
            log: [],
            socket: null,
            host: 'localhost',
            port: null,
            listenerSet: false,

            showTraceback: false,
            currentTracebackIndex: null
        }

        this.textLog = React.createRef();
        this.socketLogListener = this.socketLogListener.bind(this);
        this.socketExceptionListener = this.socketExceptionListener.bind(this);
    }

    clearLogs(event) {
        event.preventDefault();
        this.setState(state => {
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

    socketLogListener(data) {
        let str = data.toString().trim()
        let len = this.state.log.length
        this.setState(state => {
            if (str.length > 0 && (len === 0 || state.log[len-1].text !== str)) {
                state.log = state.log.concat({text: str, error: false})
            }
            return state
        });
    }

    socketExceptionListener(data) {
        let ex = JSON.parse(data.toString())
        let ex_string = `Error: ${ex.name}\nMessage: ${ex.message}`
        this.setState(state => {
            state.log = state.log.concat({text: ex_string, error: true, traceback: ex.traceback})
            return state
        });
        this.props.stopTraining()
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        if (this.textLog.current !== null) {
            this.textLog.current.scrollTop = this.textLog.current.scrollHeight;
        }

        if (this.props.host !== this.state.host || this.props.port !== this.state.port) {
            this.setState(state => {
                state.host = this.props.host
                state.port = this.props.port
                if (state.socket !== null) {
                    state.socket.close()
                    state.socker = null
                }
                state.socket = openSocket(`http://${this.props.host}:${this.props.port}`);
                state.socket.on('log', this.socketLogListener)
                state.socket.on('exception', this.socketExceptionListener)
                return state
            });
        }
    }

    componentDidMount() {
        ipcRenderer.on('startedNewPython', function (e, data) {
            this.setState(state => {
                state.host = 'localhost'
                if (state.socket !== null) {
                    state.socket.close()
                    state.socker = null
                }
                state.socket = openSocket(`http://localhost:${data.port}`);
                state.socket.on('log', this.socketLogListener)
                state.socket.on('exception', this.socketExceptionListener)
                return state
            })
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

export function SingleCheck(props) {
    return (
        <Form.Check type={'checkbox'} style={{fontSize: '20px', lineHeight: '22px', marginBottom: '10px'}}>
            <Form.Check.Input type={'checkbox'} checked={props.value}
                              onChange={(event) => {
                                  event.persist();
                                  props.handleCheckbox(event)
                              }}/>
            <Form.Check.Label>
                {props.text}
            </Form.Check.Label>
        </Form.Check>
    )
}