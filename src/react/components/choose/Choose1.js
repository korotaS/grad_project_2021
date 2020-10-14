import React, { Component } from 'react';

const {ipcRenderer} = window.require("electron");

class Choose1 extends Component {
    constructor(props) {
        super(props);
        this.state = {
            choice: 'cv',
            pushed: false
        }

        this.submitChoice = this.submitChoice.bind(this);
        this.changeChoice = this.changeChoice.bind(this);
    }

    submitChoice(event) {
        event.preventDefault();
        this.setState(state => {
            state.pushed = true;
            return state
        });
        ipcRenderer.send('submitChoice1', this.state.choice);
    }

    changeChoice(event){
        this.setState(state => {
            state.choice = event.target.value;
            return state
        })
    }

    componentDidMount() {

    }

    render() {
        return (
            <div className="Choose1">
                <header className="choose1">
                    <form name="choice1Form">
                        <p>CHOOSE YOUR FIGHTER</p>
                        <div onChange={(event) => {
                            event.persist();
                            this.changeChoice(event)
                        }}>
                            <input type="radio" name="choice1" id="choice_cv" value="cv" defaultChecked/>
                                <label htmlFor="choice_cv">CV</label>

                            <input type="radio" name="choice1" id="choice_nlp" value="nlp"/>
                                <label htmlFor="choice_nlp">NLP</label>

                            <button type="submit" onClick={this.submitChoice}>Submit</button>
                        </div>
                    </form>
                </header>
            </div>
        );
    }
}

export default Choose1;
