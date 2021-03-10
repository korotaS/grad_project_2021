from threading import Thread

import yaml

from src.python.trainers import ImageClassificationTrainer, ImageSegmentationTrainer
from src.python.utils.utils import camel_to_snake


class TrainThread(Thread):
    def __init__(self, cfg):
        super().__init__()
        self.cfg = self.convert_params(cfg)
        subtask = self.cfg['general']['subtask']
        if subtask == 'imclf':
            self.trainer = ImageClassificationTrainer(self.cfg)
        elif subtask == 'imsgm':
            self.trainer = ImageSegmentationTrainer(self.cfg)

    def convert_params(self, d):
        new_d = {camel_to_snake(key): self.convert_params(value) if isinstance(value, dict) else value
                 for key, value in d.items()}
        return new_d

    def run(self):
        self.trainer.run()


# cfg = yaml.full_load(open('example_configs/imsgm.yaml'))
# thread = TrainThread(cfg)
# thread.start()
