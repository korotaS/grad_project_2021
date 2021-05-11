import React, {Component} from 'react';
import {Button, Col, Row} from "react-bootstrap";
import {ChooseMainTask, ChooseNames, ChooseSubTask} from "./settings/GeneralSettings";
import DataSettings from "./settings/data/DataSettings"
import ModelSettings from "./settings/model/ModelSettings";
import TrainingSettings from "./settings/training/TrainingSettings";
import {TBButtons, TrainButtons} from "./Launching";
import {TextLog} from "./settings/Common";
import {makeConfigFromState, validateConfig} from "./utils/configSettings";

const {set} = require('lodash');
const {ipcRenderer} = window.require("electron");

class Main extends Component {
    constructor(props) {
        super(props);
        this.state = {
            general: {
                task: '',
                pushedTask: false,
                subTask: '',
                pushedSubTask: false,
                projectName: '',
                expName: '',
            },
            numGpus: -1,
            data: {
                common: {
                    datasetFolder: "",
                    trainLen: -1,
                    valLen: -1,
                    shuffleTrain: true,
                    shuffleVal: false,
                },
                taskSpecific: {},
                taskSpecificCache: {}
            },
            model: {
                common: {},
                taskSpecific: {},
                taskSpecificCache: {}
            },
            training: {
                common: {
                    gpus: null,
                    maxEpochs: 100,
                    batchSizeTrain: 8,
                    batchSizeVal: 8,
                    workers: 0,
                    optimizer: {
                        name: 'Adam',
                        params: {
                            lr: 0.001
                        },
                        paramsAdd: {}
                    },
                    checkpointCallback: {
                        monitor: 'val_loss',
                        mode: 'min',
                        save_top_k: 1
                    }
                },
                taskSpecific: {},
                taskSpecificCache: {}
            },
            run: {
                training: false,
                tbLaunched: false,
                tbLink: ''
            },
            view: {
                viewData: false,
                viewModel: false,
                viewTraining: false,
                viewFooter: false,

                pushedNames: false,
                pushedData: false,
                pushedModel: false,
                pushedTraining: false
            }
        };

        this.changeTaskChoice = this.changeTaskChoice.bind(this);
        this.changeSubTaskChoice = this.changeSubTaskChoice.bind(this);
        this.changeProjectName = this.changeProjectName.bind(this);
        this.changeExpName = this.changeExpName.bind(this);
        this.changeView = this.changeView.bind(this);
    }

    changeTaskChoice(event) {
        this.setState(state => {
            state.general.task = event.target.value;
            state.general.pushedTask = true;
            state.general.pushedSubTask = false;
            state.general.subTask = ''
            for (const key of Object.keys(state.view)) {
                state.view[key] = false
            }
            return state
        })
    }

    changeSubTaskChoice(event) {
        this.setState(state => {
            state.general.subTask = event.target.value;
            state.general.pushedSubTask = true;
            for (const key of Object.keys(state.view)) {
                state.view[key] = false
            }
            return state
        })
    }

    changeProjectName(event) {
        let value = event.target.value;
        this.setState(state => {
            state.general.projectName = value;
            return state
        })
    }

    changeView(pushedKey, viewKey, onlyShow = true) {
        function cap(string) {
            return string.charAt(0).toUpperCase() + string.slice(1);
        }

        pushedKey = cap(pushedKey)
        viewKey = cap(viewKey)
        this.setState(state => {
            let key1 = 'view' + viewKey
            state.view[key1] = onlyShow ? true : !state.view[key1]
            return state
        })
    }

    changeExpName(event) {
        let value = event.target.value;
        this.setState(state => {
            state.general.expName = value;
            return state
        })
    }

    setCommonState(type, key, data) {
        this.setState(state => {
            set(state[type].common, key, data)
            return state
        })
    }

    setTaskSpecificState(type, key, data) {
        this.setState(state => {
            state[type].taskSpecific[key] = data;
            state[type].taskSpecificCache[key] = data;
            return state
        })
    }

    clearTaskSpecificState(type) {
        this.setState(state => {
            state[type].taskSpecific = {};
            return state
        })
    }

    runTraining() {
        console.log('Running training with these params:')
        this.setState(state => {
            state.run.training = true
            return state
        })
        let config = makeConfigFromState(this.state)
        if (validateConfig(config)) {
            ipcRenderer.send('runTraining', {
                config: config,
            });
        }
        console.log(config);
    }

    stopTraining() {
        console.log('Stopping training!')
        ipcRenderer.send('stopTraining');
    }

    componentDidMount() {
        if (this.state.numGpus === -1) {
            ipcRenderer.send('getNumGpus');
        }

        ipcRenderer.on('gotNumGpus', function (e, data) {
            let jsonData = JSON.parse(data)
            this.setState(state => {
                state.numGpus = jsonData.numGpus
                return state;
            })
        }.bind(this));

        ipcRenderer.on('trainingStopped', function () {
            this.setState(state => {
                state.run.training = false;
                return state
            })
        }.bind(this));
    }

    render() {
        if (this.state.port === -1) {
            return null
        }
        return (
            <div className="Main">
                <header className="main">
                    {ChooseMainTask({
                        changeTaskChoice: this.changeTaskChoice,
                        ...this.state.general
                    })}
                    {ChooseSubTask({
                        changeSubTaskChoice: this.changeSubTaskChoice,
                        ...this.state.general
                    })}
                    {ChooseNames({
                        changeProjectName: this.changeProjectName,
                        changeExpName: this.changeExpName,
                        changeView: this.changeView,
                        ...this.state.general
                    })}
                    <Row style={{marginTop: "10px"}}>
                        <Col>
                            <DataSettings showContent={this.state.view.viewData}
                                          showFull={this.state.general.pushedSubTask}
                                          taskSubClass={this.state.general.subTask}
                                          changeView={this.changeView}
                                          data={this.state.data}
                                          type={'data'}
                                          setCommonState={this.setCommonState.bind(this)}
                                          setTaskSpecificState={this.setTaskSpecificState.bind(this)}
                                          clearTaskSpecificState={this.clearTaskSpecificState.bind(this)}/>
                            <ModelSettings showContent={this.state.view.viewModel}
                                           showFull={this.state.general.pushedSubTask}
                                           taskSubClass={this.state.general.subTask}
                                           changeView={this.changeView}
                                           data={this.state.model}
                                           type={'model'}
                                           setCommonState={this.setCommonState.bind(this)}
                                           setTaskSpecificState={this.setTaskSpecificState.bind(this)}
                                           clearTaskSpecificState={this.clearTaskSpecificState.bind(this)}/>
                            <TrainingSettings showContent={this.state.view.viewTraining}
                                              showFull={this.state.general.pushedSubTask}
                                              taskSubClass={this.state.general.subTask}
                                              changeView={this.changeView}
                                              numGpus={this.state.numGpus}
                                              data={this.state.training}
                                              type={'training'}
                                              setCommonState={this.setCommonState.bind(this)}
                                              setTaskSpecificState={this.setTaskSpecificState.bind(this)}
                                              clearTaskSpecificState={this.clearTaskSpecificState.bind(this)}/>
                        </Col>
                    </Row>
                    <div hidden={!this.state.general.pushedSubTask} align={'center'}>
                        <Button style={{marginTop: '10px'}}
                                variant="outline-secondary"
                                onClick={() => {
                                    this.changeView('footer', 'footer', false);
                                }}
                                size={'lg'}
                        >{'Run! ' + (this.state.view.viewFooter ? '▲' : '▼')}</Button>
                        <div hidden={!this.state.view.viewFooter}>
                            <Row style={{marginTop: "10px"}} align={'center'}>
                                <Col>
                                    <TrainButtons show={this.state.general.pushedSubTask}
                                                  training={this.state.run.training}
                                                  runTraining={this.runTraining.bind(this)}
                                                  stopTraining={this.stopTraining.bind(this)}/>
                                </Col>
                            </Row>
                            <Row style={{marginTop: "10px"}} align={'center'}>
                                <Col>
                                    <TBButtons show={this.state.general.pushedSubTask}/>
                                </Col>
                            </Row>
                            <TextLog show={this.state.general.pushedSubTask}/>
                        </div>
                    </div>
                </header>
            </div>
        );
    }
}

export default Main;
