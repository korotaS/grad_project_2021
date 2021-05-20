import json
import traceback
from threading import Thread

import yaml
from pytorch_lightning.utilities.exceptions import MisconfigurationException

from src.python.trainers import ImageClassificationTrainer, ImageSegmentationTrainer, TextClassificationTrainer
from src.python.utils.seed import set_seed
from src.python.utils.streams import RedirectStdStreams
from src.python.utils.utils import StoppingTrainingException


class MainThread(Thread):
    def __init__(self, cfg, load_cfg=None, test_cfg=None, skt=None):
        super().__init__()
        self.cfg = cfg
        self.load_cfg = load_cfg
        self.skt = skt
        set_seed(42)
        self.test_cfg = test_cfg
        subtask = self.cfg['general']['subtask']
        if subtask == 'imclf':
            self.trainer = ImageClassificationTrainer(self.cfg, self.load_cfg, self.test_cfg)
        elif subtask == 'imsgm':
            self.trainer = ImageSegmentationTrainer(self.cfg, self.load_cfg, self.test_cfg)
        elif subtask == 'txtclf':
            self.trainer = TextClassificationTrainer(self.cfg, self.load_cfg, self.test_cfg)

    def run(self):
        try:
            with RedirectStdStreams(self.skt):
                self.skt.emit('log', 'START')
                self.trainer.run()
        except (StoppingTrainingException, MisconfigurationException):
            pass
        except Exception as e:
            ex_log = {
                'message': e.args[0],
                'name': e.__class__.__name__,
                'traceback': traceback.format_exc()
            }
            if self.skt is not None:
                self.skt.emit('exception', json.dumps(ex_log))

    def stop_training(self):
        try:
            self.trainer.stop_training()
        except (StoppingTrainingException, MisconfigurationException):
            pass


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

# cfg = yaml.full_load(open('example_configs/imclf.yaml'))
# thread = MainThread(cfg)
# thread.start()
