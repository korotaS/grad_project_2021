import logging
import sys
from threading import Thread

from src.python.trainers import ImageClassificationTrainer, ImageSegmentationTrainer, TextClassificationTrainer
from src.python.utils.seed import set_seed
from src.python.utils.utils import camel_to_snake

# import yaml


class SocketStdOut(object):
    def __init__(self, skt):
        self.skt = skt

    def write(self, string):
        if '\\x1b' not in repr(string):
            self.skt.emit('log', string.rstrip('\n'))

    def flush(self):
        pass


class RedirectStdStreams(object):
    def __init__(self, skt):
        custom_stdout = SocketStdOut(skt)

        logger = logging.getLogger("lightning")
        logger.setLevel(logging.INFO)
        handler = logging.StreamHandler(custom_stdout)
        handler.setLevel(logging.INFO)
        logger.addHandler(handler)

        self._stdout = custom_stdout
        self._stderr = custom_stdout

    def __enter__(self):
        self.old_stdout, self.old_stderr = sys.stdout, sys.stderr
        self.old_stdout.flush()
        self.old_stderr.flush()
        sys.stdout, sys.stderr = self._stdout, self._stderr

    def __exit__(self, exc_type, exc_value, traceback):
        # self._stdout.flush()
        # self._stderr.flush()
        sys.stdout = self.old_stdout
        sys.stderr = self.old_stderr


class MainThread(Thread):
    def __init__(self, cfg, test_cfg=None, skt=None):
        super().__init__()
        self.skt = skt
        self.cfg = self.convert_params(cfg)
        set_seed(self.cfg['training']['seed'])
        self.test_cfg = test_cfg
        subtask = self.cfg['general']['subtask']
        if subtask == 'imclf':
            self.trainer = ImageClassificationTrainer(self.cfg, self.test_cfg)
        elif subtask == 'imsgm':
            self.trainer = ImageSegmentationTrainer(self.cfg, self.test_cfg)
        elif subtask == 'txtclf':
            self.trainer = TextClassificationTrainer(self.cfg, self.test_cfg)

    def convert_params(self, d):
        new_d = {camel_to_snake(key): self.convert_params(value) if isinstance(value, dict) else value
                 for key, value in d.items()}
        return new_d

    def run(self):
        with RedirectStdStreams(self.skt):
            self.trainer.run()


# cfg = yaml.full_load(open('projects/project_1/experiment_1_20210417T135820/config.yaml'))
# test_cfg = yaml.full_load(open('example_configs/imclf_test.yaml'))

# cfg = yaml.full_load(open('projects/project_2/experiment_1_20210418T204400/cfg_20210418T204400.yaml'))
# test_cfg = yaml.full_load(open('example_configs/imsgm_test.yaml'))

# lstm
# cfg = yaml.full_load(open('projects/project_3/experiment_1_20210417T152656/config.yaml'))
# test_cfg = yaml.full_load(open('example_configs/txtclf_test.yaml'))
# bert
# cfg = yaml.full_load(open('projects/project_3/experiment_1_20210417T154503/config.yaml'))
# test_cfg = yaml.full_load(open('example_configs/txtclf_test.yaml'))

# thread = MainThread(cfg, test_cfg)
# thread.start()
