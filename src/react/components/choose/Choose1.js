import React, { Component } from 'react';
import { Button, ButtonGroup, ToggleButton } from 'react-bootstrap';

const {ipcRenderer} = window.require("electron");

class Choose1 extends Component {
    constructor(props) {
        super(props);
        this.state = {
            taskClass: 'cv',
            pushed: false
        };

        this.submitChoice = this.submitChoice.bind(this);
        this.changeChoice = this.changeChoice.bind(this);
    }

    submitChoice(event) {
        event.preventDefault();
        this.setState(state => {
            state.pushed = true;
            return state
        });
        ipcRenderer.send('submitChoice1', this.state.taskClass);
    }

    changeChoice(event){
        this.setState(state => {
            state.taskClass = event.target.value;
            return state
        })
    }

    componentDidMount() {

    }

    render() {
        return (
            <div className="Choose1">
                <header className="choose1">
                    <ButtonGroup toggle>
                        <ToggleButton
                            type="radio"
                            variant="secondary"
                            value={'cv'}
                            checked={this.state.taskClass === 'cv'}
                            onChange={(event) => {
                                event.persist();
                                this.changeChoice(event)
                            }}
                        >
                            {'CV'}
                        </ToggleButton>
                        <ToggleButton
                            type="radio"
                            variant="secondary"
                            value={'nlp'}
                            checked={this.state.taskClass === 'nlp'}
                            onChange={(event) => {
                                event.persist();
                                this.changeChoice(event)
                            }}
                        >
                            {'NLP'}
                        </ToggleButton>
                    </ButtonGroup>
                    <Button
                        variant="success"
                        type="submit"
                        onClick={this.submitChoice}
                    >Submit</Button>
                </header>
            </div>
        );
    }
}

export default Choose1;
