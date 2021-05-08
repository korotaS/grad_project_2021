import argparse
import json
import os
import sys

from flask import jsonify, request
import torch

sys.path.append(os.getcwd())

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


@app.route("/killTB")
def kill_tb():
    global TB_THREAD
    killed = TB_THREAD.kill_tb()
    return jsonify({'status': 'ok', 'info': killed})


@app.route("/getArchs/<task>")
def get_archs(task):
    archs = get_image_architectures_by_type(task)
    return jsonify({'architectures': archs})


@app.route("/getNumGpus")
def get_num_gpu():
    return jsonify({'numGpus': torch.cuda.device_count()})


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument('--port', type=int, default=5000, required=False)
    args = parser.parse_args()
    port = args.port
    socketio.run(app, host='127.0.0.1', port=port)
