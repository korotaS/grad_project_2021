import React, {Component} from 'react';
import {ModelSettingsForImclf, ModelSettingsForImsgm, ModelSettingsForTxtclf} from "./TaskSpecific";
import {Button} from "react-bootstrap";

class ModelSettings extends Component {
    render() {
        if (!this.props.showFull) {
            return null
        }
        let taskSpecificSettings;
        if (this.props.taskSubClass === 'imclf') {
            taskSpecificSettings = <ModelSettingsForImclf handleTaskSpecificState={this.props.setTaskSpecificState}
                                                          clearTaskSpecificState={this.props.clearTaskSpecificState}
                                                          defaultState={this.props.data.taskSpecificCache}
                                                          type={this.props.type}/>
        } else if (this.props.taskSubClass === 'imsgm') {
            taskSpecificSettings = <ModelSettingsForImsgm handleTaskSpecificState={this.props.setTaskSpecificState}
                                                          clearTaskSpecificState={this.props.clearTaskSpecificState}
                                                          defaultState={this.props.data.taskSpecificCache}
                                                          type={this.props.type}/>
        } else {
            taskSpecificSettings = <ModelSettingsForTxtclf handleTaskSpecificState={this.props.setTaskSpecificState}
                                                           clearTaskSpecificState={this.props.clearTaskSpecificState}
                                                           defaultState={this.props.data.taskSpecificCache}
                                                           type={this.props.type}/>
        }
        return (
            <div align={'center'}>
                <Button style={{marginTop: '10px'}}
                        variant="outline-secondary"
                        onClick={() => {
                            this.props.changeView('model', 'model', false);
                        }}
                        size={'lg'}
                >{'Model ' + (this.props.showContent ? '▲' : '▼')}</Button>
                <div hidden={!this.props.showContent}>
                    {taskSpecificSettings}
                </div>
            </div>
        )
    }
}

export default ModelSettings;