import React from 'react';
import ReactDOM from 'react-dom';
import './react/index.css';
import Main from "./react/components/Main";
import * as serviceWorker from './react/serviceWorker';

const {ipcRenderer} = window.require("electron");


ReactDOM.render(
    <Main/>,
    document.getElementById('main')
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
