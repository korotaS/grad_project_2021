import React, { Component } from 'react';
import { Button, Form, Col } from 'react-bootstrap';

const {ipcRenderer} = window.require("electron");

class Choose2 extends Component {
    constructor(props) {
        super(props);
        this.state = {
            taskClass: props.taskClass,
            taskSubClass: props.taskClass === 'cv' ? 'imclf' : 'txtclf',
            pushed: false,
        };

        this.submitChoice = this.submitChoice.bind(this);
        this.changeChoice = this.changeChoice.bind(this);
    }

    static getDerivedStateFromProps(props, state) {
        if (props.taskClass !== state.taskClass) {
            return {
                taskClass: props.taskClass,
                taskSubClass: props.taskClass === 'cv' ? 'imclf' : 'txtclf',
                pushed: false,
            }
        }
        return state;
    }

    submitChoice(event) {
        event.preventDefault();
        this.setState(state => {
            state.pushed = true;
            return state
        });
        ipcRenderer.send('submitChoice2', {
            taskClass: this.state.taskClass,
            taskSubClass: this.state.taskSubClass
        });
    }

    changeChoice(event){
        this.setState(state => {
            state.taskSubClass = event.target.value;
            return state
        })
    }

    componentDidMount() {

    }

    render() {
        if (this.state.taskClass === 'cv') {
            return (
                <div className="Choose2">
                    <header className="choose2">
                        <Form>
                            <Form.Row className="align-items-center">
                                <Col xs="auto">
                                    <Form.Check
                                    type={'radio'}
                                    id={'choiceImclf'}
                                    label={'Image classification'}
                                    value={'imclf'}
                                    checked={this.state.taskSubClass === 'imclf'}
                                    onChange={(event) => {
                                        event.persist();
                                        this.changeChoice(event)
                                    }}
                                    />
                                </Col>
                                <Col xs="auto">
                                    <Form.Check
                                    type={'radio'}
                                    id={'choiceImsgm'}
                                    label={'Image segmentation'}
                                    value={'imsgm'}
                                    checked={this.state.taskSubClass === 'imsgm'}
                                    onChange={(event) => {
                                        event.persist();
                                        this.changeChoice(event)
                                    }}
                                    />
                                </Col>
                                <Col xs="auto">
                                    <Form.Check
                                    type={'radio'}
                                    id={'choiceObjdet'}
                                    label={'Object detection'}
                                    value={'objdet'}
                                    checked={this.state.taskSubClass === 'objdet'}
                                    onChange={(event) => {
                                        event.persist();
                                        this.changeChoice(event)
                                    }}
                                    />
                                </Col>
                                <Col xs="auto">
                                    <Button
                                        variant="success"
                                        type="submit"
                                        onClick={this.submitChoice}
                                    >Submit</Button>
                                </Col>
                            </Form.Row>
                        </Form>
                    </header>
                </div>
            );
        }
        else {
            return (
                <div className="Choose2">
                    <header className="choose2">
                        <Form>
                            <Form.Row className="align-items-center">
                                <Col xs="auto">
                                    <Form.Check
                                    type={'radio'}
                                    id={'choiceTxtclf'}
                                    label={'Test classification'}
                                    value={'txtclf'}
                                    checked={this.state.taskSubClass === 'txtclf'}
                                    onChange={(event) => {
                                        event.persist();
                                        this.changeChoice(event)
                                    }}
                                    />
                                </Col>
                                <Col xs="auto">
                                    <Form.Check
                                    type={'radio'}
                                    id={'choiceNer'}
                                    label={'Named entity recognition'}
                                    value={'ner'}
                                    checked={this.state.taskSubClass === 'ner'}
                                    onChange={(event) => {
                                        event.persist();
                                        this.changeChoice(event)
                                    }}
                                    />
                                </Col>
                                <Col xs="auto">
                                    <Button
                                        variant="success"
                                        type="submit"
                                        onClick={this.submitChoice}
                                    >Submit</Button>
                                </Col>
                            </Form.Row>
                        </Form>
                    </header>
                </div>
            );
        }
    }
}

export default Choose2;
