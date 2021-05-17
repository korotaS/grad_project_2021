import argparse
import os
import sys

import yaml
from flask import jsonify, request
import torch

sys.path.append(os.getcwd())

from src.python.app import socketio, app
from src.python.train import MainThread
from src.python.tb import TBThread
from src.python.export import ExportThread
from src.python.utils.utils import validate_config

STATUS = 'ready'
THREAD = None
TB_THREAD = TBThread()
TB_THREAD.start()
EXP_THREAD = None


@app.route("/health")
def ping():
    return jsonify({'status': 'ok'})


@app.route("/runTraining", methods=['POST'])
def run_train():
    data = request.get_json(force=True)
    global STATUS
    global THREAD
    THREAD = MainThread(data['config'], data['loadConfig'], skt=socketio)
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
    try:
        cfg = yaml.full_load(open(cfg_path))
    except FileNotFoundError:
        return jsonify({'status': 'error', 'errorMessage': f'File {cfg_path} not found.'})
    except Exception:
        return jsonify({'status': 'error', 'errorMessage': f"Can't load file {cfg_path}"})
    export_type = data['exportType']

    global EXP_THREAD
    try:
        EXP_THREAD = ExportThread(cfg=cfg,
                                  cfg_name=cfg_path,
                                  export_folder=folder,
                                  prefix=prefix,
                                  export_type=export_type,
                                  skt=socketio)
        path = EXP_THREAD.run()
        return jsonify({'status': 'ok', 'outPath': path})
    except FileNotFoundError:
        return jsonify({'status': 'error', 'errorMessage': f'.ckpt file for this config not found.'})
    except Exception as e:
        return jsonify({'status': 'error', 'errorMessage': f'{e.__class__.__name__}: {e.args[0]}'})


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


@app.route("/getNumGpus")
def get_num_gpu():
    return jsonify({'numGpus': torch.cuda.device_count()})


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument('--port', type=int, default=5000, required=False)
    parser.add_argument('--expose', default=False, action='store_true', required=False)
    args = parser.parse_args()
    port = args.port
    expose = args.expose
    host = '0.0.0.0' if expose else '127.0.0.1'
    socketio.run(app, host=host, port=port)
