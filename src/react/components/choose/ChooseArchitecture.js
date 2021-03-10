import React, {Component} from 'react';
import {Button, Form, Col, FormLabel} from 'react-bootstrap';

const {ipcRenderer} = window.require("electron");

class ChooseArchitecture extends Component {
    constructor(props) {
        super(props);
        this.state = {
            taskClass: props.taskClass,
            taskSubClass: props.taskSubClass,
            projectName: props.projectName,
            datasetFolder: props.datasetFolder,
            architectures: props.architectures,
            selectedIndex: 0,
            pushed: false,
        };

        this.submitChoice = this.submitChoice.bind(this);
        this.handleChange = this.handleChange.bind(this);
    }

    static getDerivedStateFromProps(props, state) {
        if (props.taskClass !== state.taskClass ||
            props.taskSubClass !== state.taskSubClass ||
            props.datasetFolder !== state.datasetFolder) {
            return {
                taskClass: props.taskClass,
                taskSubClass: props.taskClass,
                projectName: props.projectName,
                datasetFolder: props.datasetFolder,
                architectures: props.architectures,
                selectedIndex: 0,
                pushed: false,
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
        ipcRenderer.send('submitChoice4', {
            taskClass: this.state.taskClass,
            taskSubClass: this.state.taskSubClass,
            datasetFolder: this.state.datasetFolder,
            projectName: this.state.projectName,
            architecture: this.state.architectures[this.state.selectedIndex]
        });
    }

    handleChange = ({target}) => {
        this.setState(state => {
            state.selectedIndex = target.value;
            return state
        });
    }

    componentDidMount() {

    }

    render() {
        return (
            <div className="ChooseArchitecture">
                <header className="chooseArchitecture">
                    <Form>
                        <Form.Row className="align-items-center">
                            <Col xs="auto">
                                <Form.Control
                                    as="select" custom
                                    value={this.state.selectedIndex}
                                    onChange={this.handleChange}>
                                    {this.state.architectures.map((architecture, index) =>
                                        <option key={index} value={index}>{architecture}</option>)}
                                </Form.Control>
                            </Col>
                            <Col xs="auto">
                                <Button
                                    variant="success" type="submit" onClick={this.submitChoice}
                                >Submit</Button>
                            </Col>
                            <FormLabel>{}</FormLabel>
                        </Form.Row>
                    </Form>
                </header>
            </div>
        );
    }
}

export default ChooseArchitecture;
