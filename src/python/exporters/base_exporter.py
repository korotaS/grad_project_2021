import os

from src.python.trainers import ImageClassificationTrainer, ImageSegmentationTrainer, TextClassificationTrainer


class BaseExporter:
    def __init__(self, cfg, checkpoint_path, export_folder, prefix=''):
        self.cfg = cfg
        self.checkpoint = checkpoint_path
        self.export_folder = export_folder
        self.prefix = prefix
        subtask = self.cfg['general']['subtask']
        if subtask == 'imclf':
            self.trainer = ImageClassificationTrainer(self.cfg)
        elif subtask == 'imsgm':
            self.trainer = ImageSegmentationTrainer(self.cfg)
        elif subtask == 'txtclf':
            self.trainer = TextClassificationTrainer(self.cfg)

        self.trainer.test_mode = True
        self.trainer.test_ckpt_path = self.checkpoint
        self.trainer.init_model()
        self.model = self.trainer.model.model
        self.model.eval()

        del self.trainer

        timestamp = self.checkpoint.split('_')[-1].split('.')[0]
        self.onnx_path = os.path.join(self.export_folder, f'{self.prefix}_{timestamp}.onnx')
        self.jit_path = os.path.join(self.export_folder, f'{self.prefix}_{timestamp}.jit')

    def export_onnx(self):
        pass

    def export_jit(self, device):
        pass
