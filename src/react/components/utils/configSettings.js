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
        data: {},
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
    // ADVANCED
    config.general.project_name = 'project_test'
    config.general.exp_name = 'exp_1'
    config.data.dataset_folder = '/Users/a18277818/Documents/ДИПЛОМ/grad_project_2021/projects/datasets/dogscats'
    return config
}

export function validateConfig(config) {
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