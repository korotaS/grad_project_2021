from threading import Thread

from tensorboard import program


class TBThread(Thread):
    def __init__(self):
        super().__init__()
        self.tb = None
        self.tb_url = ''

    def launch_tb(self, task_type, tb_port=6006):
        if self.tb is None:
            self.tb = program.TensorBoard()
            self.tb.configure(argv=[None, '--logdir', f'tb_logs/{task_type}/', '--port', str(tb_port)])
            self.tb_url = self.tb.launch()
        return self.tb_url
