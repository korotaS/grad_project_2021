import {Button, Col, Dropdown, DropdownButton, Form} from "react-bootstrap";
import React from "react";

export function InitialState(props) {
    if (!props.show) {
        return null
    }
    return (
        <Button
            variant="success"
            type="submit"
            size={'lg'}
            onClick={props.runTraining}
        >Train!</Button>
    )
}

export function StopTraining(props) {
    if (!props.show) {
        return null
    }
    return (
        <Button
            variant="danger"
            type="submit"
            size={'lg'}
            onClick={props.stopTraining}
        >Stop training!</Button>
    )
}

export function LaunchTB(props) {
    if (!props.show) {
        return null
    }
    return (
        <Form.Row className="align-items-center" style={{
            marginTop: '10px',
            marginLeft: '5px'
        }}>
            <Col xs="auto">
                <DropdownButton title={'Launch TensorBoard'}
                                variant="success"
                                type="submit"
                                onSelect={props.onSelect}
                >
                    <Dropdown.Item eventKey={'imclf'}>Image classification</Dropdown.Item>
                    <Dropdown.Item eventKey={'imsgm'}>Image segmentation</Dropdown.Item>
                    <Dropdown.Item eventKey={'txtclf'}>Text classification</Dropdown.Item>
                </DropdownButton>
            </Col>
        </Form.Row>
    )
}

export function TBLaunched(props) {
    if (!props.show) {
        return null
    }
    let link = <a href={props.tbLink} target={'_blank'}>{props.tbLink}</a>;
    return (
        <Form.Row className="align-items-center" style={{
            marginTop: '10px',
            marginLeft: '5px'
        }}>
            <Col xs="auto">
                <h5>TensorBoard is running on {link}. It will be terminated when the app closes.</h5>
            </Col>
        </Form.Row>

    )
}