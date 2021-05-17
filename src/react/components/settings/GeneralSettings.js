import {ButtonGroup, Col, Form, FormControl, Row, ToggleButton} from "react-bootstrap";
import React from "react";

export function ChooseMainTask(props) {
    return (
        <Row className="justify-content-md-center" style={{marginTop: "10px"}}>
            <ButtonGroup toggle size={'lg'}>
                <ToggleButton
                    type="radio" variant="primary" value={'cv'}
                    checked={props.pushedTask && props.task === 'cv'}
                    onChange={(event) => {
                        event.persist();
                        props.changeTaskChoice(event)
                    }}
                >
                    {'CV'}
                </ToggleButton>
                <ToggleButton
                    type="radio" variant="primary" value={'nlp'}
                    checked={props.pushedTask && props.task === 'nlp'}
                    onChange={(event) => {
                        event.persist();
                        props.changeTaskChoice(event)
                    }}
                >
                    {'NLP'}
                </ToggleButton>
            </ButtonGroup>
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
                <header className="chooseSubTask">
                    <Row className="justify-content-md-center" style={{marginTop: "10px"}}>
                        <Col xs="auto">
                            <Form.Check
                                type={'radio'} id={'choiceImclf'} label={'Image classification'}
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
                <header className="chooseSubTask">
                    <Row className="justify-content-md-center" style={{marginTop: "10px"}}>
                        <Col xs="auto">
                            <Form.Check
                                type={'radio'} id={'choiceTxtclf'} label={'Text classification'}
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
        <Row className="justify-content-md-center" style={{marginTop: "10px"}}>
            <Col xs="auto">
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