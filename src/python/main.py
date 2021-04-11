import json
import argparse

from flask import jsonify, request

from src.python.app import socketio, app
from src.python.train import TrainThread
from src.python.architectures import get_image_architectures_by_type

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
    THREAD.start()
    return jsonify({'status': THREAD.status})


@app.route("/getArchs/<task>")
def get_archs(task):
    archs = get_image_architectures_by_type(task)
    return jsonify({'architectures': archs})


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument('--port', type=int, default=5000)
    args = parser.parse_args()
    port = args.port
    socketio.run(app, host='127.0.0.1', port=port, debug=True)
