import React, {Component} from 'react';
import {Button, ButtonGroup, ToggleButton, InputGroup, FormControl} from 'react-bootstrap';
import openSocket from 'socket.io-client';

const {ipcRenderer} = window.require("electron");

class ChooseTask extends Component {
    constructor(props) {
        super(props);
        this.state = {
            taskClass: 'cv',
            projectName: 'project_1',
            pushed: false,
            text: '',
        };

        this.submitChoice = this.submitChoice.bind(this);
        this.changeChoice = this.changeChoice.bind(this);
        this.changeProjectName = this.changeProjectName.bind(this);

        this.textLog = React.createRef();
        const socket = openSocket(`http://localhost:5000`);

        socket.on('message', message => {
            console.log(message);
        })

        socket.on('log', data => {
            console.log(data);
            this.setState(state => {
                if (data.toString().trim().length > 0) {
                    let prefix = state.text === '' ? '' : '\n'
                    state.text += prefix+data.toString().trim();
                }
                return state
            });
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

    changeChoice(event) {
        this.setState(state => {
            state.taskClass = event.target.value;
            return state
        })
    }

    changeProjectName(event) {
        this.setState(state => {
            state.projectName = event.target.value;
            return state
        })
    }

    componentDidMount() {

    }

    componentDidUpdate() {
        this.textLog.current.scrollTop = this.textLog.current.scrollHeight;
    }

    render() {
        if (this.state.port === -1){
            return null
        }
        const textAreaStyle = {
            height: '300px',
            width: '100%',
            // resize: 'none',
            // padding: '9px',
            // boxSizing: 'border-box',
            fontSize: '15px'
        }
        return (
            <div className="ChooseTask">
                <header className="chooseTask">
                    <textarea ref={this.textLog} value={this.state.text} readOnly={true} style={textAreaStyle}/>
                    {/*<InputGroup className="w-25 projectNameInput">*/}
                    {/*    <FormControl*/}
                    {/*        value={this.state.projectName}*/}
                    {/*        onChange={(event) => {*/}
                    {/*            event.persist();*/}
                    {/*            this.changeProjectName(event)*/}
                    {/*        }}*/}
                    {/*    />*/}
                    {/*</InputGroup>*/}
                    {/*<ButtonGroup toggle>*/}
                    {/*    <ToggleButton*/}
                    {/*        type="radio" variant="secondary" value={'cv'} checked={this.state.taskClass === 'cv'}*/}
                    {/*        onChange={(event) => {*/}
                    {/*            event.persist();*/}
                    {/*            this.changeChoice(event)*/}
                    {/*        }}*/}
                    {/*    >*/}
                    {/*        {'CV'}*/}
                    {/*    </ToggleButton>*/}
                    {/*    <ToggleButton*/}
                    {/*        type="radio" variant="secondary" value={'nlp'} checked={this.state.taskClass === 'nlp'}*/}
                    {/*        onChange={(event) => {*/}
                    {/*            event.persist();*/}
                    {/*            this.changeChoice(event)*/}
                    {/*        }}*/}
                    {/*    >*/}
                    {/*        {'NLP'}*/}
                    {/*    </ToggleButton>*/}
                    {/*</ButtonGroup>*/}
                    {/*<Button*/}
                    {/*    variant="success" type="submit" onClick={this.submitChoice}*/}
                    {/*>Submit</Button>*/}
                </header>
            </div>
        );
    }
}

export default ChooseTask;
