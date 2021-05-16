import os
from pathlib import Path

from src.python.trainers import ImageClassificationTrainer, ImageSegmentationTrainer, TextClassificationTrainer


class BaseExporter:
    def __init__(self, cfg, export_folder, prefix='', checkpoint_path=None, find_by_time=False, cfg_name=None):
        self.cfg = cfg
        self.checkpoint = checkpoint_path
        self.export_folder = export_folder
        self.prefix = prefix
        if find_by_time:
            assert cfg_name is not None
            self.checkpoint = self._find_by_time(cfg_name)
        subtask = self.cfg['general']['subtask']
        if subtask == 'imclf':
            self.trainer = ImageClassificationTrainer(self.cfg, test_mode=True)
        elif subtask == 'imsgm':
            self.trainer = ImageSegmentationTrainer(self.cfg, test_mode=True)
        elif subtask == 'txtclf':
            self.trainer = TextClassificationTrainer(self.cfg, test_mode=True)

        self.trainer.test_ckpt_path = self.checkpoint
        self.trainer.init_model(test_mode_external=True)
        self.model = self.trainer.model.model
        self.model.eval()

        del self.trainer

        timestamp = self.checkpoint.split('_')[-1].split('.')[0]
        self.onnx_path = os.path.join(self.export_folder, f'{self.prefix}_{timestamp}.onnx')
        self.jit_path = os.path.join(self.export_folder, f'{self.prefix}_{timestamp}.jit')

    # TODO: change it
    def _find_by_time(self, cfg_name):
        timestamp = cfg_name.split('.')[-2].split('_')[-1]
        assert len(timestamp) > 0
        folder = 'projects/'
        paths = list(Path(folder).rglob(f'*{timestamp}.ckpt'))
        if len(paths) == 0:
            raise FileNotFoundError
        path = sorted(paths, key=lambda p: p.as_posix().split('.')[-2].split('_')[-1])[-1].as_posix()
        return path

    def export_onnx(self):
        pass

    def export_jit(self, device):
        pass
