import React, {Component} from 'react';

class TrainingSettings extends Component {
    constructor(props) {
        super(props);
        this.state = {
            commonSettings: {},
            taskSpecificSettings: {},
        }
    }

    render() {
        if (!this.props.show) {
            return null
        }
        let dataSpecificSettings;
        if (this.props.taskSubClass === 'imclf') {
            dataSpecificSettings = <TrainingSettingsForImclf/>
        } else if (this.props.taskSubClass === 'imsgm') {
            dataSpecificSettings = <TrainingSettingsForImsgm/>
        } else {
            dataSpecificSettings = <TrainingSettingsForTxtclf/>
        }
        return (
            <div align={'center'}>
                <div>{'TRAINING COMMON'}</div>
                {dataSpecificSettings}
            </div>
        )
    }
}

class TrainingSettingsForImclf extends TrainingSettings {
    render() {
        return (
            <div>TRAINING IMCLF</div>
        )
    }
}

class TrainingSettingsForImsgm extends TrainingSettings {
    render() {
        return (
            <div>TRAINING IMSGM</div>
        )
    }
}

class TrainingSettingsForTxtclf extends TrainingSettings {
    render() {
        return (
            <div>TRAINING TXTCLF</div>
        )
    }
}

export default TrainingSettings;