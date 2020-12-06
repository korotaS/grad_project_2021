import os
import json

from flask import Flask, jsonify, request

from src.python.train import TrainThread
from src.python.utils.architectures import get_architectures_by_type

app = Flask(__name__)

STATUS = 'ready'
THREAD = None


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


@app.route("/init", methods=['POST'])
def run_train():
    data = request.get_json(force=True)
    global STATUS
    global THREAD
    THREAD = TrainThread(data)
    # thread.start()
    return jsonify({'status': THREAD.status})


@app.route("/getArchs/<task>")
def get_archs(task):
    archs = get_architectures_by_type(task)
    return jsonify({'architectures': archs})


# @app.route("/runTrain/<project_name>")
# def run(project_name):
#     global STATUS
#     thread = TrainThread(project_name)
#     thread.start()
#     return jsonify({'status': STATUS})


if __name__ == "__main__":
    app.run(host='127.0.0.1', port=5000)
