# Graduation project 2021 at SE FCS HSE
#### "Cross-platform Desktop Application for Automated Machine Learning Pipeline Building"

## Prerequisites

In order to run the application correctly, you need to have:

- node.js 14+ and npm 6+
- python 3.6+

## Installation

### macOS
```shell
sh init-macos.sh
```

### Windows

```shell
init-win.bat
```

## Run app
### With computations on local machine
Don't forget to enter the python environment!
```shell
npm start
```

### With computations on remote machine
To start the app: 
```shell
npm start
```
Then start flask server on remote host by running: 
```shell
python src/python/main.py --expose --port 1234
```
Then in the app click "Change local to remote" button, enter host/port of the remote 
machine and click "Connect". Now you can train models on the remove server!

## Tips
- In order to create correct dataset structure, check [datasets.md](datasets.md)
- You can run inference of the model with appropriate preprocessing class, see 
  example in this [notebook](examples/inference_onnx_model.ipynb)
