import torch
import yaml

from src.python.exporters.base_exporter import BaseExporter


class ImageExporter(BaseExporter):
    def __init__(self, cfg, checkpoint_path, export_folder, prefix=''):
        super().__init__(cfg, checkpoint_path, export_folder, prefix)
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
            opset_version=10,
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


# cfg = yaml.full_load(open('projects/project_1/experiment_1_20210417T135820/config.yaml'))
# checkpoint = 'projects/project_1/experiment_1_20210417T135820/weights/epoch=1_val_acc=0.937_20210417T135820.ckpt'
# export_folder = 'projects/project_1/experiment_1_20210417T135820/weights/'
# exp = ImageExporter(cfg, checkpoint, export_folder, prefix='im_clf_mobilenet_0.94')
# exp.export_jit()
# exp.export_onnx()
