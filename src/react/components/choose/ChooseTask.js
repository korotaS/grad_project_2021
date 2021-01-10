import React, { Component } from 'react';
import { Button, ButtonGroup, ToggleButton, InputGroup, FormControl } from 'react-bootstrap';
import openSocket from 'socket.io-client';

const socket = openSocket('http://localhost:5000');
const {ipcRenderer} = window.require("electron");

class ChooseTask extends Component {
    constructor(props) {
        super(props);
        this.state = {
            taskClass: 'cv',
            projectName: 'project_1',
            pushed: false
        };

        this.submitChoice = this.submitChoice.bind(this);
        this.changeChoice = this.changeChoice.bind(this);
        this.changeProjectName = this.changeProjectName.bind(this);

        socket.on('message', message => {
            console.log(message);
            socket.send('received from server: ' + message);
        })

        socket.on('batch', data => {
            console.log(data);
            socket.send('received from server: ' + JSON.stringify(data));
        })
    }

    submitChoice(event) {
        event.preventDefault();
        this.setState(state => {
            state.pushed = true;
            return state
        });
        ipcRenderer.send('submitChoice1', {
            projectName: this.state.projectName,
            taskClass: this.state.taskClass
        });
    }

    changeChoice(event){
        this.setState(state => {
            state.taskClass = event.target.value;
            return state
        })
    }

    changeProjectName(event){
        this.setState(state => {
            state.projectName = event.target.value;
            return state
        })
    }

    componentDidMount() {

    }

    render() {
        return (
            <div className="ChooseTask">
                <header className="chooseTask">
                    <InputGroup className="w-25 projectNameInput">
                        <FormControl
                            value={this.state.projectName}
                            onChange={(event) => {
                                event.persist();
                                this.changeProjectName(event)
                            }}
                        />
                    </InputGroup>
                    <ButtonGroup toggle>
                        <ToggleButton
                            type="radio" variant="secondary" value={'cv'} checked={this.state.taskClass === 'cv'}
                            onChange={(event) => {
                                event.persist();
                                this.changeChoice(event)
                            }}
                        >
                            {'CV'}
                        </ToggleButton>
                        <ToggleButton
                            type="radio" variant="secondary" value={'nlp'} checked={this.state.taskClass === 'nlp'}
                            onChange={(event) => {
                                event.persist();
                                this.changeChoice(event)
                            }}
                        >
                            {'NLP'}
                        </ToggleButton>
                    </ButtonGroup>
                    <Button
                        variant="success" type="submit" onClick={this.submitChoice}
                    >Submit</Button>
                </header>
            </div>
        );
    }
}

export default ChooseTask;
