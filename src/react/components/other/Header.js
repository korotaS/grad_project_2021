import React, {Component} from "react";
import {Button, Col, Row} from "react-bootstrap";
import {ExportModal} from "./Modals";
import {TBButtons} from "./Launching";

export default class Header extends Component {
    constructor(props) {
        super(props);
        this.state = {
            showExport: false
        }
    }

    setShowExport(value) {
        this.setState(state => {
            state.showExport = value
            return state
        })
    }

    render() {
        return (
            <div>
                <Row style={{marginTop: "10px"}} align={'center'}>
                    <Col>
                        <Button variant="outline-secondary"
                                onClick={() => this.setShowExport(true)}
                                size={'sm'}
                        >Export model</Button>
                    </Col>
                    <Col>
                        <TBButtons/>
                    </Col>
                    <Col>
                        <Button variant="outline-secondary"
                                size={'sm'}
                        >Change local to remote</Button>
                    </Col>
                </Row>
                <ExportModal
                    show={this.state.showExport}
                    onHide={() => this.setShowExport(false)}
                />
            </div>
        )
    }
}