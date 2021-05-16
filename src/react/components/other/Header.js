import React, {Component} from "react";
import {Button, Col, Row} from "react-bootstrap";
import {ExportModal, LoadFromConfigModal, LocalToRemoteModal, RemoteToLocalModal} from "./Modals";
import {TBButtons} from "./Launching";

export default class Header extends Component {
    constructor(props) {
        super(props);
        this.state = {
            showExport: false,
            showLoad: false,
            showRemoteToLocal: false,
            showLocalToRemote: false
        }
    }

    setShowExport(value) {
        this.setState(state => {
            state.showExport = value
            return state
        })
    }

    setShowLoad(value) {
        this.setState(state => {
            state.showLoad = value
            return state
        })
    }

    setShowRemoteToLocal(value) {
        this.setState(state => {
            state.showRemoteToLocal = value
            return state
        })
    }

    setShowLocalToRemote(value) {
        this.setState(state => {
            state.showLocalToRemote = value
            return state
        })
    }

    render() {
        let serverButton
        if (this.props.remoteToLocal) {
            serverButton = (
                <Button variant="outline-secondary"
                        size={'sm'}
                        onClick={() => this.setShowRemoteToLocal(true)}
                >Change remote to local</Button>
            )
        } else {
            serverButton = (
                <Button variant="outline-secondary"
                        size={'sm'}
                        onClick={() => this.setShowLocalToRemote(true)}
                >Change local to remote</Button>
            )
        }
        return (
            <div>
                <Row style={{marginTop: "10px"}} align={'center'}>
                    {/*<Col>*/}
                    {/*    <Button variant="outline-secondary"*/}
                    {/*            onClick={() => this.setShowLoad(true)}*/}
                    {/*            size={'sm'}*/}
                    {/*    >Load from config</Button>*/}
                    {/*</Col>*/}
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
                        {serverButton}
                    </Col>
                </Row>
                {/*<LoadFromConfigModal show={this.state.showLoad}*/}
                {/*                     onHide={() => this.setShowLoad(false)}*/}
                {/*                     remote={this.props.remoteToLocal}*/}
                {/*                     loadParamsFromConfig={this.props.loadParamsFromConfig}/>*/}
                <ExportModal show={this.state.showExport}
                             onHide={() => this.setShowExport(false)}
                             remote={this.props.remoteToLocal}/>
                <LocalToRemoteModal show={this.state.showLocalToRemote}
                                    onHide={(status) => {
                                        this.setShowLocalToRemote(false)
                                        this.props.onHideLocalToRemoteModal(status)
                                    }}/>
                <RemoteToLocalModal show={this.state.showRemoteToLocal}
                                    onHide={(status) => {
                                        this.setShowRemoteToLocal(false)
                                        this.props.onHideRemoteToLocalModal(status)
                                    }}/>
            </div>
        )
    }
}