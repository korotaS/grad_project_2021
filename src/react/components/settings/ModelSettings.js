import React, {Component} from 'react';
import {Button, Col, Form, Row} from "react-bootstrap";
import {Numeric} from "./Common";

class ModelSettings extends Component {
    constructor(props) {
        super(props);
        this.state = {
            commonSettings: {},
            taskSpecificSettings: {},
            // additional stuff
            taskSpecificCache: {}
        }

        this.handleTaskSpecificState = this.handleTaskSpecificState.bind(this);
        this.clearTaskSpecificState = this.clearTaskSpecificState.bind(this);
    }

    clearTaskSpecificState() {
        this.setState(state => {
            state.taskSpecificSettings = {};
            return state
        })
    }

    handleTaskSpecificState(key, value) {
        this.setState(state => {
            state.taskSpecificSettings[key] = value;
            state.taskSpecificCache[key] = value;
            return state
        })
    }

    render() {
        if (!this.props.show) {
            return null
        }
        let dataSpecificSettings;
        if (this.props.taskSubClass === 'imclf') {
            dataSpecificSettings = <ModelSettingsForImclf
                handleTaskSpecificState={this.handleTaskSpecificState}
                clearTaskSpecificState={this.clearTaskSpecificState}
                defaultState={this.state.taskSpecificCache}/>
        } else if (this.props.taskSubClass === 'imsgm') {
            dataSpecificSettings = <ModelSettingsForImsgm
                handleTaskSpecificState={this.handleTaskSpecificState}
                clearTaskSpecificState={this.clearTaskSpecificState}
                defaultState={this.state.taskSpecificCache}/>
        } else {
            dataSpecificSettings = <ModelSettingsForTxtclf
                handleTaskSpecificState={this.handleTaskSpecificState}
                clearTaskSpecificState={this.clearTaskSpecificState}
                defaultState={this.state.taskSpecificCache}/>
        }
        return (
            <div align={'center'}>
                <h3>Model</h3>
                {dataSpecificSettings}
                <Button
                    variant="success" type="submit" style={{marginTop: '10px'}} onClick={() => {
                    console.log(this.state)
                }}
                >Submit</Button>
            </div>
        )
    }
}

class ModelSettingsForImclf extends Component {
    constructor(props) {
        super(props)

        this.state = {
            architectures: {
                mobilenet_v2: 'MobileNetV2',
                resnet18: 'ResNet-18',
                resnet50: 'ResNet-50',
                resnet152: 'ResNet-152',
                alexnet: 'AlexNet',
                vgg16: 'VGG16',
                resnext50_32x4d: 'ResNeXt-50_32x4d',
                resnext101_32x8d: 'ResNeXt-101_32x8d'
            },

            architecture: props.architecture || 'mobilenet_v2',
            freezeBackbone: props.defaultState.freezeBackbone || false,
            pretrained: props.defaultState.pretrained || true
        }

        this.props.clearTaskSpecificState();
        for (const [key, value] of Object.entries(this.state)) {
            if (key !== 'architectures') {
                this.props.handleTaskSpecificState(key, value)
            }
        }
    }

    handleSelectChange(event) {
        let value = event.target.value;
        this.props.handleTaskSpecificState('architecture', value)
        this.setState(state => {
            state.architecture = value
            return state
        })
    }

    handleFreezeCheckbox(event) {
        this.props.handleTaskSpecificState('freezeBackbone', event.target.checked)
        this.setState(state => {
            state.freezeBackbone = event.target.checked
            return state
        })
    }

    handlePretrainedCheckbox(event) {
        this.props.handleTaskSpecificState('pretrained', event.target.checked)
        this.setState(state => {
            state.pretrained = event.target.checked
            return state
        })
    }

    render() {
        return (
            <div>
                <h5>Architecture</h5>
                <Form.Control as="select" custom style={{width: '75%'}}
                              onChange={this.handleSelectChange.bind(this)}>
                    {Object.entries(this.state.architectures).map(([archKey, archName]) => {
                        return (
                            <option key={archKey} value={archKey}>{archName}</option>
                        )
                    })}
                </Form.Control>
                <h5>Freeze backbone</h5>
                <Form.Check
                    type={'checkbox'} label={'Freeze'} checked={this.state.freezeBackbone}
                    onChange={(event) => {
                        event.persist();
                        this.handleFreezeCheckbox(event)
                    }}
                />
                <h5>Pretrained</h5>
                <Form.Check
                    type={'checkbox'} label={'Pretrained'} checked={this.state.pretrained}
                    onChange={(event) => {
                        event.persist();
                        this.handlePretrainedCheckbox(event)
                    }}
                />
            </div>
        )
    }
}

class ModelSettingsForImsgm extends Component {
    constructor(props) {
        super(props)

        this.state = {
            architectures: ['Unet', 'Unet++', 'FPN', 'PAN', 'DeepLabV3'],
            backbones: {
                mobilenet_v2: 'MobileNetV2',
                resnet18: 'ResNet-18',
                resnet50: 'ResNet-50',
                resnet152: 'ResNet-152',
                vgg16: 'VGG16',
                inceptionv4: 'InceptionV4',
                resnext50_32x4d: 'ResNeXt-50_32x4d',
                resnext101_32x8d: 'ResNeXt-101_32x8d'
            },

            architecture: props.architecture || 'Unet',
            backbone: props.defaultState.backbone || 'mobilenet_v2',
            pretrained: props.defaultState.pretrained || true
        }

        this.props.clearTaskSpecificState();
        for (const [key, value] of Object.entries(this.state)) {
            if (key !== 'architectures' && key !== 'backbones') {
                this.props.handleTaskSpecificState(key, value)
            }
        }
    }

    handleArchChange(event) {
        let value = event.target.value;
        this.props.handleTaskSpecificState('architecture', value)
        this.setState(state => {
            state.architecture = value
            return state
        })
    }

    handleBackboneChange(event) {
        let value = event.target.value;
        this.props.handleTaskSpecificState('backbone', value)
        this.setState(state => {
            state.backbone = value
            return state
        })
    }

    handlePretrainedCheckbox(event) {
        this.props.handleTaskSpecificState('pretrained', event.target.checked)
        this.setState(state => {
            state.pretrained = event.target.checked
            return state
        })
    }

    render() {
        return (
            <div>
                <h5>Architecture</h5>
                <Form.Control as="select" custom style={{width: '75%'}}
                              onChange={this.handleArchChange.bind(this)}>
                    {this.state.architectures.map((obj, index) => {
                        return (
                            <option key={index} value={obj}>{obj}</option>
                        )
                    })}
                </Form.Control>
                <h5>Backbone</h5>
                <Form.Control as="select" custom style={{width: '75%'}}
                              onChange={this.handleBackboneChange.bind(this)}>
                    {Object.entries(this.state.backbones).map(([backboneKey, backboneName]) => {
                        return (
                            <option key={backboneKey} value={backboneKey}>{backboneName}</option>
                        )
                    })}
                </Form.Control>
                <h5>Pretrained</h5>
                <Form.Check
                    type={'checkbox'} label={'Pretrained'} checked={this.state.pretrained}
                    onChange={(event) => {
                        event.persist();
                        this.handlePretrainedCheckbox(event)
                    }}
                />
            </div>
        )
    }
}

class ModelSettingsForTxtclf extends Component {
    constructor(props) {
        super(props)

        let curr_lang = props.defaultState.lang || 'en';
        let curr_embeddings = props.defaultState.embeddings || curr_lang === 'ru' ? 'ru_fasttext_300' : 'en_glove-wiki-gigaword-50'

        this.state = {
            modelNames: ['distilbert-base-uncased', 'bert-base-uncased'],
            embeddingNames: [
                'en_glove-wiki-gigaword-50', 'en_glove-wiki-gigaword-100', 'en_glove-wiki-gigaword-200',
                'en_glove-wiki-gigaword-300', 'en_glove-twitter-25', 'ru_fasttext_300', 'en_fasttext_300'
            ],

            modelType: props.modelType || 'lstm',
            lang: curr_lang,
            nHidden: props.defaultState.nHidden || '128',
            modelName: props.defaultState.modelName || 'distilbert-base-uncased',
            embeddings: curr_embeddings
        }

        this.props.clearTaskSpecificState();
        for (const [key, value] of Object.entries(this.state)) {
            if (key !== 'modelNames' && key !== 'embeddingNames') {
                this.props.handleTaskSpecificState(key, value)
            }
        }
    }

    handleModelTypeChange(event) {
        let value = event.target.value
        this.props.handleTaskSpecificState('modelType', event.target.value)
        this.setState(state => {
            state.modelType = value;
            return state
        })
    }

    handleLangChange(event) {
        let lang = event.target.value;
        // change embeddings with language
        let curr_embeddings = lang === 'ru' ? 'ru_fasttext_300' : 'en_glove-wiki-gigaword-50'
        this.handleEmbeddingsChange(null, curr_embeddings)

        this.props.handleTaskSpecificState('lang', lang)
        this.setState(state => {
            state.lang = lang
            return state
        })
    }

    handleModelNameChange(event) {
        let value = event.target.value;
        this.props.handleTaskSpecificState('modelName', value)
        this.setState(state => {
            state.modelName = value
            return state
        })
    }

    handleEmbeddingsChange(event, fromValue = null) {
        let value;
        if (fromValue !== null) {
            value = fromValue
        } else {
            value = event.target.value;
        }
        this.props.handleTaskSpecificState('embeddings', value)
        this.setState(state => {
            state.embeddings = value
            return state
        })
    }

    render() {
        let variableModelSettings;
        if (this.state.modelType === 'lstm') {
            variableModelSettings = (
                <div>
                    <h5>Number of hidden units</h5>
                    <Numeric value={this.state.nHidden} nameKey={'nHidden'}
                             passData={this.props.handleTaskSpecificState} max={2048}/>
                    <h5>Embeddings</h5>
                    <Form.Control as="select" custom style={{width: '75%'}}
                                  onChange={this.handleEmbeddingsChange.bind(this)}>
                        {this.state.embeddingNames.map((obj, index) => {
                            if ((this.state.lang === 'en' && obj.includes('en')) ||
                                (this.state.lang === 'ru' && obj.includes('ru'))) {
                                return (
                                    <option key={index} value={obj}>{obj}</option>
                                )
                            }
                            return null
                        })}
                    </Form.Control>
                </div>
            )
        } else {
            variableModelSettings = (
                <div>
                    <h5>Model name</h5>
                    <Form.Control as="select" custom style={{width: '75%'}}
                                  onChange={this.handleModelNameChange.bind(this)}>
                        {this.state.modelNames.map((obj, index) => {
                            return (
                                <option key={index} value={obj}>{obj}</option>
                            )
                        })}
                    </Form.Control>
                </div>
            )
        }
        return (
            <div>
                <h5>Model type</h5>
                <Row className="justify-content-md-center">
                    <Col xs="auto">
                        <Form.Check
                            type={'radio'} label={'LSTM'}
                            value={'lstm'} checked={this.state.modelType === 'lstm'}
                            onChange={(event) => {
                                event.persist();
                                this.handleModelTypeChange(event)
                            }}
                        />
                    </Col>
                    <Col xs="auto">
                        <Form.Check
                            type={'radio'} label={'BERT'}
                            value={'bert'} checked={this.state.modelType === 'bert'}
                            onChange={(event) => {
                                event.persist();
                                this.handleModelTypeChange(event)
                            }}
                        />
                    </Col>
                </Row>
                <h5>Language</h5>
                <Row className="justify-content-md-center">
                    <Col md="auto">
                        <Form.Check
                            type={'radio'} label={'Russian'} value={'ru'} checked={this.state.lang === 'ru'}
                            onChange={(event) => {
                                event.persist();
                                this.handleLangChange(event)
                            }}
                        />
                    </Col>
                    <Col md="auto">
                        <Form.Check
                            type={'radio'} label={'English'} value={'en'} checked={this.state.lang === 'en'}
                            onChange={(event) => {
                                event.persist();
                                this.handleLangChange(event)
                            }}
                        />
                    </Col>
                </Row>
                {variableModelSettings}
            </div>
        )
    }

}

export default ModelSettings;