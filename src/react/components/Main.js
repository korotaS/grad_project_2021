import React, {Component} from 'react';
import {Button, Col, Row} from "react-bootstrap";
import {ChooseMainTask, ChooseNames, ChooseSubTask} from "./settings/GeneralSettings";
import DataSettings from "./settings/DataSettings"
import ModelSettings from "./settings/ModelSettings";
import TrainingSettings from "./settings/TrainingSettings";

const {set, get} = require('lodash');
const {ipcRenderer} = window.require("electron");

class Main extends Component {
    constructor(props) {
        super(props);
        this.state = {
            task: '',
            pushedTask: false,
            subTask: '',
            pushedSubTask: false,
            projectName: '',
            expName: '',
            text: '',
            numGpus: -1,

            data: {
                common: {
                    datasetFolder: "",
                    trainLen: -1,
                    valLen: -1,
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
                        }
                    }
                },
                taskSpecific: {},
                taskSpecificCache: {}
            }
        };

        this.submitChoice = this.submitChoice.bind(this);
        this.changeTaskChoice = this.changeTaskChoice.bind(this);
        this.changeSubTaskChoice = this.changeSubTaskChoice.bind(this);
        this.changeProjectName = this.changeProjectName.bind(this);
        this.changeExpName = this.changeExpName.bind(this);
        // this.clearLogs = this.clearLogs.bind(this);

        // this.textLog = React.createRef();
        // const socket = openSocket(`http://localhost:5000`);
        //
        // socket.on('message', message => {
        //     console.log(message);
        // })
        //
        // socket.on('log', data => {
        //     console.log(data);
        //     this.setState(state => {
        //         if (data.toString().trim().length > 0) {
        //             let prefix = state.text === '' ? '' : '\n'
        //             state.text += prefix + data.toString().trim();
        //         }
        //         return state
        //     });
        // })
    }

    submitChoice(event) {
        // event.preventDefault();
        // this.setState(state => {
        //     state.pushed = true;
        //     return state
        // });
    }

    // clearLogs(event) {
    //     event.preventDefault();
    //     this.setState(state => {
    //         state.text = '';
    //         return state
    //     });
    // }

    changeTaskChoice(event) {
        this.setState(state => {
            state.task = event.target.value;
            state.pushedTask = true;
            state.pushedSubTask = false;
            state.subTask = ''
            return state
        })
    }

    changeSubTaskChoice(event) {
        this.setState(state => {
            state.subTask = event.target.value;
            state.pushedSubTask = true;
            return state
        })
    }

    changeProjectName(event) {
        let value = event.target.value;
        this.setState(state => {
            state.projectName = value;
            return state
        })
    }

    changeExpName(event) {
        let value = event.target.value;
        this.setState(state => {
            state.expName = value;
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
    }

    componentDidUpdate() {
        // this.textLog.current.scrollTop = this.textLog.current.scrollHeight;
    }

    render() {
        if (this.state.port === -1) {
            return null
        }
        const textAreaStyle = {
            height: '300px',
            minHeight: '300px',
            width: '100%',
            fontSize: '15px',
            marginTop: '10px',
        }
        return (
            <div className="Main">
                <header className="main">

                    {/* THIS IS LOGGING!!! */}
                    {/*<Form style={{marginLeft: '10px', marginRight: '10px'}}>*/}
                    {/*<textarea ref={this.textLog}*/}
                    {/*          value={this.state.text}*/}
                    {/*          readOnly={true}*/}
                    {/*          style={textAreaStyle}/>*/}
                    {/*    <Button*/}
                    {/*        variant="success"*/}
                    {/*        type="submit"*/}
                    {/*        onClick={this.clearLogs}*/}
                    {/*        // style={{marginLeft: '10px'}}*/}
                    {/*    >Clear logs</Button>*/}
                    {/*</Form>*/}

                    {ChooseMainTask({
                        changeTaskChoice: this.changeTaskChoice,
                        ...this.state
                    })}
                    {ChooseSubTask({
                        changeSubTaskChoice: this.changeSubTaskChoice,
                        ...this.state
                    })}
                    {ChooseNames({
                        changeProjectName: this.changeProjectName,
                        changeExpName: this.changeExpName,
                        ...this.state
                    })}
                    <Row style={{marginTop: "10px"}}>
                        <Col>
                            <DataSettings show={this.state.pushedSubTask}
                                          taskSubClass={this.state.subTask}
                                          data={this.state.data}
                                          type={'data'}
                                          setCommonState={this.setCommonState.bind(this)}
                                          setTaskSpecificState={this.setTaskSpecificState.bind(this)}
                                          clearTaskSpecificState={this.clearTaskSpecificState.bind(this)}/>
                        </Col>
                        <Col>
                            <ModelSettings show={this.state.pushedSubTask}
                                           taskSubClass={this.state.subTask}
                                           data={this.state.model}
                                           type={'model'}
                                           setCommonState={this.setCommonState.bind(this)}
                                           setTaskSpecificState={this.setTaskSpecificState.bind(this)}
                                           clearTaskSpecificState={this.clearTaskSpecificState.bind(this)}/>
                        </Col>
                        <Col>
                            <TrainingSettings show={this.state.pushedSubTask}
                                              taskSubClass={this.state.subTask}
                                              numGpus={this.state.numGpus}
                                              data={this.state.training}
                                              type={'training'}
                                              setCommonState={this.setCommonState.bind(this)}
                                              setTaskSpecificState={this.setTaskSpecificState.bind(this)}
                                              clearTaskSpecificState={this.clearTaskSpecificState.bind(this)}/>
                        </Col>
                    </Row>
                    {/*<Button*/}
                    {/*    variant="success" type="submit" style={{marginTop: '10px'}} onClick={() => {*/}
                    {/*    console.log(this.state)*/}
                    {/*}}*/}
                    {/*>Submit</Button>*/}
                </header>
            </div>
        );
    }
}

export default Main;
