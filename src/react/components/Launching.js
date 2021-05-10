import {Button, Dropdown, DropdownButton} from "react-bootstrap";
import React, {Component} from "react";

const {ipcRenderer} = window.require("electron");

export function TrainButtons(props) {
    if (!props.show) {
        return null
    }
    if (!props.training) {
        return (
            <Button
                variant="success"
                type="submit"
                size={'lg'}
                onClick={props.runTraining}
            >Train!</Button>
        )
    } else {
        return (
            <Button
                variant="danger"
                type="submit"
                size={'lg'}
                onClick={props.stopTraining}
            >Stop training!</Button>
        )
    }
}

export class TBButtons extends Component {
    constructor(props) {
        super(props);
        this.state = {
            tbLink: '',
            tbLaunched: false,
            waiting: false
        }
    }

    launchTB(key) {
        console.log(key);
        this.setState(state => {
            state.waiting = true
            return state
        })
        ipcRenderer.send('launchTB', {
            taskTypeForTB: key
        });
    }

    killTB() {
        ipcRenderer.send('killTB');
    }

    componentDidMount() {
        ipcRenderer.on('tbLaunched', function (e, args) {
            if (args.status === 'ok') {
                let tbLink = args.tbLink;
                this.setState(state => {
                    state.tbLink = tbLink;
                    state.tbLaunched = true;
                    state.waiting = false
                    return state
                })
            } else if (args.status === 'error') {

            }

        }.bind(this));

        ipcRenderer.on('tbKilled', function (e, data) {
            console.log(data)
            this.setState(state => {
                state.tbLaunched = false;
                state.tbLink = '';
                return state
            })
        }.bind(this));
    }

    render() {
        if (!this.props.show) {
            return null
        }
        if (!this.state.tbLaunched) {
            return (
                <DropdownButton title={'Launch TensorBoard'}
                                variant="success"
                                type="submit"
                                onSelect={this.launchTB.bind(this)}
                                disabled={this.state.waiting}>
                    <Dropdown.Item eventKey={'imclf'}>Image classification</Dropdown.Item>
                    <Dropdown.Item eventKey={'imsgm'}>Image segmentation</Dropdown.Item>
                    <Dropdown.Item eventKey={'txtclf'}>Text classification</Dropdown.Item>
                </DropdownButton>
            )
        } else {
            let link = <a href={this.state.tbLink} target={'_blank'} rel={"noopener noreferrer"}>{this.state.tbLink}</a>;
            return (
                <div>
                    <h5>TensorBoard is running on {link}</h5>
                    <Button
                        variant="danger"
                        type="submit"
                        size={'sm'}
                        onClick={this.killTB}
                    >Kill TensorBoard</Button>
                </div>
            )
        }
    }
}
