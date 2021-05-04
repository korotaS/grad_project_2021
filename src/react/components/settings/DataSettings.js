import React, {Component} from 'react';

class DataSettings extends Component {
    constructor(props) {
        super(props);
        this.state = {
            commonSettings: {
                datasetFolder: '',
                trainLen: -1,
                valLen: -1
            },
            taskSpecificSettings: {},
        }
    }

    render() {
        if (!this.props.show) {
            return null
        }
        let dataSpecificSettings;
        if (this.props.taskSubClass === 'imclf') {
            dataSpecificSettings = <DataSettingsForImclf/>
        } else if (this.props.taskSubClass === 'imsgm') {
            dataSpecificSettings = <DataSettingsForImsgm/>
        } else {
            dataSpecificSettings = <DataSettingsForTxtclf/>
        }
        return (
            <div align={'center'}>
                <div>{'DATA COMMON'}</div>
                {dataSpecificSettings}
            </div>
        )
    }
}

class DataSettingsForImclf extends DataSettings {
    render() {
        return (
            <div>DATA IMCLF</div>
        )
    }
}

class DataSettingsForImsgm extends DataSettings {
    render() {
        return (
            <div>DATA IMSGM</div>
        )
    }
}

class DataSettingsForTxtclf extends DataSettings {
    render() {
        return (
            <div>DATA TXTCLF</div>
        )
    }
}

export default DataSettings;