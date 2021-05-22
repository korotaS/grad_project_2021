export function makeConfigFromState(state) {
    const camelToSnakeCase = str => str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);

    let cc = state.training.common.checkpointCallback;
    let config = {
        general: {
            task: state.general.task,
            subtask: state.general.subTask,
            project_name: state.general.projectName,
            exp_name: state.general.expName
        },
        data: {
            dataset_folder: state.data.common.datasetFolder
        },
        model: {},
        trainer: {},
        training: {},
        optimizer: {
            name: state.training.common.optimizer.name,
            params: {
                lr: state.training.common.optimizer.params.lr,
                ...state.training.common.optimizer.paramsAdd
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
            for (const [innerKey, value] of Object.entries(state[key][mode])) {
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
    return config
}

export function makeLoadConfigFromState(state) {
    return {
        general: state.general,
        data: state.data,
        model: state.model,
        training: state.training,
        view: state.view
    }
}