import React, {Component} from 'react';
import {Col, Row} from "react-bootstrap";
import {ChooseMainTask, ChooseNames, ChooseSubTask} from "./settings/GeneralSettings";
import DataSettings from "./settings/data/DataSettings"
import ModelSettings from "./settings/model/ModelSettings";
import TrainingSettings from "./settings/training/TrainingSettings";
import {TBButtons, TrainButtons} from "./Launching";
import {TextLog} from "./settings/Common";
import {makeConfigFromState, validateConfig} from "./utils/configSettings";
import {ExportModal, NameMissingModal} from "./Modals";
import Carousel, {arrowsPlugin} from '@brainhubeu/react-carousel';
import '@brainhubeu/react-carousel/lib/style.css';
import {LeftArrow, RightArrow} from "./utils/Arrows";

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
                viewExport: false,
                missingMessage: '',
                missingValue: '',
                carouselIndex: 0
            }
        };

        this.changeTaskChoice = this.changeTaskChoice.bind(this);
        this.changeSubTaskChoice = this.changeSubTaskChoice.bind(this);
        this.changeProjectName = this.changeProjectName.bind(this);
        this.changeExpName = this.changeExpName.bind(this);
        this.changeView = this.changeView.bind(this);
        this.handleCarouselChange = this.handleCarouselChange.bind(this);
    }

    handleCarouselChange(value) {
        let ok = true
        if (value === 3) {
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
        } else if (value === 4) {
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
        } else if (value === 6) {
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
                for (const key of Object.keys(state.view)) {
                    if (key.includes('view')) {
                        state.view[key] = false
                    }
                }
                state.view.carouselIndex = 1
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
                for (const key of Object.keys(state.view)) {
                    if (key.includes('view')) {
                        state.view[key] = false
                    }
                }
                state.view.carouselIndex = 2
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

    changeView(viewKey) {
        function cap(string) {
            return string.charAt(0).toUpperCase() + string.slice(1);
        }

        viewKey = cap(viewKey)
        this.setState(state => {
            let key1 = 'view' + viewKey
            state.view[key1] = !state.view[key1]
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

    stopTrainingFromLogs() {
        this.setState(state => {
            state.run.training = false;
            return state
        })
    }

    setShowExport(value) {
        this.setState(state => {
            state.view.viewExport = value
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
                    state.view.carouselIndex = 1
                } else {
                    state.general.subTask = value;
                    state.general.pushedSubTask = true;
                    state.view.carouselIndex = 2
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
        let arrows = {
            resolve: arrowsPlugin,
            options: {
                arrowLeft: <LeftArrow/>,
                arrowLeftDisabled: <div style={{width: '60px'}}></div>,
                arrowRight: <RightArrow/>,
                arrowRightDisabled: <div style={{width: '60px'}}></div>,
                addArrowClickHandler: true,
            }
        }
        return (
            <Row className="align-items-center" style={{minHeight: '100vh'}}>
                <Col>
                    <div className="Main">
                        <header className="main">
                            {/*<div align={'center'}>*/}
                            {/*    <Button variant="primary" onClick={() => this.setShowExport(true)}>*/}
                            {/*        Export*/}
                            {/*    </Button>*/}
                            {/*</div>*/}
                            <Carousel value={this.state.view.carouselIndex}
                                      onChange={this.handleCarouselChange}
                                      plugins={this.state.general.pushedSubTask ? [arrows] : []}
                                      draggable={false}>
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
                                <DataSettings showContent={true}
                                              showFull={this.state.general.pushedSubTask}
                                              taskSubClass={this.state.general.subTask}
                                              changeView={this.changeView}
                                              data={this.state.data}
                                              type={'data'}
                                              setCommonState={this.setCommonState.bind(this)}
                                              setTaskSpecificState={this.setTaskSpecificState.bind(this)}
                                              clearTaskSpecificState={this.clearTaskSpecificState.bind(this)}/>
                                <ModelSettings showContent={true}
                                               showFull={this.state.general.pushedSubTask}
                                               taskSubClass={this.state.general.subTask}
                                               changeView={this.changeView}
                                               data={this.state.model}
                                               type={'model'}
                                               setCommonState={this.setCommonState.bind(this)}
                                               setTaskSpecificState={this.setTaskSpecificState.bind(this)}
                                               clearTaskSpecificState={this.clearTaskSpecificState.bind(this)}/>
                                <TrainingSettings showContent={true}
                                                  showFull={this.state.general.pushedSubTask}
                                                  taskSubClass={this.state.general.subTask}
                                                  changeView={this.changeView}
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
                                        <Row style={{marginTop: "10px"}} align={'center'}>
                                            <Col>
                                                <TBButtons show={this.state.general.pushedSubTask}/>
                                            </Col>
                                        </Row>
                                        <TextLog show={this.state.general.pushedSubTask}
                                                 stopTraining={this.stopTrainingFromLogs.bind(this)}/>
                                    </div>
                                </div>
                            </Carousel>

                            <ExportModal
                                show={this.state.view.viewExport}
                                onHide={() => this.setShowExport(false)}
                            />
                            <NameMissingModal
                                show={this.state.view.missingMessage !== ''}
                                onHide={this.hideMissingModal.bind(this)}
                                message={this.state.view.missingMessage}
                                value={this.state.view.missingValue}
                            />
                        </header>
                    </div>
                </Col>
            </Row>
        );
    }
}

export default Main;
