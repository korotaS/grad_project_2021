import React, {Component} from 'react';
import {Col, Collapse, Row} from "react-bootstrap";
import {ChooseMainTask, ChooseNames, ChooseSubTask} from "./settings/GeneralSettings";
import DataSettings from "./settings/data/DataSettings"
import ModelSettings from "./settings/model/ModelSettings";
import TrainingSettings from "./settings/training/TrainingSettings";
import {TrainButtons} from "./other/Launching";
import {TextLog} from "./settings/Common";
import {makeConfigFromState, makeLoadConfigFromState} from "./utils/configSettings";
import {ErrorModal, SmthWrongModal} from "./other/Modals";
import Carousel, {arrowsPlugin} from '@brainhubeu/react-carousel';
import '@brainhubeu/react-carousel/lib/style.css';
import {LeftArrow, RightArrow} from "./utils/Arrows";
import Header from './other/Header'

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
                projectName: 'project_test',
                expName: 'exp_1',
            },
            numGpus: -1,
            cantGetGpus: false,
            data: {
                common: {
                    datasetFolder: "/Users/a18277818/Documents/ДИПЛОМ/grad_project_2021/projects/datasets/dogscats",
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
            },
            view: {
                missingMessage: '',
                missingValue: '',
                carouselIndex: 0,
                error: null
            },
            server: {
                remote: false,
                creds: {
                    host: 'localhost',
                    port: null,
                }
            }
        };

        this.changeTaskChoice = this.changeTaskChoice.bind(this);
        this.changeSubTaskChoice = this.changeSubTaskChoice.bind(this);
        this.changeProjectName = this.changeProjectName.bind(this);
        this.changeExpName = this.changeExpName.bind(this);
        this.handleCarouselChange = this.handleCarouselChange.bind(this);
    }

    handleCarouselChange(value) {
        let ok = true
        if (value === 0) {
            if (this.state.general.projectName === '') {
                this.setState(state => {
                    state.view.missingMessage = 'Please enter project name.'
                    return state
                })
                ok = false
            } else if (this.state.general.expName === '') {
                this.setState(state => {
                    state.view.missingMessage = 'Please enter experiment name.'
                    return state
                })
                ok = false
            }
        } else if (value === 1) {
            if (this.state.data.common.datasetFolder === '') {
                this.setState(state => {
                    state.view.missingMessage = 'Please choose dataset folder.'
                    return state
                })
                ok = false
            } else if (this.state.data.taskSpecific.transformsTrain === 'not valid') {
                this.setState(state => {
                    state.view.missingMessage = 'Please enter the valid YAML for train transforms.'
                    return state
                })
                ok = false
            }
        } else if (value === 3) {
            if ('notValid' in this.state.training.common.optimizer.paramsAdd) {
                this.setState(state => {
                    state.view.missingMessage = 'Please enter the valid YAML for optimizer params.'
                    return state
                })
                ok = false
            }
        }
        if (ok) {
            this.setState(state => {
                state.view.carouselIndex = value;
                return state
            })
        }
    }

    changeTaskChoice(event) {
        if (this.state.general.pushedSubTask) {
            this.setState(state => {
                state.view.missingMessage = 'Are you sure you want to change task? Some settings may be lost.'
                state.view.missingValue = event.target.value
                return state
            })
        } else {
            this.setState(state => {
                state.general.task = event.target.value;
                state.general.pushedTask = true;
                state.general.pushedSubTask = false;
                state.general.subTask = ''
                return state
            })
        }
    }

    changeSubTaskChoice(event) {
        if (this.state.general.pushedSubTask) {
            this.setState(state => {
                state.view.missingMessage = 'Are you sure you want to change subtask? Some settings may be lost.'
                state.view.missingValue = event.target.value
                return state
            })
        } else {
            this.setState(state => {
                state.general.subTask = event.target.value;
                state.general.pushedSubTask = true;
                return state
            })
        }

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
        let config = makeConfigFromState(this.state)
        let loadConfig = makeLoadConfigFromState(this.state)
        ipcRenderer.send('runTraining', {
            config: config,
            loadConfig: loadConfig
        });
        console.log(config);
    }

    stopTraining() {
        console.log('Stopping training!')
        ipcRenderer.send('stopTraining');
    }

    stopTrainingFromLogs() {
        this.setState(state => {
            state.run.training = false;
            return state
        })
    }

    hideMissingModal(value = '') {
        this.setState(state => {
            state.view.missingMessage = ''
            state.view.missingValue = ''
            if (value !== '') {
                if (['cv', 'nlp'].includes(value)) {
                    state.general.task = value;
                    state.general.pushedTask = true;
                    state.general.pushedSubTask = false;
                    state.general.subTask = ''
                } else {
                    state.general.subTask = value;
                    state.general.pushedSubTask = true;
                }
                for (const key of Object.keys(state.view)) {
                    if (key.includes('view')) {
                        state.view[key] = false
                    }
                }
            }
            return state
        })
    }

    loadParamsFromConfig(config) {
        let newState = {...this.state, ...config}
        newState.view.carouselIndex = this.state.view.carouselIndex
        newState.training = this.state.training
        this.setState((state) => {
            return newState
        }, () => {
            this.forceUpdate()
        })
    }

    hideErrorModal() {
        this.setState(state => {
            state.view.error = null
            return state
        })
    }

    onHideLocalToRemoteModal(data = null) {
        if (data !== null && data.status === 'connected') {
            ipcRenderer.send('changeToRemote', {host: data.host, port: data.port});
            this.setState(state => {
                state.numGpus = -1
                state.cantGetGpus = false
                state.server.remote = true;
                state.server.creds.host = data.host;
                state.server.creds.port = data.port;
                return state
            })
        }
    }

    onHideRemoteToLocalModal(changeToLocal = false) {
        if (changeToLocal) {
            this.setState(state => {
                state.numGpus = -1
                state.cantGetGpus = false
                return state
            })
            ipcRenderer.send('startNewPython');
        }
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        if (this.state.server.creds.port === null) {
            ipcRenderer.send('getPythonPort');
        }
        if (this.state.numGpus === -1 && this.state.view.error === null && !this.state.cantGetGpus) {
            ipcRenderer.send('getNumGpus');
        }
    }

    componentDidMount() {
        if (this.state.numGpus === -1) {
            ipcRenderer.send('getNumGpus');
        }
        if (this.state.server.creds.port === null) {
            ipcRenderer.send('getPythonPort');
        }

        ipcRenderer.on('gotNumGpus', function (e, data) {
            // console.log(data.numGpus)
            this.setState(state => {
                state.numGpus = data.numGpus
                state.cantGetGpus = false
                return state;
            })
        }.bind(this));

        ipcRenderer.on('trainingStopped', function () {
            this.setState(state => {
                state.run.training = false;
                return state
            })
        }.bind(this));

        ipcRenderer.on('netError', function (e, data) {
            this.setState(state => {
                state.view.error = data;
                if ('noTrain' in data) {
                    state.run.training = false
                }
                if (data.message.includes('GPU')) {
                    state.cantGetGpus = true
                }
                return state
            })
        }.bind(this))

        ipcRenderer.on('startedNewPython', function (e, data) {
            this.setState(state => {
                state.server.remote = false;
                state.server.creds.host = 'localhost';
                state.server.creds.port = data.port;
                return state
            })
        }.bind(this));

        ipcRenderer.on('pythonPort', function (e, data) {
            if (data.port) {
                this.setState(state => {
                    state.server.creds.port = data.port;
                    return state
                })
            }
        }.bind(this));
    }

    render() {
        if (this.state.port === -1) {
            return null
        }
        let emptyTag = <div style={{width: '60px'}}></div>
        let hideRight = !this.state.general.pushedTask || !this.state.general.pushedSubTask
            || this.state.general.projectName === '' || this.state.general.expName === ''
        let arrows = {
            resolve: arrowsPlugin,
            options: {
                arrowLeft: <LeftArrow/>,
                arrowLeftDisabled: emptyTag,
                arrowRight: hideRight ? emptyTag : <RightArrow/>,
                arrowRightDisabled: emptyTag,
                addArrowClickHandler: true,
            }
        }
        return (
            <div>
                <div>
                    <Header onHideLocalToRemoteModal={this.onHideLocalToRemoteModal.bind(this)}
                            onHideRemoteToLocalModal={this.onHideRemoteToLocalModal.bind(this)}
                            remoteToLocal={this.state.server.remote}
                            loadParamsFromConfig={this.loadParamsFromConfig.bind(this)}/>
                </div>
                <Row className="align-items-center" style={{minHeight: '95vh'}}>
                    <Col>
                        <div className="Main">
                            <Carousel value={this.state.view.carouselIndex}
                                      onChange={this.handleCarouselChange}
                                      plugins={this.state.general.pushedTask ? [arrows] : []}
                                      draggable={false}>
                                <div>
                                    <div>
                                        {ChooseMainTask({
                                            changeTaskChoice: this.changeTaskChoice,
                                            ...this.state.general
                                        })}
                                    </div>
                                    <Collapse in={this.state.general.pushedTask}>
                                        <div>
                                            {ChooseSubTask({
                                                changeSubTaskChoice: this.changeSubTaskChoice,
                                                ...this.state.general
                                            })}
                                        </div>
                                    </Collapse>
                                    <Collapse in={this.state.general.pushedSubTask}>
                                        <div>
                                            {ChooseNames({
                                                changeProjectName: this.changeProjectName,
                                                changeExpName: this.changeExpName,
                                                ...this.state.general
                                            })}
                                        </div>
                                    </Collapse>
                                </div>
                                <DataSettings showAdvanced={this.state.view.carouselIndex === 3}
                                              showFull={this.state.general.pushedSubTask}
                                              taskSubClass={this.state.general.subTask}
                                              data={this.state.data}
                                              type={'data'}
                                              setCommonState={this.setCommonState.bind(this)}
                                              setTaskSpecificState={this.setTaskSpecificState.bind(this)}
                                              clearTaskSpecificState={this.clearTaskSpecificState.bind(this)}
                                              remote={this.state.server.remote}/>
                                <ModelSettings showFull={this.state.general.pushedSubTask}
                                               taskSubClass={this.state.general.subTask}
                                               data={this.state.model}
                                               type={'model'}
                                               setCommonState={this.setCommonState.bind(this)}
                                               setTaskSpecificState={this.setTaskSpecificState.bind(this)}
                                               clearTaskSpecificState={this.clearTaskSpecificState.bind(this)}/>
                                <TrainingSettings showAdvanced={this.state.view.carouselIndex === 5}
                                                  showFull={this.state.general.pushedSubTask}
                                                  taskSubClass={this.state.general.subTask}
                                                  numGpus={this.state.numGpus}
                                                  data={this.state.training}
                                                  type={'training'}
                                                  setCommonState={this.setCommonState.bind(this)}
                                                  setTaskSpecificState={this.setTaskSpecificState.bind(this)}
                                                  clearTaskSpecificState={this.clearTaskSpecificState.bind(this)}/>
                                <div hidden={!this.state.general.pushedSubTask} align={'center'}>
                                    <h3>Run</h3>
                                    <div>
                                        <Row style={{marginTop: "10px"}} align={'center'}>
                                            <Col>
                                                <TrainButtons show={this.state.general.pushedSubTask}
                                                              training={this.state.run.training}
                                                              runTraining={this.runTraining.bind(this)}
                                                              stopTraining={this.stopTraining.bind(this)}/>
                                            </Col>
                                        </Row>
                                        <TextLog show={this.state.general.pushedSubTask}
                                                 stopTraining={this.stopTrainingFromLogs.bind(this)}
                                                 host={this.state.server.creds.host}
                                                 port={this.state.server.creds.port}/>
                                    </div>
                                </div>
                            </Carousel>
                            {/* MODALS */}
                            <SmthWrongModal
                                show={this.state.view.missingMessage !== ''}
                                onHide={this.hideMissingModal.bind(this)}
                                message={this.state.view.missingMessage}
                                value={this.state.view.missingValue}
                            />
                            <ErrorModal onHide={this.hideErrorModal.bind(this)}
                                        show={this.state.view.error !== null}
                                        value={this.state.view.error}/>
                        </div>
                    </Col>
                </Row>
            </div>
        );
    }
}

export default Main;
