import os
import sys
from multiprocessing import Process


class TensorboardSupervisor:
    def __init__(self, log_dir, port=6006, expose=False, silent=False):
        self.server = TensorboardServer(log_dir, port, expose, silent)
        self.server.start()
        print("Started Tensorboard Server")

    def finalize(self):
        if self.server.is_alive():
            print('Killing Tensorboard Server')
            self.server.terminate()
            self.server.join()

    def __del__(self):
        self.finalize()


class TensorboardServer(Process):
    def __init__(self, log_dir, port, expose, silent):
        super().__init__()
        self.os_name = os.name
        self.log_dp = str(log_dir)
        self.port = port
        self.expose = expose
        self.silent = silent

    def run(self):
        bind = '--bind_all' if self.expose else ''
        devnull = ''
        if self.silent:
            if self.os_name == 'nt':
                devnull = '2> NUL'
            elif self.os_name == 'posix':
                devnull = '>/dev/null 2>&1'
        os.system(f'{sys.executable} -m tensorboard.main --logdir "{self.log_dp}" --port {self.port} {bind} {devnull}')


# tb_sup = TensorboardSupervisor('tb_logs/imclf/', port=8818, expose=True, silent=True)
# tb_sup.finalize()
