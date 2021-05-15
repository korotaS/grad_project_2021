import subprocess
from signal import SIGTERM
from threading import Thread
from time import sleep


class TBThread(Thread):
    def __init__(self):
        super().__init__()
        self.tb_process = None

    def launch_tb(self, task_type, tb_port=6006):
        if self.tb_process is None:
            params = ['tensorboard', '--logdir', f'tb_logs/{task_type}/', '--port', str(tb_port)]
            self.tb_process = subprocess.Popen(params, stdout=subprocess.PIPE)
            sleep(3)
        return f'http://localhost:{tb_port}/'

    def kill_tb(self):
        if self.tb_process is not None:
            try:
                self.tb_process.send_signal(SIGTERM)
                self.tb_process = None
            except Exception:
                return 'not killed'
            return 'killed'
        return 'not killed'
