import torch
import yaml

from src.python.exporters.base_exporter import BaseExporter


class ImageExporter(BaseExporter):
    def __init__(self, cfg, export_folder, prefix='', checkpoint_path=None, find_by_time=False, cfg_name=None):
        super().__init__(cfg, export_folder, prefix, checkpoint_path, find_by_time, cfg_name)
        self.height = self.cfg['data']['height']
        self.width = self.cfg['data']['width']
        self._example_input = torch.rand(1, 3, self.height, self.width)

    def export_onnx(self):
        print(f'Exporting ONNX model to {self.onnx_path}')
        torch.onnx.export(
            self.model.cpu(),
            self._example_input,
            self.onnx_path,
            export_params=True,
            opset_version=11,
            do_constant_folding=True,
            input_names=['input'],
            output_names=['output'],
            dynamic_axes={
                'input': {0: 'batch_size', 2: 'width', 3: 'height'},
                'output': {0: 'batch_size', 2: 'width', 3: 'height'}
            }
        )

    def export_jit(self, device='cpu'):
        print(f'Exporting JIT model to {self.jit_path}')
        module = torch.jit.trace(self.model.to(device), (self._example_input.to(device)))
        torch.jit.save(module, self.jit_path)


# exp = 'projects/project_2/experiment_1_20210417T140139'
# cfg = yaml.full_load(open(f'{exp}/config.yaml'))
# checkpoint = f'{exp}/weights/epoch=4_val_iou=0.969_20210417T140139.ckpt'
# export_folder = f'{exp}/weights/'
# exp = ImageExporter(cfg, checkpoint, export_folder, prefix='im_sgm_0.969')
# exp.export_jit()
# exp.export_onnx()
