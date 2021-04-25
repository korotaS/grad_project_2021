import json
import argparse

from flask import jsonify, request

from src.python.app import socketio, app
from src.python.train import MainThread
from src.python.tb import TBThread
from src.python.export import ExportThread
from src.python.utils.utils import validate_config
from src.python.architectures import get_image_architectures_by_type

STATUS = 'ready'
THREAD = None
TB_THREAD = TBThread()
TB_THREAD.start()
EXP_THREAD = None


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
    THREAD = MainThread(data, skt=socketio)
    THREAD.start()
    return jsonify({'status': 'ok'})


@app.route("/stopTraining")
def stop_training():
    global THREAD
    if THREAD is not None:
        THREAD.stop_training()
        THREAD = None
    return jsonify({'status': 'ok'})


@app.route("/validateConfig", methods=['POST'])
def validate_config_handler():
    cfg = request.get_json(force=True)
    return jsonify(validate_config(cfg))


@app.route("/export", methods=['POST'])
def export():
    data = request.get_json(force=True)
    folder = data['folder']
    cfg_path = data['cfgPath']
    prefix = data['prefix']
    cfg = data['cfg']
    export_type = data['exportType']

    global EXP_THREAD
    EXP_THREAD = ExportThread(cfg=cfg,
                              cfg_name=cfg_path,
                              export_folder=folder,
                              prefix=prefix,
                              export_type=export_type,
                              skt=socketio)
    path = EXP_THREAD.run()
    return jsonify({'status': 'ok', 'outPath': path})


@app.route("/launchTB/<task_key>/<tb_port>")
def launch_tb(task_key, tb_port):
    global TB_THREAD
    url = TB_THREAD.launch_tb(task_type=task_key, tb_port=tb_port)
    return jsonify({'status': 'ok', 'url': url})


@app.route("/getArchs/<task>")
def get_archs(task):
    archs = get_image_architectures_by_type(task)
    return jsonify({'architectures': archs})


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument('--port', type=int, default=5000, required=False)
    args = parser.parse_args()
    port = args.port
    socketio.run(app, host='127.0.0.1', port=port)
