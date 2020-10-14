import React from 'react';
import ReactDOM from 'react-dom';
import './react/index.css';
import Epochs from './react/components/epochs/Epochs'
import Choose1 from "./react/components/choose/Choose1";
import * as serviceWorker from './react/serviceWorker';

// ReactDOM.render(
//     <Epochs />,
//   document.getElementById('root')
// );
ReactDOM.render(
    <Choose1 />,
  document.getElementById('choose1')
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
