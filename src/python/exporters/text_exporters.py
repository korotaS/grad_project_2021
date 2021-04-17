import torch
import yaml

from src.python.exporters.base_exporter import BaseExporter


class TextClassificationExporter(BaseExporter):
    def __init__(self, cfg, checkpoint_path, export_folder, prefix=''):
        super().__init__(cfg, checkpoint_path, export_folder, prefix)
        self.model_type = self.cfg['model']['model_type']
        self.max_len = self.cfg['data']['max_item_len']
        if self.model_type == 'bert':
            self.model_name = self.cfg['model']['model_name']
        elif self.model_type == 'lstm':
            self.model.cpu()
            self._example_input = (torch.randint(0, 1, (1, self.max_len)),
                                   torch.randint(10, 20, (1,)))

    def export_onnx(self):
        print(f'Exporting ONNX model to {self.onnx_path}')
        if self.model_type == 'bert':
            pass
        elif self.model_type == 'lstm':
            torch.onnx.export(
                self.model,
                self._example_input,
                self.onnx_path,
                export_params=True,
                opset_version=11,
                do_constant_folding=True,
                input_names=['input_sentence', 'input_lengths'],
                output_names=['output'],
                dynamic_axes={
                    'input_sentence': [0, 1],
                    'input_lengths': [0],
                    'output': [0]
                }
            )

    def export_jit(self, device='cpu'):
        print(f'Exporting JIT model to {self.jit_path}')
        if self.model_type == 'bert':
            pass
        elif self.model_type == 'lstm':
            example_input = tuple(inp.to(device) for inp in self._example_input)
            module = torch.jit.trace(self.model.to(device), example_input)
            torch.jit.save(module, self.jit_path)


# exp = 'projects/project_3/experiment_1_20210417T152656'
# cfg = yaml.full_load(open(f'{exp}/config.yaml'))
# checkpoint = f'{exp}/weights/epoch=7_val_acc=0.64_20210417T152656.ckpt'
# export_folder = f'{exp}/weights/'
# exp = TextClassificationExporter(cfg, checkpoint, export_folder, prefix='txt_clf_lstm_0.64')
# exp.export_jit()
# exp.export_onnx()
