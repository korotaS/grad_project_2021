from src.python.exporters import ImageExporter, TextClassificationExporter
from src.python.utils.streams import RedirectStdStreams


class Exporter:
    def __init__(self, cfg, cfg_name, export_folder, prefix, export_type, skt=None):
        super().__init__()
        self.cfg = cfg
        self.skt = skt
        self.export_type = export_type
        subtask = self.cfg['general']['subtask']
        if subtask in ['imclf', 'imsgm']:
            self.trainer = ImageExporter(cfg=self.cfg,
                                         export_folder=export_folder,
                                         cfg_name=cfg_name,
                                         prefix=prefix,
                                         find_by_time=True)
        elif subtask == 'txtclf':
            self.trainer = TextClassificationExporter(cfg=self.cfg,
                                                      export_folder=export_folder,
                                                      cfg_name=cfg_name,
                                                      prefix=prefix,
                                                      find_by_time=True)

    def run(self):
        with RedirectStdStreams(self.skt):
            path = ''
            if self.export_type == 'onnx':
                self.trainer.export_onnx()
                path = self.trainer.onnx_path
            elif self.export_type == 'jit':
                self.trainer.export_jit()
                path = self.trainer.jit_path
            return path
