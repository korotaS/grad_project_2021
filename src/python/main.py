import os
import json

from flask import Flask, jsonify

from train import TrainThread

app = Flask(__name__)

STATUS = 'ready'


@app.route("/")
def ping():
    return jsonify({'status': STATUS})


@app.route("/trainStatus/<project_name>/<last_epoch>")
def train_status(project_name, last_epoch):
    with open(f'projects/{project_name}/log.json', 'r') as r:
        epochs = json.load(r)

    response = {'status': epochs['status']}
    if not epochs['epochs'] or epochs['epochs'][-1]['epoch_num'] == int(last_epoch):
        response['new_epochs'] = None
    else:
        response['new_epochs'] = epochs['epochs'][int(last_epoch):]

    return jsonify(response)


@app.route("/runTrain/<project_name>")
def run(project_name):
    global STATUS
    thread = TrainThread(project_name)
    thread.start()
    return jsonify({'status': STATUS})


if __name__ == "__main__":
    app.run(host='127.0.0.1', port=5000)