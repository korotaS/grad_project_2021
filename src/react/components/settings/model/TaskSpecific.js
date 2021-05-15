import React, {Component} from "react";
import {Col, Form, Row} from "react-bootstrap";
import {Numeric} from "../Common";

export class ModelSettingsForImclf extends Component {
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

        this.props.clearTaskSpecificState(this.props.type);
        for (const [key, value] of Object.entries(this.state)) {
            if (key !== 'architectures') {
                this.props.handleTaskSpecificState(this.props.type, key, value)
            }
        }
    }

    handleSelectChange(event) {
        let value = event.target.value;
        this.props.handleTaskSpecificState(this.props.type, 'architecture', value)
        this.setState(state => {
            state.architecture = value
            return state
        })
    }

    handleFreezeCheckbox(event) {
        this.props.handleTaskSpecificState(this.props.type, 'freezeBackbone', event.target.checked)
        this.setState(state => {
            state.freezeBackbone = event.target.checked
            return state
        })
    }

    handlePretrainedCheckbox(event) {
        this.props.handleTaskSpecificState(this.props.type, 'pretrained', event.target.checked)
        this.setState(state => {
            state.pretrained = event.target.checked
            return state
        })
    }

    render() {
        return (
            <div>
                <h5>Architecture</h5>
                <Form.Control as="select" custom style={{width: '50%'}}
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

export class ModelSettingsForImsgm extends Component {
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

        this.props.clearTaskSpecificState(this.props.type);
        for (const [key, value] of Object.entries(this.state)) {
            if (key !== 'architectures' && key !== 'backbones') {
                this.props.handleTaskSpecificState(this.props.type, key, value)
            }
        }
    }

    handleArchChange(event) {
        let value = event.target.value;
        this.props.handleTaskSpecificState(this.props.type, 'architecture', value)
        this.setState(state => {
            state.architecture = value
            return state
        })
    }

    handleBackboneChange(event) {
        let value = event.target.value;
        this.props.handleTaskSpecificState(this.props.type, 'backbone', value)
        this.setState(state => {
            state.backbone = value
            return state
        })
    }

    handlePretrainedCheckbox(event) {
        this.props.handleTaskSpecificState(this.props.type, 'pretrained', event.target.checked)
        this.setState(state => {
            state.pretrained = event.target.checked
            return state
        })
    }

    render() {
        return (
            <div>
                <h5>Architecture</h5>
                <Form.Control as="select" custom style={{width: '50%'}}
                              onChange={this.handleArchChange.bind(this)}>
                    {this.state.architectures.map((obj, index) => {
                        return (
                            <option key={index} value={obj}>{obj}</option>
                        )
                    })}
                </Form.Control>

                <h5>Backbone</h5>
                <Form.Control as="select" custom style={{width: '50%'}}
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

export class ModelSettingsForTxtclf extends Component {
    constructor(props) {
        super(props)

        let currLang = props.defaultState.lang || 'en';
        let currEmbeddings = props.defaultState.embeddings || currLang === 'ru' ? 'ru_fasttext_300' : 'en_glove-wiki-gigaword-50'
        let currModelNames = currLang === 'en' ? ['distilbert-base-uncased', 'bert-base-uncased'] : ['DeepPavlov/rubert-base-cased']
        let currModelName = props.defaultState.modelName || currLang === 'en' ? 'distilbert-base-uncased' : 'DeepPavlov/rubert-base-cased'

        this.state = {
            modelNames: currModelNames,
            embeddingNames: [
                'en_glove-wiki-gigaword-50', 'en_glove-wiki-gigaword-100', 'en_glove-wiki-gigaword-200',
                'en_glove-wiki-gigaword-300', 'en_glove-twitter-25', 'ru_fasttext_300', 'en_fasttext_300'
            ],

            modelType: props.modelType || 'lstm',
            lang: currLang,
            nHidden: props.defaultState.nHidden || '128',
            modelName: currModelName,
            embeddings: currEmbeddings
        }

        this.props.clearTaskSpecificState(this.props.type);
        for (const [key, value] of Object.entries(this.state)) {
            if (key !== 'modelNames' && key !== 'embeddingNames') {
                this.props.handleTaskSpecificState(this.props.type, key, value)
            }
        }
    }

    handleModelTypeChange(event) {
        let value = event.target.value
        this.props.handleTaskSpecificState(this.props.type, 'modelType', event.target.value)
        this.setState(state => {
            state.modelType = value;
            return state
        })
    }

    handleLangChange(event) {
        let lang = event.target.value;
        // change embeddings and model with language
        let currEmbeddings = lang === 'ru' ? 'ru_fasttext_300' : 'en_glove-wiki-gigaword-50'
        let currModelName = lang === 'ru' ? 'DeepPavlov/rubert-base-cased' : 'distilbert-base-uncased'
        this.handleEmbeddingsChange(null, currEmbeddings)
        this.handleModelNameChange(null, currModelName)

        this.props.handleTaskSpecificState(this.props.type, 'lang', lang)
        this.setState(state => {
            state.lang = lang
            state.modelNames = lang === 'en' ? ['distilbert-base-uncased', 'bert-base-uncased'] : ['DeepPavlov/rubert-base-cased']
            return state
        })
    }

    handleModelNameChange(event, fromValue = null) {
        let value;
        if (fromValue !== null) {
            value = fromValue
        } else {
            value = event.target.value;
        }
        this.props.handleTaskSpecificState(this.props.type, 'modelName', value)
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
        this.props.handleTaskSpecificState(this.props.type, 'embeddings', value)
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
                    <Numeric value={this.state.nHidden} nameKey={'nHidden'} type={this.props.type}
                             passData={this.props.handleTaskSpecificState} max={2048}/>

                    <h5>Embeddings</h5>
                    <Form.Control as="select" custom style={{width: '50%'}}
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
                    <Form.Control as="select" custom style={{width: '50%'}}
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