import React, { Component } from 'react';

const {ipcRenderer} = window.require("electron");

class Choose2 extends Component {
    constructor(props) {
        super(props);
        this.state = {
            taskClass: props.taskClass,
            taskSubClass: props.taskClass === 'cv' ? 'imclf' : 'txtclf',
            pushed: false,
        }

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
        ipcRenderer.send('submitChoice2', [this.state.taskClass, this.state.taskSubClass]);
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
                        <form name="choice2Form">
                            <p>CHOOSE YOUR FIGHTER 2</p>
                            <div onChange={(event) => {
                                event.persist();
                                this.changeChoice(event)
                            }}>
                                <input type="radio" name="choice2" id="choice_imclf" value="imclf" defaultChecked/>
                                    <label htmlFor="choice_imclf">Image classification</label>

                                <input type="radio" name="choice2" id="choice_imsgm" value="imsgm"/>
                                    <label htmlFor="choice_imsgm">Image segmentation</label>

                                <input type="radio" name="choice2" id="choice_objdet" value="objdet"/>
                                    <label htmlFor="choice_objdet">Object detection</label>

                                <button type="submit" onClick={this.submitChoice}>Submit</button>
                            </div>
                        </form>
                    </header>
                </div>
            );
        }
        else {
            return (
                <div className="Choose2">
                    <header className="choose2">
                        <form name="choice2Form">
                            <p>CHOOSE YOUR FIGHTER 2</p>
                            <div onChange={(event) => {
                                event.persist();
                                this.changeChoice(event)
                            }}>
                                <input type="radio" name="choice2" id="choice_txtclf" value="txtclf" defaultChecked/>
                                    <label htmlFor="choice_txtclf">Text classification</label>

                                <input type="radio" name="choice2" id="choice_ner" value="ner"/>
                                    <label htmlFor="choice_ner">Named entity recognition</label>

                                <button type="submit" onClick={this.submitChoice}>Submit</button>
                            </div>
                        </form>
                    </header>
                </div>
            );
        }
    }
}

export default Choose2;
