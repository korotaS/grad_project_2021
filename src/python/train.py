from threading import Thread

import yaml

from src.python.trainers import ImageClassificationTrainer, ImageSegmentationTrainer, TextClassificationTrainer
from src.python.utils.utils import camel_to_snake


class MainThread(Thread):
    def __init__(self, cfg, test_cfg=None):
        super().__init__()
        self.cfg = self.convert_params(cfg)
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
        self.trainer.run()


# cfg = yaml.full_load(open('projects/project_1/experiment_1_20210417T135820/config.yaml'))
# test_cfg = yaml.full_load(open('example_configs/imclf_test.yaml'))

# cfg = yaml.full_load(open('projects/project_2/experiment_1_20210417T140139/config.yaml'))
# test_cfg = yaml.full_load(open('example_configs/imsgm_test.yaml'))

# cfg = yaml.full_load(open('projects/project_3/experiment_1_20210417T152656/config.yaml'))
# test_cfg = yaml.full_load(open('example_configs/txtclf_test.yaml'))
#
# thread = MainThread(cfg, test_cfg)
# thread.start()
