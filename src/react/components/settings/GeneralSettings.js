import {Col, Form, FormControl, Row} from "react-bootstrap";
import React from "react";

let marginTop = '50px'

export function ChooseMainTask(props) {
    return (
        <Row className="justify-content-md-center" style={{lineHeight: '22px'}}>
            <Col xs="auto">
                <Form.Check
                    type={'radio'} id={'cv'} label={'CV'} style={{fontSize: '28px'}}
                    value={'cv'} checked={props.pushedTask && props.task === 'cv'}
                    onChange={(event) => {
                        event.persist();
                        props.changeTaskChoice(event)
                    }}
                />
            </Col>
            <Col xs="auto">
                <Form.Check
                    type={'radio'} id={'nlp'} label={'NLP'} style={{fontSize: '28px'}}
                    value={'nlp'} checked={props.pushedTask && props.task === 'nlp'}
                    onChange={(event) => {
                        event.persist();
                        props.changeTaskChoice(event)
                    }}
                />
            </Col>
        </Row>
    )
}


export function ChooseSubTask(props) {
    if (!props.pushedTask) {
        return null
    }

    if (props.task === 'cv') {
        return (
            <div className="ChooseSubTask">
                <header className="chooseSubTask" style={{height: '30px'}}>
                    <Row className="justify-content-md-center" style={{marginTop: marginTop, lineHeight: '20px'}}>
                        <Col xs="auto">
                            <Form.Check
                                type={'radio'} id={'choiceImclf'} label={'Image classification'}
                                style={{fontSize: '24px'}}
                                value={'imclf'} checked={props.pushedSubTask && props.subTask === 'imclf'}
                                onChange={(event) => {
                                    event.persist();
                                    props.changeSubTaskChoice(event)
                                }}
                            />
                        </Col>
                        <Col xs="auto">
                            <Form.Check
                                type={'radio'} id={'choiceImsgm'} label={'Image segmentation'}
                                style={{fontSize: '24px'}}
                                value={'imsgm'} checked={props.pushedSubTask && props.subTask === 'imsgm'}
                                onChange={(event) => {
                                    event.persist();
                                    props.changeSubTaskChoice(event)
                                }}
                            />
                        </Col>
                    </Row>
                </header>
            </div>
        );
    } else {
        return (
            <div className="ChooseSubTask">
                <header className="chooseSubTask" style={{height: '30px'}}>
                    <Row className="justify-content-md-center" style={{marginTop: marginTop, lineHeight: '20px'}}>
                        <Col xs="auto">
                            <Form.Check
                                type={'radio'} id={'choiceTxtclf'} label={'Text classification'}
                                style={{fontSize: '24px'}}
                                value={'txtclf'} checked={props.pushedSubTask && props.subTask === 'txtclf'}
                                onChange={(event) => {
                                    event.persist();
                                    props.changeSubTaskChoice(event)
                                }}
                            />
                        </Col>
                    </Row>
                </header>
            </div>
        );
    }
}


export function ChooseNames(props) {
    if (!props.pushedSubTask) {
        return null
    }

    return (
        <Row className="justify-content-md-center" style={{marginTop: marginTop}}>
            <Col xs="auto" style={{marginRight: '30px'}}>
                <FormControl
                    placeholder="Project name"
                    onChange={props.changeProjectName}
                    value={props.projectName}
                />
            </Col>
            <Col xs="auto">
                <FormControl
                    placeholder="Experiment name"
                    onChange={props.changeExpName}
                    value={props.expName}
                />
            </Col>
        </Row>
    )
}