import React from 'react';
import ReactDOM from 'react-dom';
import './react/index.css';
import Epochs from './react/components/epochs/Epochs'
import Choose1 from "./react/components/choose/Choose1";
import Choose2 from "./react/components/choose/Choose2";
import * as serviceWorker from './react/serviceWorker';
const {ipcRenderer} = window.require("electron");

// ReactDOM.render(
//     <Epochs />,
//   document.getElementById('root')
// );
ReactDOM.render(
    <Choose1 />,
  document.getElementById('choose1')
);
ipcRenderer.on('afterChoice1', function (e, item) {
    ReactDOM.render(
        <Choose2 taskClass={item}/>,
        document.getElementById('choose2')
    );
});

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
