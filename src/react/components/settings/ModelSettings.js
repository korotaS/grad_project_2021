import React, {Component} from 'react';

class ModelSettings extends Component {
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
            dataSpecificSettings = <ModelSettingsForImclf/>
        } else if (this.props.taskSubClass === 'imsgm') {
            dataSpecificSettings = <ModelSettingsForImsgm/>
        } else {
            dataSpecificSettings = <ModelSettingsForTxtclf/>
        }
        return (
            <div align={'center'}>
                <div>{'MODEL COMMON'}</div>
                {dataSpecificSettings}
            </div>
        )
    }
}

class ModelSettingsForImclf extends ModelSettings {
    render() {
        return (
            <div>MODEL IMCLF</div>
        )
    }
}

class ModelSettingsForImsgm extends ModelSettings {
    render() {
        return (
            <div>MODEL IMSGM</div>
        )
    }
}

class ModelSettingsForTxtclf extends ModelSettings {
    render() {
        return (
            <div>MODEL TXTCLF</div>
        )
    }
}

export default ModelSettings;