import {Button, Col, Form, Row} from "react-bootstrap";
import React, {Component} from "react";
import openSocket from 'socket.io-client';

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

    addLabel = (e) => {
        let labels = [...this.state.labels, `label${this.state.labels.length + 1}`]
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
            text: 'asdfg',
            socket: null,
            port: null,
            listenerSet: false
        }

        this.textLog = React.createRef();
        ipcRenderer.send('getPythonPort');
    }

    clearLogs(event) {
        event.preventDefault();
        this.setState(state => {
            state.text = '';
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
                        let prefix = state.text === '' ? '' : '\n'
                        state.text += prefix + data.toString().trim();
                    }
                    return state
                });
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

        // console.log('did mount')
        // if (this.state.socket !== null) {
        //     console.log('notnull')
        //     this.state.socket.on('log', data => {
        //         this.setState(state => {
        //             if (data.toString().trim().length > 0) {
        //                 let prefix = state.text === '' ? '' : '\n'
        //                 state.text += prefix + data.toString().trim();
        //             }
        //             return state
        //         });
        //     })
        // }
    }

    render() {
        if (!this.props.show) {
            return null
        }

        const textAreaStyle = {
            height: '300px',
            minHeight: '300px',
            width: '100%',
            fontSize: '15px',
            marginTop: '10px',
        }

        return (
            <div style={{marginBottom: '10px'}}>
                <Form style={{marginLeft: '10px', marginRight: '10px'}}>
                    <textarea ref={this.textLog}
                              value={this.state.text}
                              readOnly={true}
                              style={textAreaStyle}/>
                    <Button
                        variant="success"
                        type="submit"
                        onClick={this.clearLogs.bind(this)}
                    >Clear logs</Button>
                </Form>
            </div>
        )
    }
}