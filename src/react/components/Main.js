import React, {Component} from 'react';
import {Col, Row} from "react-bootstrap";
import {ChooseMainTask, ChooseNames, ChooseSubTask} from "./settings/GeneralSettings";
import DataSettings from "./settings/data/DataSettings"
import ModelSettings from "./settings/model/ModelSettings";
import TrainingSettings from "./settings/training/TrainingSettings";
import {TBButtons, TrainButtons} from "./Launching";
import {TextLog} from "./settings/Common";

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
            }
        };

        this.changeTaskChoice = this.changeTaskChoice.bind(this);
        this.changeSubTaskChoice = this.changeSubTaskChoice.bind(this);
        this.changeProjectName = this.changeProjectName.bind(this);
        this.changeExpName = this.changeExpName.bind(this);
        this.makeConfigFromState = this.makeConfigFromState.bind(this);
    }

    changeTaskChoice(event) {
        this.setState(state => {
            state.general.task = event.target.value;
            state.general.pushedTask = true;
            state.general.pushedSubTask = false;
            state.general.subTask = ''
            return state
        })
    }

    changeSubTaskChoice(event) {
        this.setState(state => {
            state.general.subTask = event.target.value;
            state.general.pushedSubTask = true;
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
        let config = this.makeConfigFromState()
        // if (this.validateConfig(config)) {
        //     ipcRenderer.send('runTraining', {
        //         config: config,
        //     });
        // }
        console.log(config);
    }

    stopTraining() {
        console.log('Stopping training!')
        ipcRenderer.send('stopTraining');
    }

    makeConfigFromState() {
        const camelToSnakeCase = str => str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);

        let cc = this.state.training.common.checkpointCallback;
        let config = {
            general: {
                task: this.state.general.task,
                subtask: this.state.general.subTask,
                project_name: this.state.general.projectName,
                exp_name: this.state.general.expName
            },
            data: {},
            model: {},
            trainer: {},
            training: {},
            optimizer: {
                name: this.state.training.common.optimizer.name,
                params: {
                    lr: this.state.training.common.optimizer.params.lr,
                    ...this.state.training.common.optimizer.paramsAdd
                }
            },
            scheduler: {
                name: 'ReduceLROnPlateau',
                params: {
                    factor: 0.6,
                    patience: 25,
                    min_lr: 1.0e-5,
                    verbose: true
                }
            },
            checkpoint_callback: {
                mode: cc.mode,
                monitor: cc.monitor,
                save_top_k: cc.save_top_k,
                verbose: true,
                filename: `{epoch}_{${cc.monitor}:.3f}`
            }
        };
        ['data', 'model', 'training'].forEach(key => {
            ['common', 'taskSpecific'].forEach(mode => {
                for (const [innerKey, value] of Object.entries(this.state[key][mode])) {
                    if (innerKey === 'checkpointCallback') {
                        continue
                    }
                    if (key === 'training') {
                        switch (innerKey) {
                            case 'maxEpochs': {
                                config.trainer.max_epochs = value
                                break
                            }
                            case 'gpus': {
                                config.trainer.gpus = value
                                break
                            }
                            case 'optimizer': {
                                break
                            }
                            default: {
                                config[key][camelToSnakeCase(innerKey)] = value
                            }
                        }
                    } else {
                        config[key][camelToSnakeCase(innerKey)] = value
                    }
                }
            })
        })
        // ADVANCED
        config.general.project_name = 'project_test'
        config.general.exp_name = 'exp_1'
        config.data.dataset_folder = '/Users/a18277818/Documents/ДИПЛОМ/grad_project_2021/projects/datasets/dogscats'
        return config
    }

    validateConfig(config) {
        if (config.general.project_name === '') {
            alert('Please enter project name!')
            return false
        }
        if (config.general.exp_name === '') {
            alert('Please enter experiment name!')
            return false
        }
        if (config.data.dataset_folder === '') {
            alert('Please choose dataset folder!')
            return false
        }
        return true
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
                        ...this.state.general
                    })}
                    <Row style={{marginTop: "10px"}}>
                        <Col>
                            <DataSettings show={this.state.general.pushedSubTask}
                                          taskSubClass={this.state.general.subTask}
                                          data={this.state.data}
                                          type={'data'}
                                          setCommonState={this.setCommonState.bind(this)}
                                          setTaskSpecificState={this.setTaskSpecificState.bind(this)}
                                          clearTaskSpecificState={this.clearTaskSpecificState.bind(this)}/>
                        </Col>
                        <Col>
                            <ModelSettings show={this.state.general.pushedSubTask}
                                           taskSubClass={this.state.general.subTask}
                                           data={this.state.model}
                                           type={'model'}
                                           setCommonState={this.setCommonState.bind(this)}
                                           setTaskSpecificState={this.setTaskSpecificState.bind(this)}
                                           clearTaskSpecificState={this.clearTaskSpecificState.bind(this)}/>
                        </Col>
                        <Col>
                            <TrainingSettings show={this.state.general.pushedSubTask}
                                              taskSubClass={this.state.general.subTask}
                                              numGpus={this.state.numGpus}
                                              data={this.state.training}
                                              type={'training'}
                                              setCommonState={this.setCommonState.bind(this)}
                                              setTaskSpecificState={this.setTaskSpecificState.bind(this)}
                                              clearTaskSpecificState={this.clearTaskSpecificState.bind(this)}/>
                        </Col>
                    </Row>
                    <Row style={{marginTop: "10px"}} align={'center'}>
                        <Col>
                            <TrainButtons show={this.state.general.pushedSubTask}
                                          training={this.state.training}
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
                </header>
            </div>
        );
    }
}

export default Main;
