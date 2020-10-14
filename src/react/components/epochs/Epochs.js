import React, { Component } from 'react';

const {ipcRenderer} = window.require("electron");

class Epochs extends Component {
    constructor(props) {
        super(props);
        this.state = {
            epochs: [],
            status: 'ready',
            project_name: 'project_1'
        }

        this.buttonClick = this.buttonClick.bind(this);
        this.changeProjectName = this.changeProjectName.bind(this);
    }

    buttonClick(project_name) {
        ipcRenderer.send('startTraining', project_name);
    }

    changeProjectName(event) {
        this.setState(state => {
                state.status = event.target.value;
                return state;
        })
    }

    componentDidMount() {
        ipcRenderer.on('addEpochs', function (e, epochs) {
            let epochsArray = JSON.parse(epochs)
            this.setState(state => {
                state.epochs.push(...epochsArray);
                return state;
            })
        }.bind(this));

        ipcRenderer.on('changeStatus', function (e, newStatus) {
            this.setState(state => {
                state.status = newStatus;
                return state;
            })
        }.bind(this));
    }

    render() {
        return (
            <div className="Epochs">
                <header className="epochs">
                    <h1>TEST</h1>
                    <input type="text" value={this.state.project_name} onChange={this.changeProjectName}/>
                    <button id="button" onClick={() => this.buttonClick(this.state.project_name)}>Start training!</button>
                    <h2>STATUS: </h2>
                    <h2>{this.state.status}</h2>
                    <h2>Epochs</h2>
                    <ul>
                        {this.state.epochs.map(epoch => (
                            <li key={epoch.epoch_num}>{`Epoch: ${epoch.epoch_num}, 
                                                        loss: ${epoch.loss}, 
                                                        metrics: ${epoch.metrics}`}</li>
                        ))}
                    </ul>
                </header>
            </div>
        );
    }
}

export default Epochs;
