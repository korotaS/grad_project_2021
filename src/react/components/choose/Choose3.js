import React, { Component } from 'react';
import { Button, Form, Col } from 'react-bootstrap';

const {ipcRenderer} = window.require("electron");

class Choose3 extends Component {
    constructor(props) {
        super(props);
        this.state = {
            taskClass: props.taskClass,
            taskSubClass: props.taskSubClass,
            projectName: props.projectName,
            datasetName: 'MNIST',
            pushed: false,
        };

        this.submitChoice = this.submitChoice.bind(this);
        this.changeChoice = this.changeChoice.bind(this);
    }

    static getDerivedStateFromProps(props, state) {
        if(props.taskClass !== state.taskClass || props.taskSubClass !== state.taskSubClass){
            return {
                taskClass: props.taskClass,
                taskSubClass: props.taskClass,
                projectName: props.projectName,
                pushed: false,
                datasetName: 'MNIST', //TODO: change it to relevant task subclass!!!
            }
        }
        return state
    }

    submitChoice(event) {
        event.preventDefault();
        this.setState(state => {
            state.pushed = true;
            return state
        });
        ipcRenderer.send('submitChoice3', {
            taskClass: this.state.taskClass,
            taskSubClass: this.state.taskSubClass,
            datasetName: this.state.datasetName,
            projectName: this.state.projectName,
        });
    }

    changeChoice(event){
        this.setState(state => {
            state.datasetName = event.target.value;
            return state
        })
    }

    componentDidMount() {

    }

    render() {
        return (
            <div className="Choose3">
                <header className="choose3">
                    <Form>
                        <Form.Row className="align-items-center">
                            <Col xs="auto">
                                <Form.Control
                                    as="select" id={'selectDataset'}
                                    onChange={(event) => {
                                        event.persist();
                                        this.changeChoice(event)
                                    }}>
                                  <option value={'MNIST'}>MNIST</option>
                                  <option value={'CIFAR10'}>CIFAR10</option>
                                </Form.Control>
                            </Col>
                            <Col xs="auto">
                                <Button
                                    variant="success" type="submit" onClick={this.submitChoice}
                                >Submit</Button>
                            </Col>
                        </Form.Row>
                    </Form>
                </header>
            </div>
        );
    }
}

export default Choose3;
