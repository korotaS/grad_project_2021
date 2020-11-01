import React  from 'react';

const {ipcRenderer} = window.require("electron");

export default function Status(props) {
    return <h3>Project "{props.projectName}" status: {props.status}</h3>
}

