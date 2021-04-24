import React from 'react';
import ReactDOM from 'react-dom';
import './react/index.css';
import ChooseTask from "./react/components/choose/ChooseTask";
import ChooseSubTask from "./react/components/choose/ChooseSubTask";
import ChooseDataset from "./react/components/choose/ChooseDataset";
import ChooseArchitecture from "./react/components/choose/ChooseArchitecture";
import Status from "./react/components/utils/Utils"
import ChooseConfig from "./react/components/choose/ChooseConfig";
import ChooseExport from "./react/components/choose/ChooseExport";
import * as serviceWorker from './react/serviceWorker';
const {ipcRenderer} = window.require("electron");


ReactDOM.render(
    <ChooseConfig />,
  document.getElementById('chooseConfig')
);
ReactDOM.render(
    <ChooseTask />,
  document.getElementById('chooseTask')
);
ReactDOM.render(
    <ChooseExport />,
  document.getElementById('chooseExport')
);
// ipcRenderer.on('afterChoice1', function (e, item) {
//     ReactDOM.render(
//         <ChooseSubTask {...item}/>,
//         document.getElementById('chooseSubTask')
//     );
// });
// ipcRenderer.on('afterChoice2', function (e, item) {
//     ReactDOM.render(
//         <ChooseDataset {...item}/>,
//         document.getElementById('chooseDataset')
//     );
// });
// ipcRenderer.on('afterChoice3', function (e, item) {
//     ReactDOM.render(
//         <ChooseArchitecture {...item}/>,
//         document.getElementById('chooseArchitecture')
//     );
// });
// ipcRenderer.on('projectInitialized', function (e, projectName) {
//     ReactDOM.render(
//         <Status projectName={projectName} status={'initialized'}/>,
//         document.getElementById('projectStatus')
//     );
// });

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
